"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * Whether the visitor has a login session, read in the browser so public
 * pages can stay static. null while unknown.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(supabaseConfigured ? null : false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return signedIn;
}
