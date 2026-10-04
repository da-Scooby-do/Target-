"use server";

import { z } from "zod";
import { requestOrigin, safeNext } from "@/lib/auth";
import { hasLocale } from "@/lib/i18n";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email().max(320), locale: z.string(), next: z.string().max(500) });

export async function sendLoginLink(input: z.input<typeof schema>): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success || !supabaseConfigured) return { ok: false };
  const { email, locale, next } = parsed.data;
  const lang = hasLocale(locale) ? locale : "en";

  const supabase = await createClient();
  const callback = new URL("/auth/callback", await requestOrigin());
  callback.searchParams.set("next", safeNext(next, `/${lang}/portal`));

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true, data: { locale: lang } },
  });
  if (error) console.error("[login] signInWithOtp failed", error.message);
  return { ok: !error };
}
