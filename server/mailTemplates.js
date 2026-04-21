import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notificationTemplatePath = path.join(__dirname, "templates", "notification-email.html");
const notificationTemplateHtml = fs.readFileSync(notificationTemplatePath, "utf8");

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Bootstrap-styled generic notification email.
 * @param {{ title?: string; body?: string; deep_link?: string; brand_name?: string }} payload
 * @returns {{ subject: string; html: string; text: string }}
 */
export function buildBootstrapNotificationEmail(payload = {}) {
  const title = String(payload.title || "").trim() || "New notification";
  const body = String(payload.body || "").trim();
  const deepLink = String(payload.deep_link || "").trim();
  const brandName = String(payload.brand_name || "Notification Center").trim();

  const safeTitle = htmlEscape(title);
  const safeBody = htmlEscape(body).replace(/\r?\n/g, "<br />");
  const safeDeepLink = deepLink ? htmlEscape(deepLink) : "";
  const safeBrandName = htmlEscape(brandName);

  const text = [title, body, deepLink].filter(Boolean).join("\n\n");
  const bodyBlock = safeBody
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#495057;">${safeBody}</p>`
    : "";
  const linkBlock = safeDeepLink
    ? `<p style="margin:0 0 16px;">
         <a href="${safeDeepLink}" target="_blank" rel="noreferrer" style="display:inline-block;background:#0d6efd;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:600;">
           Open Link
         </a>
       </p>
       <p style="margin:0;font-size:12px;color:#6c757d;word-break:break-all;">
         ${safeDeepLink}
       </p>`
    : "";
  const html = notificationTemplateHtml
    .replaceAll("{{TITLE}}", safeTitle)
    .replace("{{BRAND_NAME}}", safeBrandName)
    .replace("{{BODY_BLOCK}}", bodyBlock)
    .replace("{{LINK_BLOCK}}", linkBlock);

  return { subject: title, html, text };
}
