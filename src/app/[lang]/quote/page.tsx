import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/QuoteForm";
import { Hero, Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { getProfile } from "@/lib/auth";
import { quotableServices } from "@/lib/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/quote">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/quote", dict.quote.metaTitle, dict.quote.lead);
}

export default async function QuotePage({ params, searchParams }: PageProps<"/[lang]/quote">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.quote;

  const query = await searchParams;
  const requested = query.service;
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : undefined);
  const mode = ["sea", "air", "road", "unsure"].includes(str(query.mode) ?? "") ? (query.mode as "sea" | "air" | "road" | "unsure") : undefined;
  const profile = await getProfile();
  const initialService =
    typeof requested === "string" && (quotableServices as string[]).includes(requested) ? requested : undefined;

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/hero-containers.svg"
        imageAlt=""
        isPhoto={false}
        mirrorRtl
      />
      <Section tight>
        <div className="quote-layout">
          <QuoteForm
            locale={lang}
            t={t}
            initialService={initialService}
            initial={{
              from: str(query.from),
              to: str(query.to),
              mode,
              name: profile?.full_name ?? undefined,
              email: profile?.email,
              company: profile?.company ?? undefined,
              phone: profile?.phone ?? undefined,
            }}
            services={quotableServices.map((slug) => ({ slug, title: dict.services.items[slug].title }))}
          />
          <aside className="tfs-card quote-aside" aria-labelledby="next-heading">
            <h2 id="next-heading" className="tfs-h3">
              {t.sidebar.heading}
            </h2>
            <ol className="numbered">
              {t.sidebar.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="tfs-small">{t.sidebar.otherServices}</p>
            <Link href={href(lang, "/contact")} className="text-link">
              {dict.common.contactUs}
            </Link>
          </aside>
        </div>
      </Section>
    </>
  );
}
