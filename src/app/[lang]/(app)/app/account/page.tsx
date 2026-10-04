import { notFound } from "next/navigation";
import { CompanyForm, PasswordForm } from "@/components/app/AccountForms";
import { ProfileForm } from "@/components/ProfileForm";
import { getDictionary } from "@/dictionaries";
import { getMembership, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.account.title };
}

export default async function AccountPage({ params }: PageProps<"/[lang]/app/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app/account"));
  const membership = await getMembership();
  const dict = await getDictionary(lang);
  const t = dict.ui.app.account;
  const supabase = await createClient();

  const [{ data: company }, { data: claims }] = await Promise.all([
    supabase.from("companies").select("name, vat_number, country").eq("id", membership?.companyId ?? "").maybeSingle(),
    supabase.auth.getClaims(),
  ]);
  const provider = (claims?.claims?.app_metadata as { provider?: string } | undefined)?.provider;

  return (
    <div className="page page--narrow">
      <div className="page-head">
        <h1 className="page-title">{t.title}</h1>
      </div>
      <section className="panel" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="panel-title">
          {t.profile}
        </h2>
        <ProfileForm profile={profile} t={dict.app.portal.profile} />
      </section>
      {company ? (
        <section className="panel" aria-labelledby="company-heading">
          <h2 id="company-heading" className="panel-title">
            {t.company}
          </h2>
          <CompanyForm t={t} company={company} canEdit={membership?.role === "owner"} />
        </section>
      ) : null}
      <section className="panel" aria-labelledby="security-heading">
        <h2 id="security-heading" className="panel-title">
          {t.security}
        </h2>
        <PasswordForm t={t} google={provider === "google"} />
      </section>
    </div>
  );
}
