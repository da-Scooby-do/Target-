import Link from "next/link";
import { notFound } from "next/navigation";
import { ForgotForm } from "@/components/auth/AuthForms";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/forgot-password">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.auth.forgot.title };
}

export default async function ForgotPage({ params }: PageProps<"/[lang]/forgot-password">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).ui.auth;

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t.forgot.title}</h1>
      <p className="auth-subtitle">{t.forgot.subtitle}</p>
      <ForgotForm locale={lang} t={t} />
      <p className="auth-switch">
        <Link href={href(lang, "/login")}>{t.forgot.back}</Link>
      </p>
    </div>
  );
}
