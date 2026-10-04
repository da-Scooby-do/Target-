import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/portal/profile">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).app.portal.nav.profile };
}

export default async function PortalProfile({ params }: PageProps<"/[lang]/portal/profile">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.portal.profile;
  const profile = await requireProfile(lang, href(lang, "/portal/profile"));

  return (
    <div className="portal-stack">
      <h1 className="tfs-app-h1">{t.heading}</h1>
      <section className="portal-panel">
        <p>{t.lead}</p>
        <ProfileForm profile={profile} t={t} />
      </section>
    </div>
  );
}
