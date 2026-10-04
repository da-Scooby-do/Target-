import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { formatWhen, isOver, placeText, type EventRow } from "@/lib/events";
import { eventColumns } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Events" };
const tone = { draft: "gray", published: "green", cancelled: "red" } as const;

export default async function AdminEvents() {
  await requireStaff("en", "/en/app/admin/events");
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(eventColumns).order("starts_at", { ascending: false }).limit(300);
  const events = (data ?? []) as EventRow[];
  // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
  const now = Date.now();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-sub">Published events appear on the Events tab. Examples show a label until you edit them.</p>
        </div>
        <Link href="/en/app/admin/events/new" className="tfs-btn tfs-btn--primary">
          New event
        </Link>
      </div>
      <section className="panel">
        {events.length ? (
          <div className="table-wrap">
            <table className="tfs-table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">When</th>
                  <th scope="col">Where</th>
                  <th scope="col">Places</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/en/app/admin/events/${e.id}`}>{e.title}</Link>
                      {e.is_example ? <span className="tfs-badge tfs-badge--amber" style={{ marginInlineStart: 8 }}>Example</span> : null}
                    </td>
                    <td>
                      {formatWhen(e, "en")}
                      {isOver(e, now) ? <small className="muted"> (past)</small> : null}
                    </td>
                    <td>{placeText(e, "Online")}</td>
                    <td>{e.capacity ? `${e.seats_taken} / ${e.capacity}` : e.seats_taken}</td>
                    <td>
                      <span className={`tfs-badge tfs-badge--${tone[e.status]}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No events yet.</p>
        )}
      </section>
    </div>
  );
}
