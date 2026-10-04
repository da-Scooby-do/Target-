"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Full-bleed photos that slowly zoom and cross-fade, like a film title sequence. */
export function HeroSlides({ images, interval = 7000 }: { images: string[]; interval?: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setActive((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="hero-slides" aria-hidden="true">
      {images.map((src, i) => (
        <div key={src} className="hero-slides__slide" data-active={i === active || undefined}>
          <Image src={src} alt="" fill priority={i === 0} sizes="100vw" />
        </div>
      ))}
    </div>
  );
}
