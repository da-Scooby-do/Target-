import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The customer portal moved into the app.
      { source: "/:lang(en|nl|ar)/portal/:path*", destination: "/:lang/app/:path*", permanent: true },
      { source: "/:lang(en|nl|ar)/admin/:path*", destination: "/en/app/admin/:path*", permanent: true },
      // Sections folded into the leaner, app-first site.
      { source: "/:lang(en|nl|ar)/industries/:path*", destination: "/:lang/services", permanent: true },
      { source: "/:lang(en|nl|ar)/insights/:path*", destination: "/:lang/help", permanent: true },
      { source: "/:lang(en|nl|ar)/locations", destination: "/:lang/contact", permanent: true },
    ];
  },
};

export default nextConfig;
