import type { Locale } from "@/lib/i18n";

/**
 * Office and trade lanes shown on the Locations map.
 *
 * TODO (client): confirm the lanes. These follow the markets named in the
 * design system (Europe, the Gulf, Africa) and are placeholders until the
 * client confirms where they actually ship.
 */
export const office = {
  name: "Zoetermeer",
  coords: [4.4944, 52.0607] as [number, number],
  hours: {
    en: "Monday to Friday, 09:00 to 17:30", // TODO: real opening hours
    nl: "Maandag tot en met vrijdag, 09:00 tot 17:30",
    ar: "من الاثنين إلى الجمعة، 09:00 إلى 17:30",
  } satisfies Record<Locale, string>,
};

type Lane = {
  id: string;
  /** Destination city, kept in its usual Latin spelling plus local names. */
  to: Record<Locale, string>;
  region: Record<Locale, string>;
  coords: [number, number];
  modes: ("sea" | "air" | "road")[];
};

export const lanes: Lane[] = [
  {
    id: "jeddah",
    to: { en: "Jeddah", nl: "Jeddah", ar: "جدة" },
    region: { en: "Gulf & Middle East", nl: "Golf & Midden-Oosten", ar: "الخليج والشرق الأوسط" },
    coords: [39.17, 21.54],
    modes: ["sea", "air"],
  },
  {
    id: "dubai",
    to: { en: "Dubai", nl: "Dubai", ar: "دبي" },
    region: { en: "Gulf & Middle East", nl: "Golf & Midden-Oosten", ar: "الخليج والشرق الأوسط" },
    coords: [55.27, 25.2],
    modes: ["sea", "air"],
  },
  {
    id: "casablanca",
    to: { en: "Casablanca", nl: "Casablanca", ar: "الدار البيضاء" },
    region: { en: "North Africa", nl: "Noord-Afrika", ar: "شمال أفريقيا" },
    coords: [-7.59, 33.57],
    modes: ["sea", "road"],
  },
  {
    id: "alexandria",
    to: { en: "Alexandria", nl: "Alexandrië", ar: "الإسكندرية" },
    region: { en: "North Africa", nl: "Noord-Afrika", ar: "شمال أفريقيا" },
    coords: [29.92, 31.2],
    modes: ["sea"],
  },
  {
    id: "mombasa",
    to: { en: "Mombasa", nl: "Mombasa", ar: "مومباسا" },
    region: { en: "East Africa", nl: "Oost-Afrika", ar: "شرق أفريقيا" },
    coords: [39.67, -4.04],
    modes: ["sea"],
  },
  {
    id: "istanbul",
    to: { en: "Istanbul", nl: "Istanbul", ar: "إسطنبول" },
    region: { en: "Europe", nl: "Europa", ar: "أوروبا" },
    coords: [28.98, 41.01],
    modes: ["road", "sea"],
  },
];
