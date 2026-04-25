import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Supply Chain AI | Industrial Command Center",
  description: "Industrial-grade AI supply chain disruption detector and optimizer. Real-time vessel tracking, port monitoring, and Gemini AI-powered route optimization.",
  keywords: ["supply chain", "AI", "logistics", "maritime", "route optimization", "Gemini", "real-time"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#060818]">{children}</body>
    </html>
  );
}
