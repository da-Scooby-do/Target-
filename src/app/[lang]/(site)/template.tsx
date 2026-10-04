/** Re-mounts on every navigation, so each page fades in like a new scene. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
