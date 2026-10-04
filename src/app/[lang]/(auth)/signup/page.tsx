import { notFound, redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms";
import { getDictionary } from "@/dictionaries";
import { getProfile, safeNext } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.auth.signup.title };
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, href(lang, "/app"));
  if (await getProfile()) redirect(next);
  const t = (await getDictionary(lang)).ui.auth;

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t.signup.title}</h1>
      <p className="auth-subtitle">{t.signup.subtitle}</p>
      <SignupForm
        locale={lang}
        t={t}
        next={next}
        email={typeof sp.email === "string" ? sp.email : ""}
        invited={sp.invite === "1"}
      />
    </div>
  );
}
