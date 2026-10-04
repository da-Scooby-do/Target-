"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

export type Account = { name: string; email: string; avatar: string | null; isStaff: boolean };

/**
 * The signed-in visitor, read in the browser so public pages can stay static.
 * null while unknown, false when signed out.
 */
export function useAccount() {
  const [account, setAccount] = useState<Account | false | null>(supabaseConfigured ? null : false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createClient();
    let alive = true;
    const load = async (userId: string | undefined, meta: Record<string, unknown>, email: string) => {
      if (!userId) return alive && setAccount(false);
      const { data } = await supabase.from("profiles").select("full_name, role").eq("id", userId).maybeSingle();
      const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : null;
      if (alive)
        setAccount({
          name: data?.full_name || (typeof meta.full_name === "string" ? meta.full_name : "") || email.split("@")[0],
          email,
          avatar,
          isStaff: data?.role === "staff",
        });
    };
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      load(u?.id, u?.user_metadata ?? {}, u?.email ?? "");
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setAccount(false);
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        const u = session?.user;
        // Run outside the auth callback: Supabase calls inside it can deadlock.
        setTimeout(() => load(u?.id, u?.user_metadata ?? {}, u?.email ?? ""), 0);
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return account;
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
