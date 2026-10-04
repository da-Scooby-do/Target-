import Link from "next/link";
import { Icon } from "../Icon";
import type { Dictionary } from "@/dictionaries";
import { formatDay } from "@/lib/format";
import { href, type Locale } from "@/lib/i18n";
import { milestones, shipmentTone, type Shipment } from "@/lib/types";

const modeIcon = { sea: "ship", air: "plane", road: "truck", unsure: "package" } as const;

/** A shipment at a glance: route, status, progress through the five milestones and ETA. */
export function ShipmentCard({
  shipment: s,
  locale,
  dict,
}: {
  shipment: Pick<Shipment, "reference" | "origin" | "destination" | "status" | "eta" | "mode">;
  locale: Locale;
  dict: Dictionary;
}) {
  const step = milestones.findIndex((m) => m.status === s.status);
  const pct = s.status === "cancelled" ? 0 : Math.round(((step + 1) / milestones.length) * 100);
  return (
    <Link href={href(locale, `/app/shipments/${s.reference}`)} className="ship-card">
      <span className="ship-card__icon">
        <Icon name={modeIcon[s.mode]} size={22} />
      </span>
      <span className="ship-card__main">
        <span className="ship-card__top">
          <span className="tfs-ref" dir="ltr">
            {s.reference}
          </span>
          <span className={`tfs-badge tfs-badge--${shipmentTone[s.status]}`}>{dict.app.statuses.shipment[s.status]}</span>
        </span>
        <span className="ship-card__route">
          {s.origin} <span aria-hidden="true" className="route-arrow">→</span> {s.destination}
        </span>
        <span className="progress" role="img" aria-label={`${pct}%`}>
          <span style={{ inlineSize: `${pct}%` }} />
        </span>
        {s.eta ? (
          <span className="ship-card__eta">
            {dict.app.track.eta}: {formatDay(s.eta, locale)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
