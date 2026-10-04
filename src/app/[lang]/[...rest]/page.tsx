import { notFound } from "next/navigation";

/** Any unknown path under a language renders that language's styled 404. */
export default function CatchAll() {
  notFound();
}
