"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, BarChart3, Ship, Sparkles, Activity } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: Activity },
  { href: "/fleet",     label: "Fleet",      icon: Ship },
  { href: "/analytics", label: "Analytics",  icon: BarChart3 },
];

export default function NavBar({ metrics }: { metrics?: any }) {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8" style={{ background: "rgba(6,8,24,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Globe2 size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black gradient-text tracking-tight">Smart Supply Chain AI</span>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status badges */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {metrics?.at_risk_count > 0 && (
            <div className="badge badge-orange text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              {metrics.at_risk_count} at risk
            </div>
          )}
          <div className="badge badge-blue text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live
          </div>
          <div className="badge badge-purple text-[10px]">
            <Sparkles size={9} /> Gemini 2.0
          </div>
          {metrics?.agent_auto_pilot && (
            <div className="badge badge-emerald text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Pilot ON
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
