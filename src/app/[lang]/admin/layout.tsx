import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalNav } from "@/components/PortalNav";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

/** Staff admin. English only, per the design system. */
export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (lang !== "en") redirect("/en/admin");
  const profile = await requireStaff("/en/admin");

  return (
    <div className="container portal admin" lang="en" dir="ltr">
      <aside className="portal__side">
        <div className="portal__who">
          <p className="tfs-eyebrow">Admin</p>
          <p className="portal__name">{profile.full_name || profile.email}</p>
        </div>
        <PortalNav
          label="Admin"
          items={[
            { href: "/en/admin", label: "Overview", icon: "menu", exact: true },
            { href: "/en/admin/quotes", label: "Quotes", icon: "file-text" },
            { href: "/en/admin/shipments", label: "Shipments", icon: "truck" },
          ]}
        />
        <Link href="/en/portal" className="text-link">
          My TFS
        </Link>
        <form action="/auth/signout" method="post">
          <input type="hidden" name="next" value="/en" />
          <button type="submit" className="link-button">
            Log out
          </button>
        </form>
      </aside>
      <div className="portal__main light-scope tfs-admin">{children}</div>
    </div>
  );
}
