import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/Icon";
import { Hero, Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { mapsHref, phoneHref, site, whatsappHref } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/contact", dict.contact.metaTitle, dict.contact.lead);
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.contact;

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/bg-waves.svg"
        imageAlt=""
        isPhoto={false}
      />

      <Section tight>
        <div className="contact-layout">
          <div className="tfs-card tfs-card--light contact-form-card">
            <h2 className="tfs-h3">{t.form.heading}</h2>
            <ContactForm locale={lang} t={t.form} errorsT={dict.quote.errors} privacyLink={dict.quote.fields.privacyLink} />
          </div>

          <div className="contact-side">
            <section className="tfs-card" aria-labelledby="details-heading">
              <h2 id="details-heading" className="tfs-h3">
                {t.details.heading}
              </h2>
              <ul className="contact-list">
                <li>
                  <Icon name="map-pin" />
                  <div>
                    <span className="contact-list__label">{t.details.address}</span>
                    <address>
                      {site.legalName}
                      <br />
                      {site.address.street}
                      <br />
                      <span dir="ltr">{site.address.postcode}</span> {site.address.city}
                      <br />
                      {site.address.country}
                    </address>
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-link">
                      {t.details.map}
                    </a>
                  </div>
                </li>
                <li>
                  <Icon name="mail" />
                  <div>
                    <span className="contact-list__label">{t.details.email}</span>
                    <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
                  </div>
                </li>
                <li>
                  <Icon name="phone" />
                  <div>
                    <span className="contact-list__label">{t.details.phone}</span>
                    <a href={phoneHref} dir="ltr">{site.phone}</a>
                  </div>
                </li>
                <li>
                  <Icon name="message" />
                  <div>
                    <span className="contact-list__label">{t.details.whatsapp}</span>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      {t.details.whatsappLabel}
                    </a>
                  </div>
                </li>
              </ul>
            </section>

            <section className="tfs-card" aria-labelledby="quote-hint">
              <h2 id="quote-hint" className="tfs-h3">
                {t.quoteHint.heading}
              </h2>
              <p>{t.quoteHint.text}</p>
              <div>
                <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/quote")}>
                  {dict.common.requestQuote}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </Section>
    </>
  );
}
