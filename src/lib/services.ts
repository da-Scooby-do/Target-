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
    image: "/illustrations/hero-routes.svg",
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
    image: "/illustrations/bg-arcs.svg",
    isPhoto: false,
    quotable: false,
  },
};

export const quotableServices = serviceSlugs.filter((s) => serviceMeta[s].quotable);
