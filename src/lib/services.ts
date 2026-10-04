/** The five services. Text lives in the dictionaries under services.items[slug]. */
export const serviceSlugs = [
  "shipping-forwarding",
  "logistics-supply-chain",
  "international-trade-sourcing",
  "conference-economic-events",
  "trade-investment-partnerships",
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

export const isServiceSlug = (value: string): value is ServiceSlug =>
  (serviceSlugs as readonly string[]).includes(value);

type ServiceMeta = {
  icon: string;
  /** Photo or illustration under /public. */
  image: string;
  /** True for photos (need alt text), false for abstract illustrations. */
  isPhoto: boolean;
  /** Services priced through the quote form. The other two go to Contact. */
  quotable: boolean;
};

export const serviceMeta: Record<ServiceSlug, ServiceMeta> = {
  "shipping-forwarding": {
    icon: "ship",
    image: "/photos/container-ship.jpg",
    isPhoto: true,
    quotable: true,
  },
  "logistics-supply-chain": {
    icon: "warehouse",
    image: "/photos/warehouse.jpg",
    isPhoto: true,
    quotable: true,
  },
  "international-trade-sourcing": {
    icon: "globe",
    // TODO: stand-in until a photo of this service exists; decorative, so isPhoto stays false.
    image: "/photos/port.jpg",
    isPhoto: false,
    quotable: true,
  },
  "conference-economic-events": {
    icon: "conference",
    image: "/photos/conference-hall.jpg",
    isPhoto: true,
    quotable: false,
  },
  "trade-investment-partnerships": {
    icon: "partnership",
    // TODO: stand-in until a photo of this service exists; decorative, so isPhoto stays false.
    image: "/photos/cargo-aircraft.jpg",
    isPhoto: false,
    quotable: false,
  },
};

export const quotableServices = serviceSlugs.filter((s) => serviceMeta[s].quotable);

/** Where a service takes people when they click it: straight to the place where they can act. */
export const serviceAction: Record<ServiceSlug, { path: string; label: "requestQuote" | "openMarketplace" | "seeEvents" | "contactUs" }> = {
  "shipping-forwarding": { path: "/quote?service=shipping-forwarding", label: "requestQuote" },
  "logistics-supply-chain": { path: "/quote?service=logistics-supply-chain", label: "requestQuote" },
  "international-trade-sourcing": { path: "/marketplace", label: "openMarketplace" },
  "conference-economic-events": { path: "/events", label: "seeEvents" },
  "trade-investment-partnerships": { path: "/contact", label: "contactUs" },
};
