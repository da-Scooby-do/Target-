import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelRegistration } from "@/components/events/CancelRegistration";
import { EventForm } from "@/components/events/EventForm";
import { requireStaff } from "@/lib/auth";
import { eventColumns, type EventRow, type RegistrationStatus } from "@/lib/events";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit event" };

type Reg = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  attendees: number;
  notes: string | null;
  status: RegistrationStatus;
  created_at: string;
};
const tone = { registered: "green", waitlist: "amber", cancelled: "gray" } as const;

export default async function EditEvent({ params }: PageProps<"/[lang]/app/admin/events/[id]">) {
  await requireStaff("en", "/en/app/admin/events");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: regs }] = await Promise.all([
    supabase.from("events").select(eventColumns).eq("id", id).maybeSingle(),
    supabase.from("event_registrations").select("*").eq("event_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  const event = data as EventRow;
  const list = (regs ?? []) as Reg[];
  const active = list.filter((r) => r.status !== "cancelled");
  const emails = active.map((r) => r.email).join(", ");

  return (
    <div className="page">
      <Link href="/en/app/admin/events" className="back-link">
        Events
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{event.title}</h1>
          <p className="page-sub">
            {event.status === "draft" ? "Draft, not visible yet. " : null}
            <Link href={`/en/events/${event.slug}`}>View public page</Link>
          </p>
        </div>
      </div>
      <div className="dash-grid">
        <EventForm event={event} />
        <section className="panel" aria-labelledby="regs-heading">
          <h2 id="regs-heading" className="panel-title">
            Registrations <span className="count">{active.length}</span>
          </h2>
          <p className="muted">
            {event.seats_taken} places taken{event.capacity ? ` of ${event.capacity}` : ""}. Waiting list moves up automatically when someone cancels.
          </p>
          {active.length ? (
            <>
              <ul className="reg-list">
                {list.map((r) => (
                  <li key={r.id} data-cancelled={r.status === "cancelled" || undefined}>
                    <div>
                      <b>{r.name}</b>
                      {r.attendees > 1 ? <small> +{r.attendees - 1}</small> : null}
                      <small>
                        <a href={`mailto:${r.email}`}>{r.email}</a>
                        {r.company ? ` · ${r.company}` : ""}
                        {r.phone ? ` · ${r.phone}` : ""}
                      </small>
                      {r.notes ? <small>“{r.notes}”</small> : null}
                      <small className="muted">{formatDateTime(r.created_at, "en")}</small>
                    </div>
                    <span className={`tfs-badge tfs-badge--${tone[r.status]}`}>{r.status}</span>
                    {r.status !== "cancelled" ? <CancelRegistration id={r.id} label="Cancel" confirm={`Cancel ${r.name}'s registration?`} /> : null}
                  </li>
                ))}
              </ul>
              <details className="reg-emails">
                <summary>Copy all email addresses</summary>
                <textarea className="tfs-textarea" rows={3} readOnly value={emails} />
              </details>
            </>
          ) : (
            <p className="empty">No registrations yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
