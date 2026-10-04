import en from "@/dictionaries/en";
import { isServiceSlug } from "./services";

export const serviceTitle = (slug: string) => (isServiceSlug(slug) ? en.services.items[slug].title : slug);
export const statusLabel = en.app.statuses;
export const modeLabel = en.quote.modes;
