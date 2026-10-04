/**
 * Company details shown in the header, footer, contact page and emails.
 *
 * PLACEHOLDERS: every value marked TODO must be replaced with the client's
 * real details before launch. Dutch law requires the KvK number on the site.
 */
export const site = {
  name: "Target Facility Service",
  legalName: "Target Facility Service V.O.F",
  tagline: "Connecting Markets... Building Success",
  address: {
    street: "Voorbeeldstraat 1", // TODO: real street address
    postcode: "2700 AA", // TODO: real postcode
    city: "Zoetermeer",
    country: "Netherlands",
  },
  email: "info@example.com", // TODO: real public email
  phone: "+31 79 000 0000", // TODO: real phone number
  whatsapp: "31790000000", // TODO: WhatsApp number, digits only with country code
  kvk: "00000000", // TODO: real KvK number
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const phoneHref = `tel:${site.phone.replace(/\s/g, "")}`;
export const whatsappHref = `https://wa.me/${site.whatsapp}`;
export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.street}, ${site.address.postcode} ${site.address.city}`,
)}`;
