import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { QuoteTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type QuoteStatus } from "@/lib/types";

export const metadata = { title: "Quotes" };

const statuses: QuoteStatus[] = ["pending", "quoted", "accepted", "declined", "expired"];

export default async function AdminQuotes({ searchParams }: PageProps<"/[lang]/app/admin/quotes">) {
  await requireStaff("en", "/en/app/admin");
  const dict = await getDictionary("en");
  const query = await searchParams;
  const status = statuses.includes(query.status as QuoteStatus) ? (query.status as QuoteStatus) : null;
  const term = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";

  const supabase = await createClient();
  let request = supabase
    .from("quotes")
    .select("reference, origin, destination, status, valid_until, price, currency, created_at, service, email, name, company")
    .order("created_at", { ascending: false })
    .limit(500);
  if (term) {
    // Escape PostgREST filter syntax characters before searching.
    const safe = term.replace(/[%,()*\\]/g, " ");
    request = request.or(
      `reference.ilike.%${safe}%,email.ilike.%${safe}%,name.ilike.%${safe}%,company.ilike.%${safe}%,origin.ilike.%${safe}%,destination.ilike.%${safe}%`,
    );
  }
  const { data } = await request;
  const all = (data ?? []) as Quote[];
  const shown = status ? all.filter((q) => effectiveQuoteStatus(q) === status) : all;

  return (
    <div className="page">
      <h1 className="page-title">Quotes</h1>
      <form className="tfs-filters" method="get">
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="f-q">Search</label>
          <input id="f-q" name="q" className="tfs-input" defaultValue={term} placeholder="Reference, name, email, route" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="f-status">Status</label>
          <select id="f-status" name="status" className="tfs-select" defaultValue={status ?? ""}>
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{dict.app.statuses.quote[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="tfs-btn tfs-btn--secondary">Filter</button>
        {term || status ? <Link href="/en/app/admin/quotes">Clear</Link> : null}
      </form>
      <section className="panel">
        <p className="tfs-small">{shown.length} quotes</p>
        {shown.length ? (
          <QuoteTable quotes={shown} locale="en" dict={dict} base="/app/admin/quotes" />
        ) : (
          <p className="empty">No quotes match.</p>
        )}
      </section>
    </div>
  );
}
