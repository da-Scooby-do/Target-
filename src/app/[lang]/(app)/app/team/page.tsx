import { notFound } from "next/navigation";
import { AcceptInvite, InviteForm, MemberActions, RevokeButton, type Invite, type Member } from "@/components/app/TeamPanel";
import { getDictionary } from "@/dictionaries";
import { getMembership, requireProfile } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/team">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.team.title };
}

export default async function TeamPage({ params }: PageProps<"/[lang]/app/team">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app/team"));
  const membership = await getMembership();
  const dict = await getDictionary(lang);
  const t = dict.ui.app.team;
  const supabase = await createClient();
  const isOwner = membership?.role === "owner";

  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    supabase
      .from("company_members")
      .select("role, created_at, profiles(id, full_name, email)")
      .eq("company_id", membership?.companyId ?? "")
      .order("created_at"),
    supabase.from("invitations").select("id, email, created_at, company_id, companies(name)").is("accepted_at", null).order("created_at"),
  ]);

  const members: Member[] = (memberRows ?? []).map((m) => {
    const p = m.profiles as unknown as { id: string; full_name: string | null; email: string };
    return { id: p.id, name: p.full_name || p.email, email: p.email, role: m.role as Member["role"], isYou: p.id === profile.id };
  });
  type InviteRow = { id: string; email: string; created_at: string; company_id: string; companies: { name: string } | null };
  const invites = (inviteRows ?? []) as unknown as InviteRow[];
  const pending: Invite[] = invites
    .filter((i) => i.company_id === membership?.companyId)
    .map((i) => ({ id: i.id, email: i.email, created: i.created_at }));
  const forMe = invites.filter((i) => i.company_id !== membership?.companyId && i.email.toLowerCase() === profile.email.toLowerCase());

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-sub">{t.subtitle.replace("{company}", membership?.companyName ?? "")}</p>
        </div>
      </div>

      {forMe.map((i) => (
        <AcceptInvite key={i.id} t={t} invite={{ id: i.id, email: i.email, created: i.created_at }} company={i.companies?.name ?? ""} />
      ))}

      <div className="dash-grid">
        <section className="panel" aria-labelledby="members-heading">
          <h2 id="members-heading" className="panel-title">
            {t.members} <span className="count">{members.length}</span>
          </h2>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.id}>
                <span className="avatar" aria-hidden="true">
                  {m.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("")}
                </span>
                <span className="member-list__who">
                  <b>
                    {m.name}
                    {m.isYou ? <span className="muted"> ({t.you})</span> : null}
                  </b>
                  <small dir="ltr">{m.email}</small>
                </span>
                <span className={`tfs-badge tfs-badge--${m.role === "owner" ? "blue" : "gray"}`}>
                  {m.role === "owner" ? t.owner : t.member}
                </span>
                {isOwner && !m.isYou ? <MemberActions t={t} member={m} /> : null}
              </li>
            ))}
          </ul>

          {pending.length ? (
            <>
              <h3 className="panel-subtitle">{t.pending}</h3>
              <ul className="member-list">
                {pending.map((i) => (
                  <li key={i.id}>
                    <span className="avatar avatar--ghost" aria-hidden="true">
                      @
                    </span>
                    <span className="member-list__who">
                      <b dir="ltr">{i.email}</b>
                      <small>{t.invitedOn.replace("{date}", formatDay(i.created, lang))}</small>
                    </span>
                    {isOwner ? <RevokeButton t={t} invite={i} /> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="panel-title">
            {t.inviteTitle}
          </h2>
          {isOwner ? <InviteForm t={t} locale={lang} /> : <p className="muted">{t.onlyOwner}</p>}
        </section>
      </div>
    </div>
  );
}
