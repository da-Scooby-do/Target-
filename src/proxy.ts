import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/proxy";

/** Pick the visitor's language from Accept-Language, falling back to English. */
function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) {
    if ((locales as readonly string[]).includes(lang)) return lang as Locale;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (!hasLocale(first)) {
    request.nextUrl.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }
  // Keep the login session fresh for Server Components.
  return updateSession(request);
}

export const config = {
  // Skip Next internals, API and auth routes, and any file with an extension (images, icons, robots.txt...).
  matcher: ["/((?!_next|api|auth|.*\\..*).*)"],
};
