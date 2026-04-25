"use client";
import { useState } from "react";
import { Users, DollarSign, Leaf, Ship, ChevronDown } from "lucide-react";

const ROLES = [
  { id: "full",    label: "Full View",     icon: Users,      color: "#3b82f6", desc: "All modules visible" },
  { id: "cfo",     label: "CFO View",      icon: DollarSign, color: "#10b981", desc: "Financial & savings focus" },
  { id: "captain", label: "Captain View",  icon: Ship,       color: "#f97316", desc: "Single vessel operations" },
  { id: "esg",     label: "ESG Officer",   icon: Leaf,       color: "#a855f7", desc: "Sustainability & CO₂ only" },
] as const;

type Role = typeof ROLES[number]["id"];

export function RolePicker({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof ROLES[number]>(ROLES[0]);

  const pick = (role: typeof ROLES[number]) => {
    setSelected(role);
    onRoleChange(role.id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all">
        <selected.icon size={13} style={{ color: selected.color }} />
        {selected.label}
        <ChevronDown size={11} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 rounded-xl border border-white/10 overflow-hidden z-50 shadow-2xl"
          style={{ background: "rgba(6,8,24,0.98)", backdropFilter: "blur(20px)" }}>
          {ROLES.map(role => (
            <button key={role.id} onClick={() => pick(role)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${selected.id === role.id ? "bg-white/8" : ""}`}>
              <role.icon size={14} style={{ color: role.color }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">{role.label}</p>
                <p className="text-[10px] text-gray-600">{role.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Role-based filter hook — returns which sections to show
export function useRoleFilter(role: Role, state: any, metrics: any) {
  const ships = state?.ships || [];

  if (role === "cfo") {
    const totalValue = ships.reduce((s: number, v: any) => s + (v.cargo_value_usd || 0), 0);
    const atRiskValue = ships.filter((s: any) => s.status !== "on-time")
      .reduce((s: number, v: any) => s + (v.cargo_value_usd || 0), 0);
    return {
      showGlobe: false,
      showAlerts: false,
      showSavings: true,
      showFleetTable: false,
      showPorts: false,
      showForecast: true,
      summary: `💰 CFO Dashboard: $${(totalValue/1e6).toFixed(0)}M total cargo · $${(atRiskValue/1e6).toFixed(0)}M at risk · ${metrics?.total_alerts_resolved || 0} disruptions resolved`,
      highlightColor: "#10b981",
    };
  }

  if (role === "esg") {
    return {
      showGlobe: true,
      showAlerts: false,
      showSavings: true,
      showFleetTable: false,
      showPorts: false,
      showForecast: false,
      summary: `🌱 ESG Dashboard: ${metrics?.total_co2_saved_tons || 0}t CO₂ prevented · $${((metrics?.total_co2_saved_tons || 0) * 65).toLocaleString()} carbon credit value`,
      highlightColor: "#a855f7",
    };
  }

  if (role === "captain") {
    return {
      showGlobe: true,
      showAlerts: true,
      showSavings: false,
      showFleetTable: true,
      showPorts: false,
      showForecast: true,
      summary: `🚢 Captain Dashboard: ${ships.filter((s: any) => s.status === "at-risk").length} vessels need attention · ${ships.filter((s: any) => s.status === "on-time").length} on schedule`,
      highlightColor: "#f97316",
    };
  }

  // Full view — show everything
  return {
    showGlobe: true, showAlerts: true, showSavings: true,
    showFleetTable: true, showPorts: true, showForecast: true,
    summary: null,
    highlightColor: "#3b82f6",
  };
}

export type { Role };
