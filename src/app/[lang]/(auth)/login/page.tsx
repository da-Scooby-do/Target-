import { notFound, redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { getDictionary } from "@/dictionaries";
import { getProfile, safeNext } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.auth.login.title };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, href(lang, "/app"));
  if (await getProfile()) redirect(next);
  const t = (await getDictionary(lang)).ui.auth;

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t.login.title}</h1>
      <p className="auth-subtitle">{t.login.subtitle}</p>
      <LoginForm locale={lang} t={t} next={next} linkError={sp.error === "link"} />
    </div>
  );
}
