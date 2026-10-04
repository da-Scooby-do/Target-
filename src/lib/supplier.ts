import "server-only";
import { cache } from "react";
import type { SupplierStatus } from "./market";
import { createClient } from "./supabase/server";

export type Supplier = {
  id: string;
  name: string;
  country: string | null;
  description: string | null;
  website: string | null;
  status: SupplierStatus;
};

/** The signed-in user's supplier account (through their company), if any. */
export const getMySupplier = cache(async (): Promise<Supplier | null> => {
  const supabase = await createClient();
  const { data: id } = await supabase.rpc("my_supplier_id");
  if (!id) return null;
  const { data } = await supabase.from("suppliers").select("id, name, country, description, website, status").eq("id", id).maybeSingle();
  return (data as Supplier | null) ?? null;
});
