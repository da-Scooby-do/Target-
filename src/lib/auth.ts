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

export type Membership = { companyId: string; companyName: string; role: "owner" | "member" };

/** The company the signed-in user belongs to, and whether they own it. */
export const getMembership = cache(async (): Promise<Membership | null> => {
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_members")
    .select("role, companies(id, name)")
    .eq("user_id", profile.id)
    .maybeSingle();
  const company = data?.companies as unknown as { id: string; name: string } | null;
  if (!data || !company) return null;
  return { companyId: company.id, companyName: company.name, role: data.role as Membership["role"] };
});

/**
 * PostgREST filter for "my company's records" on quotes and shipments. Row security already
 * limits customers to this; staff can read everything, so their own app pages need it too.
 */
export async function ownScope(): Promise<string> {
  const profile = await getProfile();
  const membership = await getMembership();
  if (!profile) return "customer_id.is.null,customer_id.not.is.null";
  return membership ? `customer_id.eq.${profile.id},company_id.eq.${membership.companyId}` : `customer_id.eq.${profile.id}`;
}

/** Send logged-out visitors to the login page and back here afterwards. */
export async function requireProfile(locale: Locale, next: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(next)}`);
  return profile;
}

export async function requireStaff(locale: Locale, next: string): Promise<Profile> {
  const profile = await requireProfile(locale, next);
  if (profile.role !== "staff") redirect(href(locale, "/app"));
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
