import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Keep preview deployments out of search results; only production is indexed.
  const indexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: indexable
      ? { userAgent: "*", allow: "/", disallow: ["/*/app", "/*/login", "/*/signup", "/*/forgot-password", "/*/reset-password", "/auth/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
