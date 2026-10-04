"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { href, type Locale } from "@/lib/i18n";

export type TabLabels = { label: string; shipping: string; marketplace: string; events: string; profile: string };

/**
 * App-style bottom navigation on phones and tablets (hidden on desktop).
 * Signed-in visitors go into the app; guests get the public pages and the login screen.
 */
export function TabBar({ locale, labels, signedIn }: { locale: Locale; labels: TabLabels; signedIn: boolean | null }) {
  const pathname = usePathname() ?? "";
  const p = (path: string) => href(locale, path);
  const rest = pathname.slice(locale.length + 1) || "/";

  const tabs = [
    {
      key: "shipping",
      label: labels.shipping,
      icon: "ship",
      to: signedIn ? p("/app/shipments") : p("/track"),
      active:
        /^\/(track|quote)\b/.test(rest) ||
        rest.startsWith("/services/shipping-forwarding") ||
        rest.startsWith("/services/logistics-supply-chain") ||
        rest === "/app" ||
        /^\/app\/(shipments|quotes|new|addresses)\b/.test(rest),
    },
    {
      key: "marketplace",
      label: labels.marketplace,
      icon: "store",
      to: signedIn ? p("/app/shop") : p("/marketplace"),
      active: rest.startsWith("/marketplace") || /^\/app\/(shop|cart|orders|supplier)\b/.test(rest),
    },
    {
      key: "events",
      label: labels.events,
      icon: "conference",
      to: p("/events"),
      active: rest.startsWith("/events") || rest.startsWith("/services/conference-economic-events") || rest.startsWith("/app/events"),
    },
    {
      key: "profile",
      label: labels.profile,
      icon: "user",
      to: signedIn ? p("/app/me") : p("/login"),
      active: /^\/(login|signup)\b/.test(rest) || /^\/app\/(me|account|team|admin)\b/.test(rest),
    },
  ];

  return (
    <nav className="tabbar" aria-label={labels.label}>
      <ul>
        {tabs.map((t) => (
          <li key={t.key}>
            <Link href={t.to} className="tabbar__tab" aria-current={t.active ? "page" : undefined}>
              <span className="tabbar__icon">
                <Icon name={t.icon} size={24} />
              </span>
              <span className="tabbar__label">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
