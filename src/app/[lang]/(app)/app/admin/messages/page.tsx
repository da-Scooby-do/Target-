import Link from "next/link";
import { MessageHandledButton } from "@/components/admin-buttons";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Messages" };

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  locale: string;
  handled: boolean;
  created_at: string;
};

/** Messages sent through the contact form. */
export default async function AdminMessages({ searchParams }: PageProps<"/[lang]/app/admin/messages">) {
  await requireStaff("en", "/en/app/admin/messages");
  const all = (await searchParams).show === "all";
  const supabase = await createClient();
  let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (!all) query = query.eq("handled", false);
  const { data } = await query;
  const messages = (data ?? []) as Message[];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-sub">Sent through the contact form on the website.</p>
        </div>
      </div>
      <nav className="chip-row" aria-label="Filter messages">
        <Link href="/en/app/admin/messages" className="chip" aria-current={!all ? "true" : undefined}>
          New
        </Link>
        <Link href="/en/app/admin/messages?show=all" className="chip" aria-current={all ? "true" : undefined}>
          All
        </Link>
      </nav>
      {messages.length ? (
        <ul className="message-list">
          {messages.map((m) => (
            <li key={m.id} className="panel message" data-handled={m.handled || undefined}>
              <div className="message__head">
                <div>
                  <h2 className="panel-title">{m.subject}</h2>
                  <p className="muted">
                    {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a>
                    {m.phone ? <> · <a href={`tel:${m.phone.replace(/\s/g, "")}`}>{m.phone}</a></> : null} · {formatDateTime(m.created_at, "en")} ·{" "}
                    {m.locale.toUpperCase()}
                  </p>
                </div>
                <MessageHandledButton id={m.id} handled={m.handled} />
              </div>
              <p className="message__body">{m.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel empty">{all ? "No messages yet." : "No new messages. Everything is handled."}</p>
      )}
    </div>
  );
}
