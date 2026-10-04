"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/dictionaries";
import { getProfile } from "@/lib/auth";
import { inbox, renderMessage, renderTable, sendMail } from "@/lib/email";
import { eventKinds, formatWhen, placeText } from "@/lib/events";
import { hasLocale, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type EventResult = { ok: true; status?: "registered" | "waitlist"; id?: string } | { ok: false; error: string };

const done = () => {
  revalidatePath("/[lang]/events", "layout");
  revalidatePath("/[lang]/app", "layout");
};

const registerSchema = z.object({
  eventId: z.uuid(),
  locale: z.string(),
  name: z.string().trim().min(1).max(200),
  email: z.email().max(320),
  company: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  attendees: z.number().int().min(1).max(10),
  notes: z.string().trim().max(1000),
  website: z.string().max(0).optional(), // honeypot
});

/** Register for an event; confirms by email and tells the team. */
export async function registerForEvent(input: z.input<typeof registerSchema>): Promise<EventResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return { ok: false, error: field === "email" ? "email" : field === "website" ? "generic" : "required" };
  }
  const d = parsed.data;
  const locale: Locale = hasLocale(d.locale) ? d.locale : "en";
  const supabase = await createClient();
  const { data: status, error } = await supabase.rpc("register_for_event", {
    p_event: d.eventId,
    p_name: d.name,
    p_email: d.email,
    p_company: d.company,
    p_phone: d.phone,
    p_attendees: d.attendees,
    p_notes: d.notes,
  });
  if (error) {
    const m = error.message;
    return {
      ok: false,
      error: /already/.test(m) ? "already" : /unavailable|over/.test(m) ? "closed" : /email/.test(m) ? "email" : "generic",
    };
  }

  const { data: event } = await supabase.from("events").select("slug, title, starts_at, ends_at, online, venue, city, country").eq("id", d.eventId).single();
  if (event) {
    const t = (await getDictionary(locale)).events.email;
    const waitlist = status === "waitlist";
    const subject = (waitlist ? t.waitlistSubject : t.subject).replace("{title}", event.title);
    const mail = renderMessage({
      title: subject,
      paragraphs: [
        (waitlist ? t.waitlistText : t.text).replace("{title}", event.title),
        `${formatWhen(event, locale)} · ${placeText(event, "Online")}`,
      ],
      cta: { label: t.cta, url: `${site.url}/${locale}/events/${event.slug}` },
      signoff: t.signoff,
      rtl: locale === "ar",
    });
    // A failed confirmation doesn't undo the registration.
    await sendMail({ to: d.email, replyTo: site.email, subject, ...mail });
    if (inbox) {
      const staffMail = renderTable(`Event registration: ${event.title}`, [
        ["Event", event.title],
        ["Status", waitlist ? "Waiting list" : "Registered"],
        ["Name", d.name],
        ["Email", d.email],
        ["Company", d.company || "-"],
        ["Phone", d.phone || "-"],
        ["People", String(d.attendees)],
        ["Notes", d.notes || "-"],
      ]);
      await sendMail({ to: inbox, replyTo: d.email, subject: `Event registration: ${event.title}`, ...staffMail });
    }
  }

  done();
  return { ok: true, status: status as "registered" | "waitlist" };
}

export async function cancelRegistration(id: string): Promise<EventResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_event_registration", { p_id: id });
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- staff

const eventSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(80),
  kind: z.enum(eventKinds),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(400),
  description: z.string().trim().max(8000),
  starts_at: z.iso.datetime({ offset: true }),
  ends_at: z.iso.datetime({ offset: true }).nullable(),
  online: z.boolean(),
  venue: z.string().trim().max(200),
  city: z.string().trim().max(100),
  country: z.string().trim().max(100),
  image: z.string().trim().max(300),
  capacity: z.number().int().min(1).max(100000).nullable(),
  price_note: z.string().trim().max(100),
  language: z.string().trim().max(60),
  status: z.enum(["draft", "published", "cancelled"]),
});
export type EventInput = z.input<typeof eventSchema>;

export async function saveEvent(input: EventInput): Promise<EventResult> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.path[0] === "slug" ? "slug" : "invalid" };
  const profile = await getProfile();
  if (profile?.role !== "staff") return { ok: false, error: "auth" };
  const { id, ...f } = parsed.data;
  if (f.ends_at && f.ends_at < f.starts_at) return { ok: false, error: "dates" };
  const row = {
    ...f,
    summary: f.summary || null,
    description: f.description || null,
    venue: f.venue || null,
    city: f.city || null,
    country: f.country || null,
    image: f.image || null,
    price_note: f.price_note || null,
    language: f.language || null,
    // Editing an example makes it a real event.
    is_example: false,
  };
  const supabase = await createClient();
  const result = id
    ? await supabase.from("events").update(row).eq("id", id).select("id").single()
    : await supabase.from("events").insert(row).select("id").single();
  if (result.error) return { ok: false, error: /duplicate|unique/.test(result.error.message) ? "slug" : "generic" };
  done();
  return { ok: true, id: result.data.id };
}

export async function deleteEvent(id: string): Promise<EventResult> {
  const profile = await getProfile();
  if (profile?.role !== "staff" || !z.uuid().safeParse(id).success) return { ok: false, error: "auth" };
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}
