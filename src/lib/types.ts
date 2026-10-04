export type QuoteStatus = "pending" | "quoted" | "accepted" | "declined" | "expired";
export type ShipmentStatus = "booked" | "picked_up" | "in_transit" | "customs" | "delivered" | "cancelled";
export type Mode = "sea" | "air" | "road" | "unsure";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  locale: "en" | "nl" | "ar";
  role: "customer" | "staff";
};

export type Quote = {
  id: string;
  reference: string;
  customer_id: string | null;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  service: string;
  mode: Mode;
  origin: string;
  destination: string;
  ready_date: string | null;
  cargo: string;
  weight: string | null;
  notes: string | null;
  locale: "en" | "nl" | "ar";
  status: QuoteStatus;
  price: number | null;
  currency: string;
  price_note: string | null;
  valid_until: string | null;
  quoted_at: string | null;
  responded_at: string | null;
  created_at: string;
  company_id?: string | null;
  packages?: import("./packages").PackageLine[] | null;
  incoterm?: string | null;
  customer_reference?: string | null;
};

export type Shipment = {
  id: string;
  reference: string;
  quote_id: string | null;
  customer_id: string | null;
  mode: Mode;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  eta: string | null;
  created_at: string;
};

export type ShipmentEvent = {
  id?: string;
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  occurred_at: string;
};

export type DocumentRow = {
  id: string;
  shipment_id: string;
  name: string;
  storage_path: string;
  size: number | null;
  created_at: string;
};

/** Milestones in order, with the icon from the design system. */
export const milestones: { status: Exclude<ShipmentStatus, "cancelled">; icon: string }[] = [
  { status: "booked", icon: "file-text" },
  { status: "picked_up", icon: "package" },
  { status: "in_transit", icon: "truck" },
  { status: "customs", icon: "customs" },
  { status: "delivered", icon: "check" },
];

/** Badge colour per status, as the design system defines. */
export const quoteTone: Record<QuoteStatus, string> = {
  pending: "gray",
  quoted: "blue",
  accepted: "green",
  declined: "red",
  expired: "red",
};
export const shipmentTone: Record<ShipmentStatus, string> = {
  booked: "blue",
  picked_up: "blue",
  in_transit: "blue",
  customs: "amber",
  delivered: "green",
  cancelled: "red",
};

/** A priced quote past its validity date counts as expired even before anyone touches it. */
export function effectiveQuoteStatus(q: Pick<Quote, "status" | "valid_until">): QuoteStatus {
  if (q.status === "quoted" && q.valid_until && q.valid_until < new Date().toISOString().slice(0, 10)) {
    return "expired";
  }
  return q.status;
}
