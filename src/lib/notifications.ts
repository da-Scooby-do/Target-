import type { Dictionary } from "@/dictionaries/en";
import type { UiDictionary } from "@/dictionaries/ui/en";
import type { OrderStatus } from "./market";
import type { QuoteStatus, ShipmentStatus } from "./types";

export type NotificationRow = {
  id: string;
  kind: keyof UiDictionary["app"]["notifications"]["kinds"];
  data: { ref?: string; status?: string; name?: string; from?: string; to?: string };
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** One line of text for a notification, in the reader's language. */
export function notificationText(
  n: NotificationRow,
  t: UiDictionary["app"]["notifications"],
  statuses: Dictionary["app"]["statuses"],
  orderStatuses?: Record<OrderStatus, string>,
) {
  const template = t.kinds[n.kind] ?? n.kind;
  const status =
    n.kind === "shipment_update"
      ? statuses.shipment[n.data.status as ShipmentStatus]
      : n.kind === "staff_quote_answered"
        ? statuses.quote[n.data.status as QuoteStatus]
        : n.kind === "order_update"
          ? orderStatuses?.[n.data.status as OrderStatus]
          : undefined;
  return template
    .replace("{ref}", n.data.ref ?? "")
    .replace("{name}", n.data.name ?? "")
    .replace("{status}", (status ?? n.data.status ?? "").toLocaleLowerCase());
}

/** "just now", "5 min ago", "3 h ago", "2 d ago". */
export function timeAgo(iso: string, now: number, t: UiDictionary["app"]["notifications"]) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo.replace("{n}", String(minutes));
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t.hoursAgo.replace("{n}", String(hours));
  return t.daysAgo.replace("{n}", String(Math.round(hours / 24)));
}
