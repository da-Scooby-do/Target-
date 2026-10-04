import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { getProfile, safeNext } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { supabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { ...pageMetadata(lang, "/login", dict.app.login.metaTitle, dict.app.login.lead), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.login;
  const query = await searchParams;
  const next = safeNext(typeof query.next === "string" ? query.next : null, href(lang, "/portal"));

  if (await getProfile()) redirect(next);

  return (
    <Section>
      <div className="login-layout">
        <div className="login-intro">
          <p className="tfs-eyebrow">{t.eyebrow}</p>
          <h1 className="tfs-h1">{t.heading}</h1>
          <p className="tfs-lead">{t.lead}</p>
          <ul className="check-list">
            {dict.app.homePortal.features.map((f) => (
              <li key={f.title}>
                <span className="check-dot" aria-hidden="true" />
                <span>{f.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="tfs-card tfs-card--light login-card">
          {query.error ? (
            <p className="form-error" role="alert">
              {t.linkError}
            </p>
          ) : null}
          {supabaseConfigured ? (
            <LoginForm
              locale={lang}
              next={next}
              initialEmail={typeof query.email === "string" ? query.email : ""}
              t={t}
              emailError={dict.quote.errors.email}
            />
          ) : (
            <p>{t.unavailable}</p>
          )}
        </div>
      </div>
    </Section>
  );
}
