"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, AlertTriangle, Zap, Wifi, WifiOff, DollarSign, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

type Pulse = {
  ships: number; at_risk: number; on_time: number; auto_pilot: boolean;
  cargo_value: number; uptime: number; ws_clients: number;
};

export default function LiveStatusBar() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, f] = await Promise.all([apiFetch("/metrics"), apiFetch("/fleet")]);
        const ships = f?.ships || [];
        setPulse({
          ships: ships.length,
          at_risk: ships.filter((s: any) => s.status === "at-risk" || s.status === "delayed").length,
          on_time: ships.filter((s: any) => s.status === "on-time").length,
          auto_pilot: m?.agent_auto_pilot || false,
          cargo_value: ships.reduce((s: number, v: any) => s + (v.cargo_value_usd || 0), 0),
          uptime: m?.uptime_seconds || 0,
          ws_clients: m?.websocket_clients || 0,
        });
        setLastSync(new Date());
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!pulse && !connected) return (
    <div className="h-8 flex items-center justify-center gap-2 text-[10px] text-red-400 border-b border-red-500/20 bg-red-500/5 px-4">
      <WifiOff size={10} /> Backend offline — verify <code className="mx-1 bg-white/5 px-1 rounded">BACKEND_URL</code> environment variable
    </div>
  );

  if (!pulse) return (
    <div className="h-8 border-b border-white/8 animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
  );

  const items = [
    { icon: Ship, label: `${pulse.ships} Vessels`, color: "#3b82f6", href: "/fleet" },
    { icon: AlertTriangle, label: `${pulse.at_risk} At Risk`, color: pulse.at_risk > 0 ? "#ef4444" : "#10b981", href: "/fleet", pulse: pulse.at_risk > 0 },
    { icon: Zap, label: pulse.auto_pilot ? "Auto-Pilot ON" : "Auto-Pilot OFF", color: pulse.auto_pilot ? "#10b981" : "#6b7280", href: "/dashboard" },
    { icon: DollarSign, label: `$${(pulse.cargo_value / 1e6).toFixed(0)}M Protected`, color: "#a855f7", href: "/dashboard" },
    { icon: TrendingUp, label: `${pulse.on_time} On Time`, color: "#10b981", href: "/leaderboard" },
    { icon: Wifi, label: `${pulse.ws_clients} Live Clients`, color: "#3b82f6", href: "/status" },
  ];

  return (
    <div className="h-8 border-b border-white/8 flex items-center overflow-hidden shrink-0"
      style={{ background: "rgba(6,8,24,0.6)", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-0 overflow-x-auto no-scrollbar max-w-[1800px] mx-auto w-full px-4">
        {/* Connected indicator */}
        <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold shrink-0 mr-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
        </span>

        {items.map((item, i) => (
          <Link key={i} href={item.href}
            className="flex items-center gap-1.5 px-3 h-full border-r border-white/6 hover:bg-white/5 transition-colors shrink-0 group">
            <item.icon size={9} style={{ color: item.color }} className={item.pulse ? "animate-pulse" : ""} />
            <span className="text-[10px] font-semibold group-hover:text-white transition-colors" style={{ color: item.color + "cc" }}>
              {item.label}
            </span>
          </Link>
        ))}

        {/* Last sync */}
        <span className="ml-auto pl-4 flex items-center gap-1 text-[9px] text-gray-700 shrink-0">
          <Clock size={9} />
          {lastSync ? `Synced ${lastSync.toLocaleTimeString()}` : "Syncing..."}
        </span>
      </div>
    </div>
  );
}
