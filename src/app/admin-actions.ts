"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/dictionaries";
import { getProfile } from "@/lib/auth";
import { renderMessage, sendMail } from "@/lib/email";
import { formatDay } from "@/lib/format";
import { hasLocale, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { ShipmentStatus } from "@/lib/types";

type Result = { ok: true; reference?: string } | { ok: false; error: string };

async function staffClient() {
  const profile = await getProfile();
  if (!profile || profile.role !== "staff") throw new Error("Not allowed");
  return { supabase: await createClient(), profile };
}

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);

const localeOf = (value: string | null | undefined): Locale => (value && hasLocale(value) ? value : "en");

// ------------------------------------------------------------------ quotes

const priceSchema = z.object({
  reference: z.string().max(40),
  price: z.number().nonnegative().max(100_000_000),
  currency: z.enum(["EUR", "USD", "GBP", "AED", "SAR"]),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(2000),
  notify: z.boolean(),
});

/** Set or change the price. The quote becomes "quoted" and the customer can accept it in My TFS. */
export async function setQuotePrice(input: z.input<typeof priceSchema>): Promise<Result> {
  const parsed = priceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the price and the validity date." };
  const { supabase } = await staffClient();
  const d = parsed.data;

  const { data: q, error } = await supabase
    .from("quotes")
    .update({
      price: d.price,
      currency: d.currency,
      valid_until: d.validUntil,
      price_note: d.note || null,
      status: "quoted",
      quoted_at: new Date().toISOString(),
    })
    .eq("reference", d.reference)
    .in("status", ["pending", "quoted", "expired"])
    .select("reference, email, name, origin, destination, locale")
    .maybeSingle();
  if (error || !q) return { ok: false, error: "Could not save. The customer may have answered already." };

  if (d.notify) {
    const locale = localeOf(q.locale);
    const t = (await getDictionary(locale)).email;
    const vars = { ref: q.reference, from: q.origin, to: q.destination, date: formatDay(d.validUntil, locale) };
    const mail = renderMessage({
      title: fill(t.priceSubject, vars),
      paragraphs: [`${t.confirmGreeting} ${q.name},`, fill(t.priceBody, vars), fill(t.priceValid, vars)],
      cta: { label: t.viewQuote, url: `${site.url}/${locale}/portal/quotes/${q.reference}` },
      signoff: t.confirmSignoff,
      rtl: locale === "ar",
    });
    await sendMail({ to: q.email, subject: fill(t.priceSubject, vars), replyTo: site.email, ...mail });
  }

  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return { ok: true };
}

const bookSchema = z.object({
  reference: z.string().max(40),
  mode: z.enum(["sea", "air", "road", "unsure"]),
  eta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  notify: z.boolean(),
});

/** Turn an accepted quote into a shipment with its first milestone, "Booked". */
export async function bookShipment(input: z.input<typeof bookSchema>): Promise<Result> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the booking details." };
  const { supabase, profile } = await staffClient();
  const d = parsed.data;

  const { data: q } = await supabase
    .from("quotes")
    .select("id, customer_id, origin, destination, email, name, locale, status")
    .eq("reference", d.reference)
    .single();
  if (!q || q.status !== "accepted") return { ok: false, error: "Only accepted quotes can be booked." };

  const { data: shipment, error } = await supabase
    .from("shipments")
    .insert({
      quote_id: q.id,
      customer_id: q.customer_id,
      mode: d.mode,
      origin: q.origin,
      destination: q.destination,
      eta: d.eta || null,
    })
    .select("id, reference")
    .single();
  if (error || !shipment) return { ok: false, error: "Could not create the shipment. It may already exist." };

  await supabase.from("shipment_events").insert({ shipment_id: shipment.id, status: "booked", created_by: profile.id });

  if (d.notify) {
    const locale = localeOf(q.locale);
    const t = (await getDictionary(locale)).email;
    const vars = { ref: shipment.reference, from: q.origin, to: q.destination };
    const mail = renderMessage({
      title: fill(t.bookedSubject, vars),
      reference: shipment.reference,
      paragraphs: [`${t.confirmGreeting} ${q.name},`, fill(t.bookedBody, vars)],
      cta: { label: t.viewShipment, url: `${site.url}/${locale}/track?ref=${shipment.reference}` },
      signoff: t.confirmSignoff,
      rtl: locale === "ar",
    });
    await sendMail({ to: q.email, subject: fill(t.bookedSubject, vars), replyTo: site.email, ...mail });
  }

  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return { ok: true, reference: shipment.reference };
}

// ------------------------------------------------------------------ shipments

const eventSchema = z.object({
  reference: z.string().max(40),
  status: z.enum(["booked", "picked_up", "in_transit", "customs", "delivered", "cancelled"]),
  location: z.string().trim().max(200),
  note: z.string().trim().max(500),
  notify: z.boolean(),
});

/** Add a milestone. The database moves the shipment to that status. */
export async function addMilestone(input: z.input<typeof eventSchema>): Promise<Result> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the milestone details." };
  const { supabase, profile } = await staffClient();
  const d = parsed.data;

  const { data: s } = await supabase
    .from("shipments")
    .select("id, reference, origin, destination, quote_id, customer_id")
    .eq("reference", d.reference)
    .single();
  if (!s) return { ok: false, error: "Shipment not found." };

  const { error } = await supabase.from("shipment_events").insert({
    shipment_id: s.id,
    status: d.status as ShipmentStatus,
    location: d.location || null,
    note: d.note || null,
    created_by: profile.id,
  });
  if (error) return { ok: false, error: "Could not save the milestone." };

  if (d.notify && s.quote_id) {
    const { data: q } = await supabase.from("quotes").select("email, name, locale").eq("id", s.quote_id).single();
    if (q) {
      const locale = localeOf(q.locale);
      const dict = await getDictionary(locale);
      const t = dict.email;
      const vars = { ref: s.reference, from: s.origin, to: s.destination, status: dict.app.statuses.shipment[d.status] };
      const mail = renderMessage({
        title: fill(t.updateSubject, vars),
        paragraphs: [`${t.confirmGreeting} ${q.name},`, fill(t.updateBody, vars), ...(d.location ? [d.location] : []), ...(d.note ? [d.note] : [])],
        cta: { label: t.viewShipment, url: `${site.url}/${locale}/track?ref=${s.reference}` },
        signoff: t.confirmSignoff,
        rtl: locale === "ar",
      });
      await sendMail({ to: q.email, subject: fill(t.updateSubject, vars), replyTo: site.email, ...mail });
    }
  }

  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return { ok: true };
}

export async function updateEta(input: { reference: string; eta: string }): Promise<Result> {
  const parsed = z.object({ reference: z.string().max(40), eta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the date." };
  const { supabase } = await staffClient();
  const { error } = await supabase.from("shipments").update({ eta: parsed.data.eta || null }).eq("reference", parsed.data.reference);
  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return error ? { ok: false, error: "Could not save the date." } : { ok: true };
}

/** Record a document the browser already uploaded to storage (uploads skip the server's body size limit). */
export async function registerDocument(input: { reference: string; path: string; name: string; size: number; type: string }): Promise<Result> {
  const parsed = z
    .object({ reference: z.string().max(40), path: z.string().max(500), name: z.string().max(200), size: z.number(), type: z.string().max(200) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid file." };
  const { supabase, profile } = await staffClient();
  const { data: s } = await supabase.from("shipments").select("id").eq("reference", parsed.data.reference).single();
  if (!s || !parsed.data.path.startsWith(`${s.id}/`)) return { ok: false, error: "Shipment not found." };
  const { error } = await supabase.from("documents").insert({
    shipment_id: s.id,
    name: parsed.data.name,
    storage_path: parsed.data.path,
    size: parsed.data.size,
    content_type: parsed.data.type,
    uploaded_by: profile.id,
  });
  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return error ? { ok: false, error: "Could not save the document." } : { ok: true };
}

export async function deleteDocument(input: { id: string }): Promise<Result> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid document." };
  const { supabase } = await staffClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", parsed.data.id).single();
  if (!doc) return { ok: false, error: "Document not found." };
  await supabase.storage.from("documents").remove([doc.storage_path]);
  const { error } = await supabase.from("documents").delete().eq("id", parsed.data.id);
  revalidatePath("/[lang]/admin", "layout");
  revalidatePath("/[lang]/portal", "layout");
  return error ? { ok: false, error: "Could not delete." } : { ok: true };
}
