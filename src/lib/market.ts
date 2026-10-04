import type { Locale } from "./i18n";
import { supabaseUrl } from "./supabase/config";

export const units = ["piece", "m2", "m3", "lm", "pallet", "set", "kg"] as const;
export type Unit = (typeof units)[number];
export type ProductStatus = "pending" | "active" | "hidden" | "rejected";
export type OrderStatus = "submitted" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type SupplierStatus = "pending" | "approved" | "suspended";

export type Category = { slug: string; sort: number; name_en: string; name_nl: string; name_ar: string };

export type Product = {
  id: string;
  supplier_id: string | null;
  category: string;
  name: string;
  description: string | null;
  unit: Unit;
  price: number;
  currency: string;
  min_qty: number;
  origin_country: string | null;
  lead_time_days: number | null;
  specs: { label: string; value: string }[];
  images: string[];
  status: ProductStatus;
  suppliers?: { name: string } | null;
};

export type Order = {
  id: string;
  reference: string;
  status: OrderStatus;
  delivery_address: string;
  notes: string | null;
  customer_reference: string | null;
  currency: string;
  subtotal: number;
  shipping: number | null;
  staff_note: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  supplier_id: string | null;
  name: string;
  unit: Unit;
  unit_price: number;
  quantity: number;
  line_total: number;
};

/** Columns the catalogue shows, with the supplier's public name. */
export const productColumns =
  "id, supplier_id, category, name, description, unit, price, currency, min_qty, origin_country, lead_time_days, specs, images, status, suppliers(name)";

export const categoryName = (c: Category, locale: Locale) => (locale === "nl" ? c.name_nl : locale === "ar" ? c.name_ar : c.name_en);

/** Public URL of a product photo in the "products" bucket. */
export const imageUrl = (path: string) => `${supabaseUrl}/storage/v1/object/public/products/${path}`;

/** Icon shown when a product has no photo yet. */
export const categoryIcon: Record<string, string> = {
  wood: "wood",
  doors: "door",
  ceramics: "tiles",
  building: "bricks",
};

export const orderTone: Record<OrderStatus, string> = {
  submitted: "gray",
  confirmed: "blue",
  shipped: "blue",
  delivered: "green",
  cancelled: "red",
};
export const productTone: Record<ProductStatus, string> = {
  pending: "amber",
  active: "green",
  hidden: "gray",
  rejected: "red",
};

/** Quantities: up to two decimals, Latin digits. */
export const formatQty = (n: number) => String(Math.round(n * 100) / 100);
