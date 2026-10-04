"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/dictionaries";
import en from "@/dictionaries/en";
import { getMembership, getProfile } from "@/lib/auth";
import { inbox, renderMessage, renderTable, sendMail } from "@/lib/email";
import { hasLocale, type Locale } from "@/lib/i18n";
import { packageTotals, type PackageLine } from "@/lib/packages";
import { quotableServices } from "@/lib/services";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
const num = (max: number) => z.number().min(0).max(max);

const packageSchema = z.object({
  qty: z.number().int().min(1).max(10_000),
  type: z.enum(["pallet", "box", "crate", "container20", "container40", "other"]),
  weight: num(100_000).nullable(),
  length: num(2_000).nullable(),
  width: num(2_000).nullable(),
  height: num(2_000).nullable(),
});

const shipmentSchema = z.object({
  locale: z.string(),
  from: required(400),
  to: required(400),
  readyDate: text(10),
  deliverBy: text(10),
  packages: z.array(packageSchema).min(1).max(50),
  description: required(2000),
  service: z.enum(quotableServices as [string, ...string[]]),
  mode: z.enum(["sea", "air", "road", "unsure"]),
  incoterm: text(10),
  reference: text(100),
  notes: text(1500),
});

export type ShipmentRequestInput = z.input<typeof shipmentSchema>;
export type ActionResult = { ok: true; reference?: string } | { ok: false; error: string; fields?: string[] };

const done = () => revalidatePath("/[lang]/app", "layout");

/** A signed-in customer requests a price from the guided form. */
export async function createShipmentRequest(input: ShipmentRequestInput): Promise<ActionResult> {
  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] };
  }
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "auth" };
  const membership = await getMembership();
  const d = parsed.data;
  const locale: Locale = hasLocale(d.locale) ? d.locale : "en";

  const totals = packageTotals(d.packages as PackageLine[]);
  const weightSummary = `${totals.pieces} pcs · ${totals.kg} kg · ${totals.cbm} m³`;
  const notes = [d.deliverBy ? `Needed by: ${d.deliverBy}` : "", d.notes].filter(Boolean).join("\n");

  const supabase = await createClient();
  const { data: reference, error } = await supabase.rpc("create_quote", {
    payload: {
      email: profile.email,
      name: profile.full_name || profile.email,
      company: membership?.companyName ?? profile.company ?? "",
      phone: profile.phone ?? "",
      service: d.service,
      mode: d.mode,
      origin: d.from,
      destination: d.to,
      ready_date: d.readyDate,
      cargo: d.description,
      weight: weightSummary,
      notes,
      locale,
      packages: d.packages,
      incoterm: d.incoterm,
      customer_reference: d.reference,
    },
  });
  if (error) {
    console.error("[app] create_quote failed", error.message);
    return { ok: false, error: error.message.includes("rate") ? "rate" : "server" };
  }

  if (inbox) {
    const type = en.quote.modes;
    const mail = renderTable(`New quote request ${reference}`, [
      ["Reference", reference as string],
      ["Customer", `${profile.full_name ?? ""} <${profile.email}>`],
      ["Company", membership?.companyName ?? "-"],
      ["Service", en.services.items[d.service as keyof typeof en.services.items].title],
      ["Transport mode", type[d.mode]],
      ["From", d.from],
      ["To", d.to],
      ["Ready date", d.readyDate || "-"],
      ["Packages", weightSummary],
      ["Cargo", d.description],
      ["Incoterm", d.incoterm || "-"],
      ["Customer reference", d.reference || "-"],
      ["Notes", notes || "-"],
      ["Price it", `${site.url}/en/app/admin/quotes/${reference}`],
    ]);
    await sendMail({ to: inbox, replyTo: profile.email, subject: `Quote request ${reference}: ${d.from} → ${d.to}`, ...mail });
  }

  done();
  return { ok: true, reference: reference as string };
}

// ---------------------------------------------------------------- saved addresses

const addressSchema = z.object({
  id: z.uuid().optional(),
  label: required(100),
  contact_name: text(200),
  street: required(200),
  postcode: text(20),
  city: required(100),
  country: required(100),
  phone: text(50),
});
export type AddressInput = z.input<typeof addressSchema>;

export async function saveAddress(input: AddressInput): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] };
  }
  const profile = await getProfile();
  const membership = await getMembership();
  if (!profile || !membership) return { ok: false, error: "auth" };
  const { id, ...fields } = parsed.data;
  const row = {
    ...fields,
    contact_name: fields.contact_name || null,
    postcode: fields.postcode || null,
    phone: fields.phone || null,
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("addresses").update(row).eq("id", id)
    : await supabase.from("addresses").insert({ ...row, company_id: membership.companyId, created_by: profile.id });
  if (error) return { ok: false, error: "server" };
  done();
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { ok: false, error: "server" };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- team

const teamError = (message: string) =>
  message.includes("already") ? "already" : message.includes("transfer") ? "transfer" : message.includes("email") ? "email" : "generic";

export async function inviteMember(email: string, locale: string): Promise<ActionResult> {
  const parsed = z.email().max(320).safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: "email" };
  const profile = await getProfile();
  const membership = await getMembership();
  if (!profile || !membership) return { ok: false, error: "generic" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_member", { p_email: parsed.data });
  if (error) return { ok: false, error: teamError(error.message) };

  // The invitee may not have an account yet: the link lets them sign up with this address.
  const lang: Locale = hasLocale(locale) ? locale : "en";
  const t = (await getDictionary(lang)).ui.app.team.inviteEmail;
  const fill = (s: string) =>
    s.replace("{name}", profile.full_name || profile.email).replace("{company}", membership.companyName);
  const mail = renderMessage({
    title: fill(t.subject),
    paragraphs: [fill(t.text)],
    cta: { label: t.cta, url: `${site.url}/${lang}/signup?invite=1&email=${encodeURIComponent(parsed.data)}` },
    signoff: t.signoff,
    rtl: lang === "ar",
  });
  await sendMail({ to: parsed.data, replyTo: profile.email, subject: fill(t.subject), ...mail });

  done();
  return { ok: true };
}

export async function revokeInvitation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invitation", { p_id: id });
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

export async function acceptInvitation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_id: id });
  if (error) return { ok: false, error: teamError(error.message) };
  done();
  return { ok: true };
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_user: userId });
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- company

const companySchema = z.object({ name: required(200), vat_number: text(50), country: text(100) });

export async function updateCompany(input: z.input<typeof companySchema>): Promise<ActionResult> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const membership = await getMembership();
  if (!membership || membership.role !== "owner") return { ok: false, error: "owner" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      vat_number: parsed.data.vat_number || null,
      country: parsed.data.country || null,
    })
    .eq("id", membership.companyId);
  if (error) return { ok: false, error: "server" };
  done();
  return { ok: true };
}
