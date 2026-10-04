"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CartView } from "./CartView";
import { useAccount } from "../useAccount";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { href, type Locale } from "@/lib/i18n";

export function GuestCart({ locale, t }: { locale: Locale; t: MarketDictionary }) {
  const router = useRouter();
  const account = useAccount();
  useEffect(() => {
    if (account) router.replace(href(locale, "/app/cart"));
  }, [account, locale, router]);
  if (account !== false) return <div className="panel" aria-busy="true" />;
  return <CartView locale={locale} t={t} addresses={[]} guest />;
}
