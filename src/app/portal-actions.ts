"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { inbox, renderTable, sendMail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

/** Customer accepts or declines a priced quote. The database checks ownership, status and validity. */
export async function respondToQuote(input: { reference: string; accept: boolean }) {
  const parsed = z.object({ reference: z.string().max(40), accept: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const profile = await getProfile();
  if (!profile) return { ok: false as const };

  const supabase = await createClient();
  const { data: status, error } = await supabase.rpc("respond_to_quote", {
    ref: parsed.data.reference,
    accept: parsed.data.accept,
  });
  if (error) return { ok: false as const, reason: error.message };

  if (inbox) {
    const { data: q } = await supabase
      .from("quotes")
      .select("reference, origin, destination, price, currency, name, email")
      .eq("reference", parsed.data.reference)
      .single();
    if (q) {
      const verb = status === "accepted" ? "accepted" : "declined";
      const mail = renderTable(`Quote ${q.reference} ${verb}`, [
        ["Reference", q.reference],
        ["Route", `${q.origin} → ${q.destination}`],
        ["Price", `${q.currency} ${q.price}`],
        ["Customer", `${q.name} <${q.email}>`],
      ]);
      await sendMail({ to: inbox, replyTo: q.email, subject: `Quote ${q.reference} ${verb} by customer`, ...mail });
    }
  }

  revalidatePath("/[lang]/app", "layout");
  return { ok: true as const, status };
}

const profileSchema = z.object({
  full_name: z.string().trim().max(200),
  company: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  locale: z.enum(["en", "nl", "ar"]),
});

export async function updateProfile(input: z.input<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(input);
  const profile = await getProfile();
  if (!parsed.success || !profile) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name || null,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      locale: parsed.data.locale,
    })
    .eq("id", profile.id);
  revalidatePath("/[lang]/app", "layout");
  return { ok: !error };
}
