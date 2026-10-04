/**
 * Supabase project URL and publishable key. Both are public by design (they
 * ship to the browser); row level security in the database protects the data.
 * The defaults point at the production project; override them with
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (e.g. for a test project).
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vhljqheunxdnfwzstmwd.supabase.co";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_c7ozfLgm2XaOIWy4-sufXw_VQCJJvSd";
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
