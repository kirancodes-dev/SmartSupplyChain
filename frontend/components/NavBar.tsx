"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, BarChart3, Ship, Sparkles, Activity, ShieldCheck, Home, Settings, FileText, Anchor, Zap, ChevronDown, Map, Calculator, Trophy, Leaf, Bot, Radio } from "lucide-react";
import PushNotifications from "./PushNotifications";
import GlobalSearch from "./GlobalSearch";
import KeyboardShortcuts from "./KeyboardShortcuts";
import GuidedTour from "./GuidedTour";
import { useState } from "react";

const NAV_PRIMARY = [
  { href: "/home",      label: "Home",      icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/fleet",     label: "Fleet",     icon: Ship },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const NAV_MORE = [
  { href: "/scenarios",    label: "Scenarios",    icon: Zap },
  { href: "/ports",        label: "Ports",        icon: Anchor },
  { href: "/calculator",   label: "Calculator",   icon: Calculator },
  { href: "/leaderboard",  label: "Leaderboard",  icon: Trophy },
  { href: "/esg",          label: "ESG",          icon: Leaf },
  { href: "/briefing",     label: "AI Briefing",  icon: Bot },
  { href: "/architecture", label: "Architecture", icon: Globe2 },
  { href: "/audit",        label: "Audit",        icon: ShieldCheck },
  { href: "/report",       label: "Report",       icon: FileText },
  { href: "/status",       label: "Status",       icon: Radio },
  { href: "/settings",     label: "Settings",     icon: Settings },
];

export default function NavBar({ metrics, extraRight }: { metrics?: any; extraRight?: React.ReactNode }) {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/8" style={{ background: "rgba(6,8,24,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Globe2 size={16} className="text-white" />
          </div>
          <span className="hidden sm:block text-sm font-black gradient-text tracking-tight">Smart Supply Chain AI</span>
        </div>

        {/* Nav Tabs */}
        <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  active ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}>
                <Icon size={14} /><span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="relative">
            <button onClick={() => setMoreOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                NAV_MORE.some(n => n.href === path) ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}>
              More <ChevronDown size={12} className={moreOpen ? "rotate-180 transition-transform" : "transition-transform"}/>
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-white/10 overflow-hidden z-50 shadow-xl"
                style={{ background: "rgba(6,8,24,0.98)", backdropFilter: "blur(20px)" }}>
                {NAV_MORE.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all ${
                      path === href ? "bg-blue-500/20 text-blue-300" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}>
                    <Icon size={13}/> {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right status + push bell */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {metrics?.at_risk_count > 0 && (
            <div className="badge badge-orange text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />{metrics.at_risk_count} at risk
            </div>
          )}
          <div className="badge badge-blue text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Live</div>
          <div className="badge badge-purple text-[10px]"><Sparkles size={9} /> Gemini 2.0</div>
          {metrics?.agent_auto_pilot && (
            <div className="badge badge-emerald text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-Pilot ON</div>
          )}
          <GlobalSearch />
          <KeyboardShortcuts />
          <button onClick={() => setTourOpen(true)}
            title="Start guided tour"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            🧭 Tour
          </button>
          <PushNotifications alertCount={metrics?.at_risk_count} />
          {extraRight}
        </div>
      </div>
    </header>
    {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} />}
    </>
  );
}
