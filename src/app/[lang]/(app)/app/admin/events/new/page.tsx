import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "New event" };

export default async function NewEvent() {
  await requireStaff("en", "/en/app/admin/events/new");
  return (
    <div className="page page--narrow">
      <Link href="/en/app/admin/events" className="back-link">
        Events
      </Link>
      <h1 className="page-title">New event</h1>
      <EventForm />
    </div>
  );
}
