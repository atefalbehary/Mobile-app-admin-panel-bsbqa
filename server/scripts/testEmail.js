import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { resolveOutboundMailEnv } from "../mailEnv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function main() {
  const { host, port, secure, user, pass, from } = resolveOutboundMailEnv();
  const to = argValue("to");

  console.log("[mail:test] Loaded config:");
  console.log(`[mail:test] host=${host || "(missing)"} port=${port} secure=${secure}`);
  console.log(`[mail:test] user=${user || "(missing)"} from=${from || "(missing)"}`);

  if (!host) throw new Error("Missing SMTP host (SMTP_HOST / MAIL_HOST).");
  if (!from) throw new Error("Missing from address (NOTIFICATION_EMAIL_FROM / MAIL_FROM_ADDRESS / MAIL_FROM).");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });

  console.log("[mail:test] Verifying SMTP connection...");
  await transporter.verify();
  console.log("[mail:test] SMTP verify success.");

  if (!to) {
    console.log("[mail:test] No recipient supplied. Verify-only test passed.");
    console.log("[mail:test] To send test mail: npm run mail:test -- --to=you@example.com");
    return;
  }

  console.log(`[mail:test] Sending test email to ${to} ...`);
  const info = await transporter.sendMail({
    from,
    to,
    subject: "SMTP test — Mobile Admin Panel",
    text: "This is a test email to validate SMTP credentials and delivery.",
    html: "<p>This is a <strong>test email</strong> to validate SMTP credentials and delivery.</p>",
  });

  console.log(`[mail:test] Message ID: ${info.messageId}`);
  console.log(`[mail:test] Accepted: ${(info.accepted || []).join(", ") || "(none)"}`);
  console.log(`[mail:test] Rejected: ${(info.rejected || []).join(", ") || "(none)"}`);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[mail:test] FAILED:", msg);
  process.exit(1);
});
