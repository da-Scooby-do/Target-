"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { useDismiss } from "../useDismiss";
import type { Dictionary } from "@/dictionaries/en";
import type { UiDictionary } from "@/dictionaries/ui/en";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/market";
import { notificationText, timeAgo, type NotificationRow } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 30_000;

/** Bell in the top bar: unread count, latest updates, mark as read. Checks for news every 30 seconds. */
export function NotificationBell({
  locale,
  t,
  statuses,
  orderStatuses,
}: {
  locale: Locale;
  t: UiDictionary["app"]["notifications"];
  statuses: Dictionary["app"]["statuses"];
  orderStatuses: Record<OrderStatus, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  useDismiss(ref);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("notifications")
      .select("id, kind, data, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) setItems(data as NotificationRow[]);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    // Fetch on mount, on every page change, and every 30 seconds while the tab is visible.
    const first = setTimeout(load, 0);
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load, pathname]);

  const unread = items.filter((n) => !n.read_at);

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    const at = new Date().toISOString();
    setItems((list) => list.map((n) => (ids.includes(n.id) ? { ...n, read_at: at } : n)));
    await createClient().from("notifications").update({ read_at: at }).in("id", ids);
  };

  return (
    <details className="bell" ref={ref} onToggle={(e) => (e.currentTarget.open ? load() : undefined)}>
      <summary aria-label={unread.length ? `${t.open} (${t.unread.replace("{n}", String(unread.length))})` : t.open}>
        <Icon name="bell" size={22} />
        {unread.length ? (
          <span className="bell__count" aria-hidden="true">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </summary>
      <div className="bell__panel">
        <div className="bell__head">
          <h2 className="bell__title">{t.title}</h2>
          {unread.length ? (
            <button type="button" className="text-button" onClick={() => markRead(unread.map((n) => n.id))}>
              {t.markAll}
            </button>
          ) : null}
        </div>
        {items.length ? (
          <ul className="bell__list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="bell__item"
                  data-unread={!n.read_at || undefined}
                  onClick={() => {
                    if (!n.read_at) markRead([n.id]);
                    if (ref.current) ref.current.open = false;
                    if (n.link) router.push(`/${locale}${n.link}`);
                  }}
                >
                  <span className="bell__dot" aria-hidden="true" />
                  <span className="bell__text">
                    <span>{notificationText(n, t, statuses, orderStatuses)}</span>
                    <small>{timeAgo(n.created_at, now, t)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bell__empty">{t.empty}</p>
        )}
      </div>
    </details>
  );
}
