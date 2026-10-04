"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getDictionary } from "@/dictionaries";
import en from "@/dictionaries/en";
import { confirmationsEnabled, inbox, renderTable, sendMail } from "@/lib/email";
import { hasLocale, type Locale } from "@/lib/i18n";
import { quotableServices } from "@/lib/services";
import { site } from "@/lib/site";
import { looksLikeBot, rateLimited, tooFast } from "@/lib/spam";

export type FormResult =
  | { ok: true; reference?: string }
  | { ok: false; error: "invalid" | "server" | "tooFast"; fields?: string[] };

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);

const guard = {
  locale: z.string(),
  website: z.string().optional(), // honeypot: hidden from people
  startedAt: z.number(),
};

const quoteSchema = z.object({
  ...guard,
  service: z.enum(quotableServices as [string, ...string[]]),
  mode: z.enum(["sea", "air", "road", "unsure"]),
  from: required(200),
  to: required(200),
  readyDate: text(20),
  cargo: required(2000),
  weight: text(500),
  name: required(200),
  company: text(200),
  email: z.email().max(320),
  phone: text(50),
  notes: text(2000),
  consent: z.literal(true),
});

const contactSchema = z.object({
  ...guard,
  name: required(200),
  email: z.email().max(320),
  phone: text(50),
  subject: required(200),
  message: required(5000),
  consent: z.literal(true),
});

export type QuoteInput = z.input<typeof quoteSchema>;
export type ContactInput = z.input<typeof contactSchema>;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Short reference such as TFS-Q-2026-7K3F. Not stored anywhere yet (no database in phase 1). */
function newReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `TFS-Q-${new Date().getFullYear()}-${code}`;
}

const failedFields = (error: z.ZodError) => [...new Set(error.issues.map((i) => String(i.path[0])))];

export async function submitQuote(input: QuoteInput): Promise<FormResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: failedFields(parsed.error) };
  const data = parsed.data;

  // Bots get a normal-looking answer so they don't retry; nothing is sent.
  if (looksLikeBot(data.website, data.startedAt)) return { ok: true, reference: newReference() };
  if (tooFast(data.startedAt)) return { ok: false, error: "tooFast" };
  if (rateLimited(await clientIp())) return { ok: false, error: "server" };

  const locale: Locale = hasLocale(data.locale) ? data.locale : "en";
  const reference = newReference();
  const empty = "-";

  // Internal email is always in English (the admin language).
  const rows: [string, string][] = [
    ["Reference", reference],
    ["Service", en.services.items[data.service as keyof typeof en.services.items].title],
    ["Transport mode", en.quote.modes[data.mode]],
    ["From", data.from],
    ["To", data.to],
    ["Ready date", data.readyDate || empty],
    ["Cargo", data.cargo],
    ["Weight and size", data.weight || empty],
    ["Name", data.name],
    ["Company", data.company || empty],
    ["Email", data.email],
    ["Phone / WhatsApp", data.phone || empty],
    ["Notes", data.notes || empty],
    ["Language", locale.toUpperCase()],
  ];
  const internal = renderTable(`New quote request ${reference}`, rows);

  if (!inbox) {
    console.error("[quote] INBOX_EMAIL is not set");
    if (process.env.NODE_ENV === "production") return { ok: false, error: "server" };
  }

  const sent = await sendMail({
    to: inbox ?? "dev@localhost",
    replyTo: data.email,
    subject: `Quote request ${reference}: ${data.from} → ${data.to}`,
    ...internal,
  });
  if (!sent) return { ok: false, error: "server" };

  if (confirmationsEnabled) {
    const dict = await getDictionary(locale);
    const t = dict.email;
    const confirm = renderTable(
      t.confirmSubject,
      [[t.confirmReference, reference]],
      `${t.confirmGreeting} ${data.name}, ${t.confirmBody}`,
    );
    // A failed confirmation must not fail the request: the team already has it.
    await sendMail({
      to: data.email,
      replyTo: site.email,
      subject: `${t.confirmSubject} (${reference})`,
      html: `${confirm.html}<p style="font-family:Inter,Arial,sans-serif">${t.confirmSignoff}<br>${site.name}</p>`,
      text: `${confirm.text}\n\n${t.confirmSignoff}\n${site.name}`,
    });
  }

  return { ok: true, reference };
}

export async function submitContact(input: ContactInput): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: failedFields(parsed.error) };
  const data = parsed.data;

  if (looksLikeBot(data.website, data.startedAt)) return { ok: true };
  if (tooFast(data.startedAt)) return { ok: false, error: "tooFast" };
  if (rateLimited(await clientIp())) return { ok: false, error: "server" };

  if (!inbox && process.env.NODE_ENV === "production") {
    console.error("[contact] INBOX_EMAIL is not set");
    return { ok: false, error: "server" };
  }

  const mail = renderTable(`New message: ${data.subject}`, [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone || "-"],
    ["Subject", data.subject],
    ["Message", data.message],
    ["Language", (hasLocale(data.locale) ? data.locale : "en").toUpperCase()],
  ]);

  const sent = await sendMail({
    to: inbox ?? "dev@localhost",
    replyTo: data.email,
    subject: `Website message: ${data.subject}`,
    ...mail,
  });
  return sent ? { ok: true } : { ok: false, error: "server" };
}
