import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" } };

/** Staff admin inside the app. English only, per the design system. */
export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/app/admin">) {
  const { lang } = await params;
  if (lang !== "en") redirect("/en/app/admin");
  await requireStaff("en", "/en/app/admin");
  return (
    <div className="tfs-admin" lang="en" dir="ltr">
      {children}
    </div>
  );
}
