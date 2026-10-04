import Link from "next/link";
import { notFound } from "next/navigation";
import { ResetForm } from "@/components/auth/AuthForms";
import { getDictionary } from "@/dictionaries";
import { getProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/reset-password">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.auth.reset.title };
}

/** Reached from the reset email, through /auth/callback, which signs the person in. */
export default async function ResetPage({ params }: PageProps<"/[lang]/reset-password">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).ui.auth;
  const signedIn = Boolean(await getProfile());

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t.reset.title}</h1>
      {signedIn ? (
        <>
          <p className="auth-subtitle">{t.reset.subtitle}</p>
          <ResetForm locale={lang} t={t} />
        </>
      ) : (
        <>
          <p className="auth-subtitle">{t.reset.expired}</p>
          <Link className="tfs-btn tfs-btn--primary tfs-btn--block" href={href(lang, "/forgot-password")}>
            {t.forgot.submit}
          </Link>
        </>
      )}
    </div>
  );
}
