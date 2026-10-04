"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { Icon } from "./Icon";
import type { Dictionary } from "@/dictionaries/en";
import { href, type Locale } from "@/lib/i18n";

/** One-line "track by reference" form; sends you to the public tracking page. */
export function TrackBox({ locale, label, t }: { locale: Locale; label: string; t: Dictionary["app"]["hero"] }) {
  const router = useRouter();
  const id = useId();
  return (
    <form
      className="track-box"
      role="search"
      aria-label={label}
      onSubmit={(e) => {
        e.preventDefault();
        const ref = String(new FormData(e.currentTarget).get("ref") ?? "").trim();
        router.push(href(locale, `/track${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`));
      }}
    >
      <label className="track-box__label" htmlFor={id}>
        {label}
      </label>
      <div className="track-box__row">
        <Icon name="search" size={18} />
        <input
          id={id}
          name="ref"
          className="track-box__input"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.trackPlaceholder}
        />
        <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--sm">
          {t.trackButton}
        </button>
      </div>
    </form>
  );
}
