"use client";

import { TabBar, type TabLabels } from "./TabBar";
import { useSignedIn } from "./useSignedIn";
import type { Locale } from "@/lib/i18n";

/** Bottom tabs on the public site: they open the app for signed-in visitors. */
export function SiteTabBar({ locale, labels }: { locale: Locale; labels: TabLabels }) {
  const signedIn = useSignedIn();
  return <TabBar locale={locale} labels={labels} signedIn={signedIn} />;
}
