import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { getDictionary } from "@/dictionaries";
import { getMembership, requireProfile, safeNext } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false } };

export default async function AppLayout({ children, params }: LayoutProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const requested = (await headers()).get("x-tfs-path");
  const profile = await requireProfile(lang, safeNext(requested, href(lang, "/app")));
  const dict = await getDictionary(lang);

  // Safety net: make sure the account has a company and its earlier guest quotes.
  const supabase = await createClient();
  await supabase.rpc("claim_my_quotes");
  const membership = await getMembership();

  return (
    <AppShell
      locale={lang}
      t={dict.ui.app}
      statuses={dict.app.statuses}
      orderStatuses={dict.market.orders.statuses}
      language={dict.common.language}
      cartLabels={{ open: dict.market.cart.open, count: dict.market.cart.count }}
      tabLabels={dict.ui.tabs}
      user={{
        name: profile.full_name || profile.email.split("@")[0],
        email: profile.email,
        company: membership?.companyName ?? null,
        isStaff: profile.role === "staff",
      }}
    >
      {children}
    </AppShell>
  );
}
