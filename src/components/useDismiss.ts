"use client";

import { useEffect, type RefObject } from "react";

/** Close a <details> menu when clicking outside it, pressing Escape, or choosing an item inside it. */
export function useDismiss(ref: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        el.open = false;
        el.querySelector("summary")?.focus();
        return;
      }
      const target = e.target as Node;
      if (!el.contains(target)) el.open = false;
      else if (e.type === "click" && (target as Element).closest?.("a, button[type=submit]")) el.open = false;
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, [ref]);
}
