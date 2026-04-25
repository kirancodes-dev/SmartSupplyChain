"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard", fleet: "Fleet", analytics: "Analytics",
  scenarios: "Scenarios", ports: "Ports", audit: "Audit Trail",
  report: "Report", settings: "Settings", calculator: "Calculator",
  leaderboard: "Leaderboard", esg: "ESG", briefing: "AI Briefing",
  status: "Status", mobile: "Mobile", architecture: "Architecture",
  track: "Track Vessel",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname || pathname === "/" || pathname === "/home") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-gray-600 px-4 md:px-8 py-2 max-w-[1800px] mx-auto w-full">
      <Link href="/home" className="flex items-center gap-1 hover:text-gray-400 transition-colors">
        <Home size={11} /> Home
      </Link>
      {segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
        const isLast = i === segments.length - 1;
        return (
          <span key={seg} className="flex items-center gap-1.5">
            <ChevronRight size={10} className="text-gray-800" />
            {isLast
              ? <span className="text-gray-400 font-semibold">{label}</span>
              : <Link href={href} className="hover:text-gray-400 transition-colors">{label}</Link>
            }
          </span>
        );
      })}
    </nav>
  );
}
