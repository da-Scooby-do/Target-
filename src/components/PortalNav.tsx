"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

type Item = { href: string; label: string; icon: string; exact?: boolean };

export function PortalNav({ items, label }: { items: Item[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="portal-nav">
      <ul>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
