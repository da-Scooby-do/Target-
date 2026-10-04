"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getMembership, getProfile } from "@/lib/auth";
import { inbox, renderTable, sendMail } from "@/lib/email";
import { units } from "@/lib/market";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type MarketResult = { ok: true; reference?: string; id?: string } | { ok: false; error: string };

const done = () => {
  revalidatePath("/[lang]/app", "layout");
  revalidatePath("/[lang]/marketplace", "layout");
};

const reason = (message: string) =>
  /unavailable/.test(message)
    ? "unavailable"
    : /quantity/.test(message)
      ? "quantity"
      : /currenc/.test(message)
        ? "currency"
        : /delivery/.test(message)
          ? "delivery"
          : /already/.test(message)
            ? "already"
            : /owner/.test(message)
              ? "owner"
              : "generic";

// ---------------------------------------------------------------- customers

const orderSchema = z.object({
  items: z
    .array(z.object({ product_id: z.uuid(), quantity: z.number().positive().max(1_000_000) }))
    .min(1)
    .max(50),
  delivery: z.string().trim().min(1).max(600),
  notes: z.string().trim().max(2000),
  reference: z.string().trim().max(100),
});

export async function placeOrder(input: z.input<typeof orderSchema>): Promise<MarketResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "delivery") ? "delivery" : "generic" };
  }
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "auth" };
  const d = parsed.data;
  const supabase = await createClient();
  const { data: ref, error } = await supabase.rpc("place_order", {
    p_items: d.items,
    p_delivery: d.delivery,
    p_notes: d.notes,
    p_reference: d.reference,
  });
  if (error) {
    console.error("[market] place_order failed", error.message);
    return { ok: false, error: reason(error.message) };
  }

  if (inbox) {
    const { data: lines } = await supabase
      .from("order_items")
      .select("name, quantity, unit, line_total, orders!inner(reference, subtotal, currency)")
      .eq("orders.reference", ref);
    const membership = await getMembership();
    const mail = renderTable(`New marketplace order ${ref}`, [
      ["Reference", ref as string],
      ["Customer", `${profile.full_name ?? ""} <${profile.email}>`],
      ["Company", membership?.companyName ?? "-"],
      ["Delivery", d.delivery],
      ...((lines ?? []).map((l) => [l.name, `${l.quantity} ${l.unit} = ${l.line_total}`]) as [string, string][]),
      ["Customer reference", d.reference || "-"],
      ["Notes", d.notes || "-"],
      ["Confirm it", `${site.url}/en/app/admin/orders/${ref}`],
    ]);
    await sendMail({ to: inbox, replyTo: profile.email, subject: `Marketplace order ${ref}`, ...mail });
  }

  done();
  return { ok: true, reference: ref as string };
}

export async function cancelOrder(reference: string): Promise<MarketResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_ref: reference.slice(0, 40) });
  if (error) return { ok: false, error: reason(error.message) };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- suppliers

const supplierSchema = z.object({
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().max(100),
  description: z.string().trim().max(2000),
  website: z.string().trim().max(300),
});

export async function applyAsSupplier(input: z.input<typeof supplierSchema>): Promise<MarketResult> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_as_supplier", {
    p_name: d.name,
    p_country: d.country,
    p_description: d.description,
    p_website: d.website,
  });
  if (error) return { ok: false, error: reason(error.message) };
  if (inbox) {
    const profile = await getProfile();
    const mail = renderTable(`Supplier application: ${d.name}`, [
      ["Company", d.name],
      ["Country", d.country || "-"],
      ["Website", d.website || "-"],
      ["Sells", d.description || "-"],
      ["Applied by", profile?.email ?? "-"],
      ["Review", `${site.url}/en/app/admin/suppliers`],
    ]);
    await sendMail({ to: inbox, subject: `Supplier application: ${d.name}`, ...mail });
  }
  done();
  return { ok: true };
}

export async function updateSupplierProfile(input: z.input<typeof supplierSchema>): Promise<MarketResult> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const membership = await getMembership();
  if (!membership) return { ok: false, error: "auth" };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ name: d.name, country: d.country || null, description: d.description || null, website: d.website || null })
    .eq("company_id", membership.companyId);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- products (suppliers and staff)

const productSchema = z.object({
  id: z.uuid().optional(),
  category: z.enum(["wood", "doors", "ceramics", "building"]),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000),
  unit: z.enum(units),
  price: z.number().min(0).max(10_000_000),
  currency: z.enum(["EUR", "USD"]),
  min_qty: z.number().positive().max(1_000_000),
  origin_country: z.string().trim().max(100),
  lead_time_days: z.number().int().min(0).max(365).nullable(),
  specs: z
    .array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(200) }))
    .max(20),
  images: z.array(z.string().max(300).regex(/^(\/products\/[a-z0-9-]+\.jpg|[a-z0-9-]+\/[a-z0-9-]+\.(jpg|png|webp))$/)).max(8),
  /** Staff choose the status; suppliers can only hide a product or submit it for review. */
  status: z.enum(["pending", "active", "hidden", "rejected"]),
  /** Staff only: the supplier a product belongs to; null for products TFS sells itself. */
  supplier_id: z.uuid().nullable().optional(),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<MarketResult> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const profile = await getProfile();
  if (!profile) return { ok: false, error: "auth" };
  const staff = profile.role === "staff";
  const { id, supplier_id, ...fields } = parsed.data;
  const supabase = await createClient();

  const row = {
    ...fields,
    description: fields.description || null,
    origin_country: fields.origin_country || null,
  };

  let ownSupplier: string | null = null;
  if (!staff) {
    const { data } = await supabase.rpc("my_supplier_id");
    ownSupplier = (data as string | null) ?? null;
    if (!ownSupplier) return { ok: false, error: "auth" };
    // Images must live in the supplier's own folder.
    if (row.images.some((path) => !path.startsWith(`${ownSupplier}/`) && !path.startsWith("/products/"))) return { ok: false, error: "invalid" };
  }

  const result = id
    ? await supabase.from("products").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("products")
        .insert({ ...row, supplier_id: staff ? (supplier_id ?? null) : ownSupplier })
        .select("id")
        .single();
  if (result.error) {
    console.error("[market] save product failed", result.error.message);
    return { ok: false, error: "generic" };
  }
  done();
  return { ok: true, id: result.data.id };
}

export async function deleteProduct(id: string): Promise<MarketResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

// ---------------------------------------------------------------- staff

export async function setSupplierStatus(id: string, status: "pending" | "approved" | "suspended"): Promise<MarketResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_supplier_status", { p_id: id, p_status: status });
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

export async function setProductStatus(id: string, status: "pending" | "active" | "hidden" | "rejected"): Promise<MarketResult> {
  const profile = await getProfile();
  if (profile?.role !== "staff") return { ok: false, error: "auth" };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

const orderUpdateSchema = z.object({
  reference: z.string().max(40),
  status: z.enum(["submitted", "confirmed", "shipped", "delivered", "cancelled"]),
  shipping: z.number().min(0).max(10_000_000).nullable(),
  note: z.string().trim().max(2000),
});

export async function updateOrder(input: z.input<typeof orderUpdateSchema>): Promise<MarketResult> {
  const parsed = orderUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order", {
    p_ref: d.reference,
    p_status: d.status,
    p_shipping: d.shipping,
    p_note: d.note,
  });
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}
