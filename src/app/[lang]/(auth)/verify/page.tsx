import Link from "next/link";
import { notFound } from "next/navigation";
import { ResendButton } from "@/components/auth/AuthForms";
import { Icon } from "@/components/Icon";
import { getDictionary } from "@/dictionaries";
import { safeNext } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/verify">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.auth.verify.title };
}

export default async function VerifyPage({ params, searchParams }: PageProps<"/[lang]/verify">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, href(lang, "/app"));
  const t = (await getDictionary(lang)).ui.auth;
  const [before, after] = t.verify.text.split("{email}");

  return (
    <div className="auth-card auth-card--center">
      <span className="auth-icon">
        <Icon name="mail" size={28} />
      </span>
      <h1 className="auth-title">{t.verify.title}</h1>
      <p className="auth-subtitle">
        {before}
        <strong dir="ltr">{email}</strong>
        {after}
      </p>
      <ResendButton t={t} email={email} next={next} />
      <p className="auth-switch">
        <Link href={href(lang, "/signup")}>{t.verify.wrongEmail}</Link>
      </p>
    </div>
  );
}
