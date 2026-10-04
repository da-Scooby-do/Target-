import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const form = await request.formData();
  const next = safeNext(String(form.get("next") ?? ""), "/en");
  return NextResponse.redirect(new URL(next, request.nextUrl.origin), { status: 303 });
}
