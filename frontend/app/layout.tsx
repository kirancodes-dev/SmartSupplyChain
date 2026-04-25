import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Supply Chain AI | Disruption Detector & Optimizer",
  description:
    "AI-powered supply chain optimizer. Preemptively detect transit disruptions and get dynamic Gemini AI-driven rerouting recommendations in real time.",
  keywords: ["supply chain", "AI", "logistics", "route optimization", "Gemini", "disruption detection"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
