import { SupplierActions } from "@/components/market/admin";
import { requireStaff } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Suppliers" };

type Row = {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  description: string | null;
  status: "pending" | "approved" | "suspended";
  created_at: string;
  companies: { name: string } | null;
};

const tone = { pending: "amber", approved: "green", suspended: "red" } as const;

export default async function AdminSuppliers() {
  await requireStaff("en", "/en/app/admin/suppliers");
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, country, website, description, status, created_at, companies(name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const order = { pending: 0, approved: 1, suspended: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  return (
    <div className="page">
      <h1 className="page-title">Suppliers</h1>
      {rows.length ? (
        <ul className="supplier-list">
          {rows.map((s) => (
            <li key={s.id} className="panel">
              <div className="panel-bar">
                <div>
                  <h2 className="panel-title">{s.name}</h2>
                  <p className="muted">
                    {[s.country, s.companies?.name ? `account: ${s.companies.name}` : null, `applied ${formatDay(s.created_at, "en")}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className={`tfs-badge tfs-badge--${tone[s.status]}`}>{s.status}</span>
              </div>
              {s.description ? <p>{s.description}</p> : null}
              {s.website ? (
                <p>
                  <a href={s.website} target="_blank" rel="noopener noreferrer" dir="ltr">
                    {s.website}
                  </a>
                </p>
              ) : null}
              <SupplierActions id={s.id} status={s.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel empty">No supplier applications yet.</p>
      )}
    </div>
  );
}
