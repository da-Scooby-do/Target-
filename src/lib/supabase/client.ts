import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./config";

/** Supabase client for Client Components. */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
