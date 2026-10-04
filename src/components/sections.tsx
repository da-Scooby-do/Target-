import Link from "next/link";
import type { ReactNode } from "react";
import { BackgroundImage } from "./BackgroundImage";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`.trim()}>{children}</div>;
}

/** A page section: spacing comes from the section, never from rules or bands. */
export function Section({
  children,
  id,
  labelledBy,
  tight = false,
}: {
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  tight?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`section${tight ? " section--tight" : ""}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  heading,
  text,
}: {
  id?: string;
  eyebrow: string;
  heading: string;
  text?: string;
}) {
  return (
    <header className="tfs-sechead section__head">
      <p className="tfs-eyebrow">{eyebrow}</p>
      <h2 id={id} className="tfs-h2">
        {heading}
      </h2>
      {text ? <p>{text}</p> : null}
    </header>
  );
}

type HeroProps = {
  eyebrow: string;
  heading: string;
  lead: string;
  image: string;
  imageAlt: string;
  isPhoto?: boolean;
  /** Home uses the larger display style. */
  display?: boolean;
  overlay?: number;
  mirrorRtl?: boolean;
  actions?: ReactNode;
};

export function Hero({
  eyebrow,
  heading,
  lead,
  image,
  imageAlt,
  isPhoto = true,
  display = false,
  overlay = 0.6,
  mirrorRtl = false,
  actions,
}: HeroProps) {
  return (
    <div className="container hero-wrap">
      <section
        className={`tfs-hero${isPhoto ? " tfs-hero--photo" : " tfs-hero--graphic"}`}
        style={{ ["--tfs-overlay" as string]: overlay }}
      >
        <BackgroundImage src={image} alt={imageAlt} priority mirrorRtl={mirrorRtl} />
        <p className="tfs-eyebrow">{eyebrow}</p>
        <h1 className={display ? "tfs-display" : "tfs-h1"}>{heading}</h1>
        <p className="tfs-lead">{lead}</p>
        {actions ? <div className="tfs-row">{actions}</div> : null}
      </section>
    </div>
  );
}

export function PhotoCard({
  image,
  alt,
  eyebrow,
  heading,
  text,
  span,
  graphic = false,
}: {
  image: string;
  alt: string;
  eyebrow?: string;
  heading: string;
  text?: string;
  span?: 5 | 6 | 7 | 12;
  graphic?: boolean;
}) {
  return (
    <article
      className={`tfs-photo${graphic ? " tfs-photo--graphic" : ""}${span ? ` tfs-span-${span}` : ""}`}
    >
      <BackgroundImage src={image} alt={alt} sizes="(min-width: 768px) 60vw, 100vw" />
      {eyebrow ? <p className="tfs-eyebrow">{eyebrow}</p> : null}
      <h3 className="tfs-h3">{heading}</h3>
      {text ? <p>{text}</p> : null}
    </article>
  );
}

export function CtaBand({
  eyebrow,
  heading,
  text,
  image,
  imageAlt,
  primary,
  secondary,
}: {
  eyebrow?: string;
  heading: string;
  text: string;
  image: string;
  imageAlt: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <Section>
      <section className="tfs-card tfs-cta tfs-cta--photo">
        <BackgroundImage src={image} alt={imageAlt} />
        {eyebrow ? <p className="tfs-eyebrow">{eyebrow}</p> : null}
        <h2 className="tfs-h2">{heading}</h2>
        <p className="tfs-lead">{text}</p>
        <div className="tfs-row cta-actions">
          <Link className="tfs-btn tfs-btn--primary" href={primary.href}>
            {primary.label}
          </Link>
          {secondary ? (
            <Link className="tfs-btn tfs-btn--secondary" href={secondary.href}>
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </section>
    </Section>
  );
}
