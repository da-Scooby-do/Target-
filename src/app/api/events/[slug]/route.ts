import { NextResponse, type NextRequest } from "next/server";
import { eventColumns, icsFile, type EventRow } from "@/lib/events";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Calendar file for one event, for "Add to calendar". */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/events/[slug]">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(eventColumns).eq("slug", slug).neq("status", "draft").maybeSingle();
  if (!data) return new NextResponse("Not found", { status: 404 });
  const body = icsFile(data as EventRow, `${site.url}/en/events/${slug}`);
  return new NextResponse(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
