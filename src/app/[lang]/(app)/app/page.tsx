import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

/** No customer dashboard: staff land on the admin overview, customers on their profile. */
export default async function AppHome({ params }: PageProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app"));
  redirect(profile.role === "staff" ? href("en", "/app/admin") : href(lang, "/app/me"));
}
