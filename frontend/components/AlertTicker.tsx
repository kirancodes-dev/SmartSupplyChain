"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Leaf, Clock } from "lucide-react";

type TickerItem = {
  id: string;
  icon: "risk" | "reroute" | "co2" | "delay" | "clear";
  text: string;
  ts: string;
};

const ICONS = {
  risk:    <AlertTriangle size={11} className="text-orange-400 shrink-0" />,
  reroute: <RefreshCw size={11} className="text-blue-400 shrink-0" />,
  co2:     <Leaf size={11} className="text-emerald-400 shrink-0" />,
  delay:   <Clock size={11} className="text-red-400 shrink-0" />,
  clear:   <CheckCircle size={11} className="text-emerald-400 shrink-0" />,
};

const COLORS = {
  risk:    "text-orange-300",
  reroute: "text-blue-300",
  co2:     "text-emerald-300",
  delay:   "text-red-300",
  clear:   "text-emerald-300",
};

function buildTicker(state: any): TickerItem[] {
  if (!state) return [];
  const items: TickerItem[] = [];
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  state.ships?.forEach((s: any) => {
    if (s.status === "at-risk")
      items.push({ id: `r-${s.id}`, icon: "risk", text: `${s.name} — Risk score ${s.risk_score || "?"}/100 · ${s.cargo}`, ts: now });
    if (s.status === "rerouted")
      items.push({ id: `rt-${s.id}`, icon: "reroute", text: `${s.name} rerouted → ${s.destination} · ${s.speed_knots}kn`, ts: now });
    if (s.status === "delayed")
      items.push({ id: `d-${s.id}`, icon: "delay", text: `${s.name} delayed ${s.delay_hours}h · ${s.cargo} $${((s.cargo_value_usd||0)/1e6).toFixed(1)}M at risk`, ts: now });
  });

  state.ports?.forEach((p: any) => {
    if (p.status === "Congested")
      items.push({ id: `p-${p.id}`, icon: "risk", text: `${p.full_name || p.name} congested — ${Math.round((p.current_load/p.capacity)*100)}% capacity`, ts: now });
  });

  if (state.total_co2_saved_tons > 0)
    items.push({ id: "co2", icon: "co2", text: `CO₂ Prevented Today: ${state.total_co2_saved_tons.toLocaleString()} metric tons saved`, ts: now });

  if (items.length === 0)
    items.push({ id: "all-clear", icon: "clear", text: "All vessels operating normally · No active disruptions detected", ts: now });

  return items;
}

export default function AlertTicker({ state }: { state: any }) {
  const items = buildTicker(state);
  const trackRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  // Duplicate items for seamless loop
  const doubled = [...items, ...items, ...items];
  const durationSec = Math.max(20, doubled.length * 4);

  return (
    <div
      className="w-full overflow-hidden border-y border-white/8 bg-black/40 backdrop-blur-sm"
      style={{ height: 32 }}
    >
      <div
        ref={trackRef}
        className="flex items-center gap-0 h-full"
        style={{
          width: "max-content",
          animation: `ticker-scroll ${durationSec}s linear infinite`,
        }}
      >
        {doubled.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex items-center gap-1.5 px-6 h-full border-r border-white/8 shrink-0">
            {ICONS[item.icon]}
            <span className={`text-[11px] font-medium ${COLORS[item.icon]} whitespace-nowrap`}>{item.text}</span>
            <span className="text-[10px] text-gray-700 ml-2">{item.ts}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
