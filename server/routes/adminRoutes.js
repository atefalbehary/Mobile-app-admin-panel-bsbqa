import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function roleToUserType(role) {
  const r = String(role);
  if (r === "3") return "agent";
  if (r === "4") return "agency";
  if (r === "2") return "user";
  return "user";
}

function isAdminUser(row) {
  return String(row.role) === "1" || row.role === 1 || row.role_id != null;
}

function mapProfile(row, agencyName) {
  const verified = Number(row.verified) === 1;
  return {
    id: String(row.id),
    user_id: String(row.id),
    name: row.name || "",
    email: row.email || "",
    phone: row.phone ? `${row.dial_code || ""}${row.phone}` : null,
    user_type: roleToUserType(row.role),
    is_active: Number(row.active) === 1,
    approval_status: verified ? "approved" : "pending",
    agency_name: agencyName || null,
    company_name: null,
    brokerage_license_url: row.license || null,
    authorized_signatory_id_url: row.authorized_signatory || null,
    cr_url: row.cr || null,
    establishment_card_url: null,
    trade_license_url: row.trade_license || null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapProperty(row) {
  const cat = row.category_name || "";
  const typeSlug = cat ? String(cat).toLowerCase().replace(/\s+/g, "_") : "apartment";
  let status = "inactive";
  if (Number(row.active) === 1 && !Number(row.is_sold)) status = "active";
  if (Number(row.is_sold) === 1) status = "sold";
  const saleType = Number(row.sale_type) === 2 ? "rent" : "sale";
  return {
    id: String(row.id),
    name: row.name,
    name_ar: row.name_ar,
    property_type: typeSlug,
    status,
    price: row.price != null ? Number(row.price) : null,
    currency: "QAR",
    bedroom_count: row.bedrooms,
    bathroom_count: row.bathrooms,
    gross_area: row.gross_area != null ? parseFloat(String(row.gross_area)) || 0 : null,
    location: row.location,
    is_featured: !!row.is_featured,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    unit_number: row.apartment_no || null,
    project: row.project_name || null,
    sale_type: saleType,
  };
}

function htmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function registerAdminRoutes(app, pool, jwtSecret) {
  const router = express.Router();
  const uploadDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const upload = multer({ dest: uploadDir });

  const auth = (req, res, next) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    try {
      const payload = jwt.verify(h.slice(7), jwtSecret);
      req.admin = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND deleted = 0 LIMIT 1",
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || !user.password) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    if (!isAdminUser(user)) return res.status(403).json({ error: "Not an admin user" });
    const token = jwt.sign({ sub: String(user.id), email: user.email }, jwtSecret, { expiresIn: "7d" });
    res.json({
      token,
      user: { id: String(user.id), email: user.email, name: user.name || "" },
    });
  });

  router.get("/auth/me", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT id, email, name FROM users WHERE id = ? LIMIT 1", [req.admin.sub]);
    const u = rows[0];
    if (!u) return res.status(401).json({ error: "User not found" });
    res.json({ id: String(u.id), email: u.email, name: u.name || "" });
  });

  async function loadAgencyNames(userIds) {
    const map = {};
    if (!userIds.length) return map;
    const [agents] = await pool.query(
      `SELECT u.id, u.agency_id, a.name AS agency_name FROM users u LEFT JOIN users a ON a.id = u.agency_id WHERE u.id IN (${userIds.map(() => "?").join(",")})`,
      userIds
    );
    for (const a of agents) {
      if (a.agency_name) map[a.id] = a.agency_name;
    }
    return map;
  }

  function parseSpecificEmails(input) {
    const list = Array.isArray(input) ? input : String(input || "").split(/[,\n]/);
    return [...new Set(list.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))];
  }

  async function resolveNotificationRecipients(target, specificEmailsInput) {
    const targetKey = String(target || "all").toLowerCase();
    if (targetKey === "specific_email") {
      const emails = parseSpecificEmails(specificEmailsInput);
      if (!emails.length) {
        return [];
      }
      const placeholders = emails.map(() => "?").join(",");
      const [rows] = await pool.query(
        `SELECT id, name, email, role, verified FROM users
         WHERE deleted = 0 AND role IN ('2','3','4') AND LOWER(email) IN (${placeholders})
         ORDER BY id ASC`,
        emails
      );
      return rows.map((r) => ({
        id: Number(r.id),
        name: r.name || "",
        email: r.email ? String(r.email).trim().toLowerCase() : "",
      }));
    }

    let sql =
      "SELECT id, name, email, role, verified FROM users WHERE deleted = 0 AND role IN ('2','3','4')";
    if (targetKey === "agents") sql += " AND role = '3'";
    if (targetKey === "agencies") sql += " AND role = '4'";
    if (targetKey === "approved") sql += " AND verified = 1";
    sql += " ORDER BY id ASC";
    const [rows] = await pool.query(sql);
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name || "",
      email: r.email ? String(r.email).trim() : "",
    }));
  }

  async function persistUserNotifications(campaignId, payload, recipients, sentAt) {
    if (!recipients.length) return 0;
    const values = [];
    const placeholders = [];
    for (const recipient of recipients) {
      placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
      values.push(
        randomUUID(),
        campaignId,
        recipient.id,
        payload.title,
        payload.title_ar || null,
        payload.body || null,
        payload.body_ar || null,
        payload.delivery_channel || payload.type || "push",
        payload.target || "all",
        payload.deep_link || null,
        sentAt || null,
        JSON.stringify({ source_type: payload.source_type || "manual" })
      );
    }
    await pool.query(
      `INSERT INTO mobile_admin_user_notifications
      (id, campaign_id, user_id, title, title_ar, body, body_ar, channel, target, deep_link, sent_at, metadata, created_at, updated_at)
      VALUES ${placeholders.join(",")}`,
      values
    );
    return recipients.length;
  }

  async function sendNotificationEmails(payload, recipients) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.NOTIFICATION_EMAIL_FROM || user;
    if (!host || !from) return { attempted: false, sent: 0, reason: "SMTP not configured" };

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    let sent = 0;
    const toList = recipients.map((r) => r.email).filter(Boolean);
    if (!toList.length) return { attempted: false, sent: 0, reason: "No recipient email addresses" };

    const subject = payload.title || "New notification";
    const safeTitle = htmlEscape(payload.title || "");
    const safeBody = htmlEscape(payload.body || "");
    const safeLink = payload.deep_link ? htmlEscape(payload.deep_link) : null;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">${safeTitle}</h2>
        ${safeBody ? `<p style="white-space:pre-wrap;margin:0 0 12px">${safeBody}</p>` : ""}
        ${safeLink ? `<p style="margin:0"><a href="${safeLink}" target="_blank" rel="noreferrer">${safeLink}</a></p>` : ""}
      </div>
    `;
    await transporter.sendMail({
      from,
      to: from,
      bcc: toList,
      subject,
      text: [payload.title || "", payload.body || "", payload.deep_link || ""].filter(Boolean).join("\n\n"),
      html,
    });
    sent = toList.length;
    return { attempted: true, sent, reason: null };
  }

  router.get("/profiles", auth, async (req, res) => {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE deleted = 0 AND role IN ('2','3','4') ORDER BY created_at DESC`
    );
    const agentIds = rows.filter((r) => String(r.role) === "3").map((r) => r.id);
    const agencyMap = await loadAgencyNames(agentIds);
    const out = rows.map((r) => mapProfile(r, String(r.role) === "3" ? agencyMap[r.id] : null));
    res.json(out);
  });

  router.patch("/profiles/:userId", auth, async (req, res) => {
    const { userId } = req.params;
    const body = req.body || {};
    const fields = [];
    const vals = {};
    if ("is_active" in body) {
      fields.push("active = :active");
      vals.active = body.is_active ? 1 : 0;
    }
    if ("approval_status" in body) {
      fields.push("verified = :verified");
      vals.verified = body.approval_status === "approved" ? 1 : 0;
    }
    if ("name" in body) {
      fields.push("name = :name");
      vals.name = body.name;
    }
    if ("email" in body) {
      fields.push("email = :email");
      vals.email = body.email;
    }
    if ("phone" in body) {
      fields.push("phone = :phone");
      vals.phone = body.phone;
    }
    if (!fields.length) return res.json({ ok: true });
    vals.id = userId;
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = :id`, vals);
    res.json({ ok: true });
  });

  router.get("/properties", auth, async (req, res) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, pr.name AS project_name FROM properties p
       LEFT JOIN categories c ON c.id = p.category
       LEFT JOIN projects pr ON pr.id = p.project_id
       WHERE p.deleted = 0 ORDER BY p.created_at DESC`
    );
    res.json(rows.map(mapProperty));
  });

  router.delete("/properties/:id", auth, async (req, res) => {
    await pool.query("UPDATE properties SET deleted = 1 WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.post("/properties/delete-batch", auth, async (req, res) => {
    const ids = req.body?.ids || [];
    if (!Array.isArray(ids) || !ids.length) return res.json({ ok: true });
    const ph = ids.map(() => "?").join(",");
    await pool.query(`UPDATE properties SET deleted = 1 WHERE id IN (${ph})`, ids);
    res.json({ ok: true });
  });

  router.patch("/properties/:id/featured", auth, async (req, res) => {
    const b = req.body || {};
    const featured = !!(b.featured ?? b.is_featured);
    await pool.query("UPDATE properties SET is_featured = ? WHERE id = ?", [featured ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  });

  router.post("/properties", auth, async (req, res) => {
    const b = req.body || {};
    const [catRows] = await pool.query(
      "SELECT id FROM categories WHERE LOWER(name) LIKE ? LIMIT 1",
      [`%${(b.property_type || "apartment").replace(/_/g, " ")}%`]
    );
    const categoryId = catRows[0]?.id || 0;
    let projectId = 0;
    if (b.project) {
      const [pr] = await pool.query("SELECT id FROM projects WHERE name LIKE ? LIMIT 1", [`%${b.project}%`]);
      projectId = pr[0]?.id || 0;
    }
    const saleType = b.sale_type === "rent" ? 2 : 1;
    const [ins] = await pool.query(
      `INSERT INTO properties (
        name, name_ar, description, description_ar, short_description, short_description_ar,
        active, sale_type, location, location_ar, location_link, price, bedrooms, bathrooms, area,
        category, project_id, apartment_no, floor_no, gross_area, balcony_size, link_360,
        is_recommended, is_featured, is_sold, similar_properties, meta_title, meta_title_ar,
        meta_description, meta_description_ar, unit_layout, broucher, floor_plan, video, slug,
        \`order\`, deleted, created_at, updated_at
      ) VALUES (
        :name, :name_ar, :description, :description_ar, :short_description, :short_description_ar,
        1, :sale_type, :location, :location_ar, :location_link, :price, :bedrooms, :bathrooms, :area,
        :category, :project_id, :apartment_no, :floor_no, :gross_area, :balcony_size, :link_360,
        :is_recommended, :is_featured, :is_sold, :similar_properties, :meta_title, :meta_title_ar,
        :meta_description, :meta_description_ar, :unit_layout, :broucher, :floor_plan, :video, :slug,
        :sort_order, 0, NOW(), NOW()
      )`,
      {
        name: b.name || "",
        name_ar: b.name_ar || "",
        description: b.description || "",
        description_ar: b.description_ar || "",
        short_description: (b.description || "").slice(0, 500),
        short_description_ar: (b.description_ar || "").slice(0, 500),
        sale_type: saleType,
        location: b.location || "",
        location_ar: b.location_ar || "",
        location_link: b.location_google_map_embed_link || "",
        price: Number(b.price) || 0,
        bedrooms: Number(b.bedroom_count) || 0,
        bathrooms: Number(b.bathroom_count) || 0,
        area: String(b.net_area || b.gross_area || "0"),
        category: categoryId,
        project_id: projectId,
        apartment_no: b.unit_number || "",
        floor_no: b.floor_number || "",
        gross_area: b.gross_area != null ? String(b.gross_area) : "",
        balcony_size: b.balcony_size != null ? String(b.balcony_size) : "",
        link_360: b.link_360 || "",
        is_recommended: b.is_recommended ? 1 : 0,
        is_featured: b.is_featured ? 1 : 0,
        is_sold: b.mark_as_sold ? 1 : 0,
        similar_properties: b.similar_properties || null,
        meta_title: b.meta_title || "",
        meta_title_ar: b.meta_title_ar || "",
        meta_description: b.meta_description || "",
        meta_description_ar: b.meta_description_ar || "",
        unit_layout: b.unit_layout_url || null,
        broucher: b.brochure_url || null,
        floor_plan: b.floor_plan_url || null,
        video: b.video_youtube_embed_link || null,
        slug: (b.name || "property").toLowerCase().replace(/\s+/g, "-").slice(0, 200),
        sort_order: Number(b.display_order) || 10,
      }
    );
    const id = ins.insertId;
    if (b.image_urls && Array.isArray(b.image_urls)) {
      let ord = 0;
      for (const url of b.image_urls) {
        await pool.query(
          "INSERT INTO property_images (property_id, image, `order`, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
          [id, url, ord++]
        );
      }
    }
    res.json({ id: String(id) });
  });

  router.get("/property-types", auth, async (req, res) => {
    const [rows] = await pool.query(
      "SELECT id, name, name_ar, image_url, unit_count, display_order, active AS is_active, created_at FROM categories WHERE deleted = 0 ORDER BY display_order ASC, id ASC"
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        name_ar: r.name_ar,
        image_url: r.image_url,
        unit_count: r.unit_count,
        display_order: r.display_order,
        is_active: !!r.is_active,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }))
    );
  });

  router.post("/property-types", auth, async (req, res) => {
    const b = req.body || {};
    const [ins] = await pool.query(
      `INSERT INTO categories (name, name_ar, slug, image_url, unit_count, display_order, active, deleted, created_at, updated_at)
       VALUES (:name, :name_ar, :slug, :image_url, :unit_count, :display_order, :active, 0, NOW(), NOW())`,
      {
        name: b.name,
        name_ar: b.name_ar || "",
        slug: (b.name || "cat").toLowerCase().replace(/\s+/g, "-"),
        image_url: b.image_url,
        unit_count: b.unit_count ?? 0,
        display_order: b.display_order ?? 0,
        active: b.is_active !== false ? 1 : 0,
      }
    );
    res.json({ id: String(ins.insertId) });
  });

  router.patch("/property-types/:id", auth, async (req, res) => {
    const b = req.body || {};
    await pool.query(
      `UPDATE categories SET name = ?, name_ar = ?, image_url = ?, unit_count = ?, display_order = ?, active = ? WHERE id = ?`,
      [b.name, b.name_ar || null, b.image_url, b.unit_count ?? 0, b.display_order ?? 0, b.is_active !== false ? 1 : 0, req.params.id]
    );
    res.json({ ok: true });
  });

  router.delete("/property-types/:id", auth, async (req, res) => {
    await pool.query("UPDATE categories SET deleted = 1 WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.get("/visit-schedules", auth, async (req, res) => {
    const [rows] = await pool.query(
      `SELECT v.id, v.agent_id, v.client_phone_number AS phone_number, v.visit_time, v.notes, v.created_at,
              u.name AS agent_name, p.name AS project_name, v.unit_type
       FROM visit_schedules v
       LEFT JOIN users u ON u.id = v.agent_id
       LEFT JOIN projects p ON p.id = v.project_id
       ORDER BY v.visit_time DESC`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        agent_id: String(r.agent_id),
        agent_name: r.agent_name || "",
        project_name: r.project_name || "",
        unit_type: r.unit_type || "",
        phone_number: r.phone_number || "",
        visit_date: r.visit_time ? new Date(r.visit_time).toISOString() : "",
        notes: r.notes,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.delete("/visit-schedules", auth, async (req, res) => {
    const ids = req.body?.ids || [];
    if (!ids.length) return res.json({ ok: true });
    const ph = ids.map(() => "?").join(",");
    await pool.query(`DELETE FROM visit_schedules WHERE id IN (${ph})`, ids);
    res.json({ ok: true });
  });

  router.get("/clients", auth, async (req, res) => {
    const agentId = req.query.agent_id;
    if (!agentId) return res.status(400).json({ error: "agent_id required" });
    const [rows] = await pool.query(
      `SELECT c.*, pr.name AS project_name FROM clients c LEFT JOIN projects pr ON pr.id = c.project_id WHERE c.agent_id = ? ORDER BY c.created_at DESC`,
      [agentId]
    );
    res.json(
      rows.map((c) => ({
        id: String(c.id),
        client_name: c.client_name,
        email: c.email,
        phone: `${c.country_code || ""}${c.phone || ""}`,
        project: c.project_name || "",
        nationality: c.nationality || "",
        apt_details: [c.apartment_no, c.apartment_type].filter(Boolean).join(" / "),
        created_at: c.created_at ? new Date(c.created_at).toISOString() : "",
      }))
    );
  });

  router.post("/clients", auth, async (req, res) => {
    const b = req.body || {};
    const [ins] = await pool.query(
      `INSERT INTO clients (agent_id, client_name, email, country_code, phone, project_id, nationality, apartment_no, apartment_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        b.agent_id,
        b.client_name,
        b.email,
        b.country_code || "+974",
        (b.phone || "").replace(/^\+/, ""),
        b.project_id || null,
        b.nationality || "",
        b.apartment_no || "",
        b.apartment_type || "",
      ]
    );
    res.json({ id: String(ins.insertId) });
  });

  router.patch("/clients/:id", auth, async (req, res) => {
    const b = req.body || {};
    await pool.query(
      `UPDATE clients SET client_name = ?, email = ?, phone = ?, nationality = ?, apartment_no = ?, apartment_type = ? WHERE id = ?`,
      [b.client_name, b.email, b.phone, b.nationality, b.apartment_no, b.apartment_type, req.params.id]
    );
    res.json({ ok: true });
  });

  router.delete("/clients/:id", auth, async (req, res) => {
    await pool.query("DELETE FROM clients WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.get("/stats", auth, async (req, res) => {
    const [[pc]] = await pool.query(
      "SELECT COUNT(*) AS c FROM users WHERE deleted = 0 AND role IN ('2','3','4')"
    );
    const [[nc]] = await pool.query("SELECT COUNT(*) AS c FROM mobile_admin_push_campaigns");
    const [[prc]] = await pool.query("SELECT COUNT(*) AS c FROM properties WHERE deleted = 0");
    const [[vc]] = await pool.query("SELECT COUNT(*) AS c FROM visit_schedules");
    const byType = { user: 0, agent: 0, agency: 0 };
    const [types] = await pool.query(
      "SELECT role, COUNT(*) AS c FROM users WHERE deleted = 0 AND role IN ('2','3','4') GROUP BY role"
    );
    for (const t of types) {
      if (String(t.role) === "2") byType.user = t.c;
      if (String(t.role) === "3") byType.agent = t.c;
      if (String(t.role) === "4") byType.agency = t.c;
    }
    res.json({
      profiles: pc.c,
      profilesByType: byType,
      notifications: nc.c,
      properties: prc.c,
      visits: vc.c,
    });
  });

  router.get("/crm-bookings", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_crm_bookings ORDER BY date DESC, created_at DESC");
    res.json(
      rows.map((r) => ({
        id: r.id,
        property_id: r.property_id ? String(r.property_id) : null,
        property_title: r.property_title,
        user_id: r.user_id,
        user_name: r.user_name,
        date: r.date ? String(r.date).slice(0, 10) : "",
        time: r.time,
        status: r.status,
        type: r.type,
        notes: r.notes,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.patch("/crm-bookings/:id", auth, async (req, res) => {
    await pool.query("UPDATE mobile_admin_crm_bookings SET status = ? WHERE id = ?", [req.body?.status, req.params.id]);
    res.json({ ok: true });
  });

  router.get("/notification-rules", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_notification_rules ORDER BY id ASC");
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        trigger_type: r.trigger_type,
        name: r.name,
        description: r.description,
        is_enabled: !!r.is_enabled,
        audience: r.audience,
        delivery_channel: r.delivery_channel,
        template_title: r.template_title,
        template_title_ar: r.template_title_ar,
        template_body: r.template_body,
        template_body_ar: r.template_body_ar,
        last_triggered_at: r.last_triggered_at ? new Date(r.last_triggered_at).toISOString() : null,
        trigger_count: r.trigger_count,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.patch("/notification-rules/:id", auth, async (req, res) => {
    const b = req.body || {};
    const [rows] = await pool.query("SELECT * FROM mobile_admin_notification_rules WHERE id = ? LIMIT 1", [req.params.id]);
    const cur = rows[0];
    if (!cur) return res.status(404).json({ error: "Not found" });
    const isEnabled = b.is_enabled !== undefined ? (b.is_enabled ? 1 : 0) : cur.is_enabled;
    const template_title = b.template_title !== undefined ? b.template_title : cur.template_title;
    const template_title_ar = b.template_title_ar !== undefined ? b.template_title_ar : cur.template_title_ar;
    const template_body = b.template_body !== undefined ? b.template_body : cur.template_body;
    const template_body_ar = b.template_body_ar !== undefined ? b.template_body_ar : cur.template_body_ar;
    await pool.query(
      `UPDATE mobile_admin_notification_rules SET is_enabled = ?, template_title = ?, template_title_ar = ?, template_body = ?, template_body_ar = ? WHERE id = ?`,
      [isEnabled, template_title, template_title_ar, template_body, template_body_ar, req.params.id]
    );
    res.json({ ok: true });
  });

  router.post("/notification-rules", auth, async (req, res) => {
    const b = req.body || {};
    const [ins] = await pool.query(
      `INSERT INTO mobile_admin_notification_rules (trigger_type, name, description, is_enabled, audience, delivery_channel, template_title, template_title_ar, template_body, template_body_ar, trigger_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        b.trigger_type,
        b.name,
        b.description || null,
        b.is_enabled !== false ? 1 : 0,
        b.audience,
        b.delivery_channel,
        b.template_title,
        b.template_title_ar,
        b.template_body,
        b.template_body_ar,
      ]
    );
    res.json({ id: String(ins.insertId) });
  });

  router.delete("/notification-rules/:id", auth, async (req, res) => {
    await pool.query("DELETE FROM mobile_admin_notification_rules WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.get("/bell-notifications", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_bell_notifications ORDER BY created_at DESC LIMIT 200");
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        is_read: !!r.is_read,
        metadata: r.metadata ? JSON.parse(JSON.stringify(r.metadata)) : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.patch("/bell-notifications/read", auth, async (req, res) => {
    const { id, mark_all } = req.body || {};
    if (mark_all) await pool.query("UPDATE mobile_admin_bell_notifications SET is_read = 1 WHERE is_read = 0");
    else if (id) await pool.query("UPDATE mobile_admin_bell_notifications SET is_read = 1 WHERE id = ?", [id]);
    res.json({ ok: true });
  });

  router.get("/push-campaigns", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_push_campaigns ORDER BY created_at DESC LIMIT 200");
    res.json(rows.map((r) => ({ ...r, id: r.id, open_rate: r.open_rate != null ? Number(r.open_rate) : null })));
  });

  router.get("/notifications", auth, async (req, res) => {
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const args = [];
    let where = "";
    if (userId) {
      where = "WHERE n.user_id = ?";
      args.push(userId);
    }
    const [rows] = await pool.query(
      `SELECT n.*, c.status AS campaign_status
       FROM mobile_admin_user_notifications n
       LEFT JOIN mobile_admin_push_campaigns c ON c.id = n.campaign_id
       ${where}
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [...args, limit]
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        campaign_id: r.campaign_id,
        user_id: String(r.user_id),
        title: r.title,
        title_ar: r.title_ar,
        body: r.body,
        body_ar: r.body_ar,
        channel: r.channel,
        target: r.target,
        deep_link: r.deep_link,
        is_read: !!r.is_read,
        read_at: r.read_at ? new Date(r.read_at).toISOString() : null,
        sent_at: r.sent_at ? new Date(r.sent_at).toISOString() : null,
        campaign_status: r.campaign_status || null,
        metadata: r.metadata ? JSON.parse(JSON.stringify(r.metadata)) : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      }))
    );
  });

  router.post("/push-campaigns", auth, async (req, res) => {
    try {
      const b = req.body || {};
      const id = randomUUID();
      const resolvedRecipients = await resolveNotificationRecipients(b.target || "all", b.specific_emails);
      if ((b.target || "").toLowerCase() === "specific_email" && !resolvedRecipients.length) {
        return res.status(400).json({ error: "No users found for provided email(s)" });
      }
      const recipientCount = resolvedRecipients.length;
      const sentAt =
        b.status === "sent" ? b.sent_at || new Date().toISOString() : b.sent_at || null;

      await pool.query(
        `INSERT INTO mobile_admin_push_campaigns (id, title, title_ar, body, body_ar, type, target, status, source_type, trigger_type, delivery_channel, deep_link, scheduled_at, sent_at, recipient_count, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          b.title,
          b.title_ar,
          b.body,
          b.body_ar,
          b.type || "push",
          b.target || "all",
          b.status || "sent",
          b.source_type || "manual",
          b.trigger_type || "manual_campaign",
          b.delivery_channel || b.type || "push",
          b.deep_link,
          b.scheduled_at || null,
          sentAt,
          recipientCount,
          req.admin.sub,
        ]
      );

      await persistUserNotifications(
        id,
        {
          ...b,
          delivery_channel: b.delivery_channel || b.type || "push",
        },
        resolvedRecipients,
        sentAt
      );

      let email = { attempted: false, sent: 0, reason: null };
      const shouldSendEmailNow = (b.status || "sent") === "sent" && (b.send_email_also === true || b.type === "email");
      if (shouldSendEmailNow) {
        email = await sendNotificationEmails(b, resolvedRecipients);
      }
      res.json({ id, recipient_count: recipientCount, email });
    } catch (err) {
      res.status(500).json({
        error: "Failed to create notification campaign",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  router.delete("/push-campaigns/:id", auth, async (req, res) => {
    await pool.query("DELETE FROM mobile_admin_push_campaigns WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.get("/content-items", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_content_items ORDER BY created_at DESC");
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        image_url: r.image_url,
        link: r.link,
        start_date: r.start_date ? String(r.start_date).slice(0, 10) : null,
        end_date: r.end_date ? String(r.end_date).slice(0, 10) : null,
        views: r.views,
        clicks: r.clicks,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.post("/content-items", auth, async (req, res) => {
    const b = req.body || {};
    const id = randomUUID();
    await pool.query(
      `INSERT INTO mobile_admin_content_items (id, title, type, status, image_url, link, start_date, end_date, views, clicks, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW())`,
      [id, b.title, b.type || "popup", b.status || "inactive", b.image_url, b.link, b.start_date, b.end_date, req.admin.sub]
    );
    res.json({ id });
  });

  router.patch("/content-items/:id", auth, async (req, res) => {
    const b = req.body || {};
    await pool.query(
      `UPDATE mobile_admin_content_items SET title = ?, type = ?, status = ?, link = ?, start_date = ?, end_date = ? WHERE id = ?`,
      [b.title, b.type, b.status, b.link, b.start_date, b.end_date, req.params.id]
    );
    res.json({ ok: true });
  });

  router.delete("/content-items/:id", auth, async (req, res) => {
    await pool.query("DELETE FROM mobile_admin_content_items WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  });

  router.get("/chat/messages", auth, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM mobile_admin_chat_messages ORDER BY created_at ASC");
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        sender_id: r.sender_id,
        sender_name: r.sender_name,
        sender_type: r.sender_type,
        receiver_id: r.receiver_id,
        message: r.message,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }))
    );
  });

  router.post("/chat/messages", auth, async (req, res) => {
    const b = req.body || {};
    const [ins] = await pool.query(
      `INSERT INTO mobile_admin_chat_messages (sender_id, sender_name, sender_type, receiver_id, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [b.sender_id, b.sender_name, b.sender_type || "admin", b.receiver_id || null, b.message]
    );
    res.json({ id: String(ins.insertId) });
  });

  router.get("/profiles/all-users", auth, async (req, res) => {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.agency_id FROM users u WHERE u.deleted = 0 AND u.role IN ('2','3','4') ORDER BY u.name`
    );
    const agentIds = rows.filter((r) => String(r.role) === "3").map((r) => r.id);
    const agencyMap = await loadAgencyNames(agentIds);
    res.json(
      rows.map((u) => ({
        user_id: String(u.id),
        name: u.name,
        email: u.email,
        user_type: roleToUserType(u.role),
        agency_name: String(u.role) === "3" ? agencyMap[u.id] || null : null,
      }))
    );
  });

  router.post("/upload", auth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const ext = path.extname(req.file.originalname || "") || ".bin";
    const name = `${randomUUID()}${ext}`;
    const dest = path.join(uploadDir, name);
    fs.renameSync(req.file.path, dest);
    const base = process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4000}`;
    const url = `${base}/uploads/${name}`;
    res.json({ url });
  });

  router.post("/projects", auth, async (req, res) => {
    const b = req.body || {};
    const [ins] = await pool.query(
      `INSERT INTO projects (name, name_ar, location, location_ar, image, app_image, banner, video, video_thumbnail, link_360, description, description_ar, suggested_apartments, active, deleted, country, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, NOW(), NOW())`,
      [
        b.name,
        b.name_ar || "",
        b.location || "",
        b.location_ar || "",
        b.image_url || "",
        b.app_image_url || "",
        b.banner_url || "",
        b.video_url || "",
        b.video_thumbnail_url || "",
        b.link_360 || "",
        b.description || "",
        b.description_ar || "",
        b.suggested_apartments || "",
        b.country || 0,
        b.end_date || null,
      ]
    );
    const pid = ins.insertId;
    if (b.gallery && Array.isArray(b.gallery)) {
      let ord = 0;
      for (const g of b.gallery) {
        await pool.query(
          "INSERT INTO project_images (project_id, image, type, alt_text, alt_text_ar, created_at, updated_at) VALUES (?, ?, ?, '', '', NOW(), NOW())",
          [pid, g.image_url, g.image_type || "Gallery"]
        );
      }
    }
    res.json({ id: String(pid) });
  });

  app.use("/api", router);
}
