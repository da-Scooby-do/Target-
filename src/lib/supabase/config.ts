/**
 * Supabase project URL and publishable key. Both are public by design (they
 * ship to the browser); row level security in the database protects the data.
 * Set them in Vercel as NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
