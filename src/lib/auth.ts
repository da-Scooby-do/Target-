import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import { supabaseConfigured } from "./supabase/config";
import { href, type Locale } from "./i18n";
import type { Profile } from "./types";

/** The signed-in user's profile, verified from the session token. Null when logged out. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, company, phone, locale, role")
    .eq("id", userId)
    .single();
  return (profile as Profile | null) ?? null;
});

/** Send logged-out visitors to the login page and back here afterwards. */
export async function requireProfile(locale: Locale, next: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(next)}`);
  return profile;
}

export async function requireStaff(next: string): Promise<Profile> {
  const profile = await requireProfile("en", next);
  if (profile.role !== "staff") redirect(href("en", "/portal"));
  return profile;
}

/** Origin of the current request (works on localhost, previews and production). */
export async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/** Only allow redirects to paths on this site. */
export function safeNext(value: string | null | undefined, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
