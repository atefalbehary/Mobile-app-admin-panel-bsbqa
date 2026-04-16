/**
 * Outbound mail env: supports Node-style (SMTP_*) and Laravel-style (MAIL_*).
 * Precedence: SMTP_* over MAIL_* when both are set.
 */
export function resolveOutboundMailEnv() {
  const s = (v) => String(v || "").trim();

  const host = s(process.env.SMTP_HOST) || s(process.env.MAIL_HOST);
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);

  const smtpSecureFlag = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  const enc = s(process.env.MAIL_ENCRYPTION).toLowerCase();
  const secure = smtpSecureFlag || enc === "ssl" || enc === "smtps";

  const user = s(process.env.SMTP_USER) || s(process.env.MAIL_USERNAME);
  const pass = s(process.env.SMTP_PASS) || s(process.env.MAIL_PASSWORD);

  const fromRaw =
    s(process.env.NOTIFICATION_EMAIL_FROM) || s(process.env.MAIL_FROM_ADDRESS) || s(process.env.MAIL_FROM);
  const from = fromRaw || user;

  return { host, port, secure, user, pass, from };
}
