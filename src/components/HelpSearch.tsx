"use client";

import { useId, useMemo, useState } from "react";
import { Icon } from "./Icon";
import type { FaqTopic } from "@/content/help";

type Props = {
  faqs: { topic: FaqTopic; q: string; a: string }[];
  topics: Record<FaqTopic, string>;
  t: { searchLabel: string; searchPlaceholder: string; all: string; noResults: string };
};

/** Searchable, filterable FAQ. Each answer is a native disclosure, so it works with keyboard and screen readers. */
export function HelpSearch({ faqs, topics, t }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<FaqTopic | "all">("all");

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return faqs.filter(
      (f) =>
        (topic === "all" || f.topic === topic) &&
        words.every((w) => `${f.q} ${f.a}`.toLowerCase().includes(w)),
    );
  }, [faqs, query, topic]);

  return (
    <div className="help">
      <div className="help__search">
        <label className="visually-hidden" htmlFor={`${id}-q`}>
          {t.searchLabel}
        </label>
        <Icon name="search" />
        <input
          id={`${id}-q`}
          type="search"
          className="tfs-input"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="chip-row" role="group" aria-label={t.searchLabel}>
        {(["all", ...Object.keys(topics)] as (FaqTopic | "all")[]).map((key) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={topic === key}
            onClick={() => setTopic(key)}
          >
            {key === "all" ? t.all : topics[key]}
          </button>
        ))}
      </div>
      <p className="visually-hidden" role="status">
        {results.length}
      </p>
      {results.length === 0 ? (
        <p className="help__empty">{t.noResults}</p>
      ) : (
        <div className="faq-list">
          {results.map((f) => (
            <details key={f.q} className="faq">
              <summary>
                <span>{f.q}</span>
                <Icon name="chevron-down" size={20} className="faq__chevron" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
