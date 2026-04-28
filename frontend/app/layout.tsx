import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

export const viewport: Viewport = {
  themeColor: "#060818",
};

export const metadata: Metadata = {
  title: "Smart Supply Chain AI | Industrial Command Center",
  description: "Industrial-grade AI supply chain disruption detector and optimizer powered by Gemini 2.0 Flash. Real-time vessel tracking, port monitoring, and autonomous route optimization.",
  keywords: ["supply chain", "AI", "logistics", "maritime", "route optimization", "Gemini", "real-time"],
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Supply Chain AI" },
  openGraph: {
    title: "Smart Supply Chain AI",
    description: "Industrial AI supply chain command center powered by Gemini 2.0 Flash",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col bg-[#060818]">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}


