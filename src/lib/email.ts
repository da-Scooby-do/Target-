import "server-only";
import { Resend } from "resend";

/**
 * Email delivery through Resend.
 *
 * Env:
 *   RESEND_API_KEY        API key from resend.com
 *   INBOX_EMAIL           where quote requests and messages are delivered
 *   EMAIL_FROM            sender, e.g. "Target Facility Service <noreply@your-domain.nl>".
 *                         Until a domain is verified in Resend, leave it unset: Resend's
 *                         test sender then only delivers to the Resend account's own email.
 *   SEND_CONFIRMATIONS    "true" to also email the customer. Needs a verified domain.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const from = process.env.EMAIL_FROM || "Target Facility Service <onboarding@resend.dev>";
export const inbox = process.env.INBOX_EMAIL;
export const confirmationsEnabled = process.env.SEND_CONFIRMATIONS === "true";

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      // Local development without a key: print the email instead of sending it.
      console.info(`\n[email] to=${mail.to} subject=${mail.subject}\n${mail.text}\n`);
      return true;
    }
    console.error("[email] RESEND_API_KEY is not set");
    return false;
  }
  const { error } = await resend.emails.send({ from, ...mail });
  if (error) {
    console.error("[email] send failed", error);
    return false;
  }
  return true;
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Plain, readable layout for internal and customer emails. */
export function renderTable(title: string, rows: [string, string][], intro?: string) {
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top" style="padding:8px 16px 8px 0;color:#46545a;font-weight:500;white-space:nowrap">${escapeHtml(
          label,
        )}</th><td style="padding:8px 0;color:#02090d;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.6;color:#02090d;max-width:640px">
<h1 style="font-size:20px;font-weight:500;margin:0 0 16px">${escapeHtml(title)}</h1>
${intro ? `<p style="margin:0 0 16px">${escapeHtml(intro)}</p>` : ""}
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">${htmlRows}</table>
</div>`;
  const text = [title, "", intro ?? "", ...rows.map(([l, v]) => `${l}: ${v}`)].join("\n");
  return { html, text };
}
