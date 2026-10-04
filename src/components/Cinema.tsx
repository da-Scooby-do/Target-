"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Elements that fade and rise into view as you scroll. */
const REVEAL = [
  ".cine main h2",
  ".cine main .tfs-eyebrow",
  ".cine main .block__lead",
  ".cine main .tile",
  ".cine main .feature",
  ".cine main .step",
  ".cine main .market-cat",
  ".cine main .product-card",
  ".cine main .tfs-service",
  ".cine main .tfs-photo",
  ".cine main .tfs-card",
  ".cine main .split__media",
  ".cine main .faq-item",
  ".cine main .event-card",
  ".cine main .event-facts li",
  ".cine main .cine-reveal",
].join(",");

/**
 * Motion for the public site: header turns to glass after scrolling, sections reveal on scroll,
 * and [data-tilt] elements lean toward the pointer. Everything is skipped for reduced motion,
 * and nothing is hidden unless this script runs.
 */
export function Cinema() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => {
      const scrolled = window.scrollY > 24;
      if ((root.dataset.scrolled === "1") !== scrolled) root.dataset.scrolled = scrolled ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter((el) => !el.classList.contains("rv-in"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            observer.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const el of els) {
      // Stagger siblings in the same grid a little.
      const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--rv-delay", `${Math.min(index, 6) * 70}ms`);
      el.classList.add("rv");
      // Already on screen: show without waiting.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) requestAnimationFrame(() => el.classList.add("rv-in"));
      else observer.observe(el);
    }
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const cleanups = els.map((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${x * 10}deg`);
        el.style.setProperty("--rx", `${-y * 8}deg`);
        el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
        el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      };
      const leave = () => {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    });
    return () => cleanups.forEach((c) => c());
  }, [pathname]);

  return null;
}
