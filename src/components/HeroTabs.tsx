"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";
import type { Dictionary } from "@/dictionaries/en";
import { href, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  t: Dictionary["app"]["hero"];
  modes: Dictionary["quote"]["modes"];
};

/** Light inset card in the home hero: track by reference, or start a quote with the route filled in. */
export function HeroTabs({ locale, t, modes }: Props) {
  const router = useRouter();
  const id = useId();
  const [tab, setTab] = useState<"track" | "quote">("track");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const order = ["track", "quote"] as const;
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = tab === "track" ? 1 : 0;
    setTab(order[next]);
    tabs.current[next]?.focus();
  };

  return (
    <div className="tfs-card tfs-card--light hero-tabs">
      <div role="tablist" aria-label={t.tabsLabel} className="hero-tabs__list" onKeyDown={onKey}>
        {order.map((key, i) => (
          <button
            key={key}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-${key}-tab`}
            aria-selected={tab === key}
            aria-controls={`${id}-${key}`}
            tabIndex={tab === key ? 0 : -1}
            className="hero-tabs__tab"
            onClick={() => setTab(key)}
          >
            <Icon name={key === "track" ? "search" : "file-text"} size={20} />
            {key === "track" ? t.tabTrack : t.tabQuote}
          </button>
        ))}
      </div>

      <form
        id={`${id}-track`}
        role="tabpanel"
        aria-labelledby={`${id}-track-tab`}
        hidden={tab !== "track"}
        className="hero-tabs__panel"
        onSubmit={(e) => {
          e.preventDefault();
          const ref = String(new FormData(e.currentTarget).get("ref") ?? "").trim();
          router.push(href(locale, `/track${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`));
        }}
      >
        <div className="tfs-field hero-tabs__grow">
          <label className="tfs-label" htmlFor={`${id}-ref`}>
            {t.trackLabel}
          </label>
          <input
            id={`${id}-ref`}
            name="ref"
            className="tfs-input"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            placeholder={t.trackPlaceholder}
            aria-describedby={`${id}-ref-help`}
          />
          <span id={`${id}-ref-help`} className="tfs-help">
            {t.trackHelp}
          </span>
        </div>
        <button type="submit" className="tfs-btn tfs-btn--primary">
          {t.trackButton}
        </button>
      </form>

      <form
        id={`${id}-quote`}
        role="tabpanel"
        aria-labelledby={`${id}-quote-tab`}
        hidden={tab !== "quote"}
        className="hero-tabs__panel"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const params = new URLSearchParams();
          for (const key of ["from", "to", "mode"]) {
            const value = String(data.get(key) ?? "").trim();
            if (value) params.set(key, value);
          }
          router.push(href(locale, `/quote?${params}`));
        }}
      >
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-from`}>
            {t.quoteFrom}
          </label>
          <input id={`${id}-from`} name="from" className="tfs-input" autoComplete="off" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-to`}>
            {t.quoteTo}
          </label>
          <input id={`${id}-to`} name="to" className="tfs-input" autoComplete="off" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-mode`}>
            {t.quoteMode}
          </label>
          <select id={`${id}-mode`} name="mode" className="tfs-select" defaultValue="sea">
            {(["sea", "air", "road", "unsure"] as const).map((m) => (
              <option key={m} value={m}>
                {modes[m]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="tfs-btn tfs-btn--primary">
          {t.quoteButton}
        </button>
      </form>
    </div>
  );
}
