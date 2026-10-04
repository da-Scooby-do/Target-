import { formatDateTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { milestones, type ShipmentEvent, type ShipmentStatus } from "@/lib/types";

type Props = {
  status: ShipmentStatus;
  events: ShipmentEvent[];
  locale: Locale;
  labels: Record<ShipmentStatus, string>;
  empty: string;
};

/**
 * The five milestones in order. Reached milestones show when and where;
 * the current one is marked; the rest are upcoming.
 */
export function ShipmentTimeline({ status, events, locale, labels, empty }: Props) {
  if (status === "cancelled") {
    return <p className="tfs-badge tfs-badge--red">{labels.cancelled}</p>;
  }
  const currentIndex = milestones.findIndex((m) => m.status === status);
  const latest = (s: ShipmentStatus) => [...events].reverse().find((e) => e.status === s);

  return (
    <>
      {events.length === 0 ? <p className="tfs-small">{empty}</p> : null}
      <ol className="tfs-timeline">
        {milestones.map((m, i) => {
          const event = latest(m.status);
          const state = i < currentIndex || (i === currentIndex && m.status === "delivered") ? "done" : i === currentIndex ? "current" : "todo";
          return (
            <li key={m.status} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <b>{labels[m.status]}</b>
              {event ? (
                <span>
                  {formatDateTime(event.occurred_at, locale)}
                  {event.location ? ` · ${event.location}` : ""}
                  {event.note ? ` · ${event.note}` : ""}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}
