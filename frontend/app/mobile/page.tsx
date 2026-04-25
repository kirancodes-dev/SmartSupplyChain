"use client";
import { useEffect, useState } from "react";
import { fetchFleet, fetchMetrics } from "@/lib/api";
import Link from "next/link";
import { Globe2, Ship, AlertTriangle, Zap, CheckCircle, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function MobilePage() {
  const [fleet, setFleet] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const load = async () => {
    try {
      const [f, m] = await Promise.all([fetchFleet(), fetchMetrics()]);
      setFleet(f); setMetrics(m);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const ships = fleet?.ships || [];
  const atRisk = ships.filter((s: any) => s.status === "at-risk" || s.status === "delayed");
  const rerouted = ships.filter((s: any) => s.status === "rerouted");
  const onTime = ships.filter((s: any) => s.status === "on-time");

  const STATUS = {
    "on-time":  { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle, label: "On Time" },
    "at-risk":  { color: "text-orange-400",  bg: "bg-orange-500/10",  icon: AlertTriangle, label: "At Risk" },
    "delayed":  { color: "text-red-400",     bg: "bg-red-500/10",     icon: AlertTriangle, label: "Delayed" },
    "rerouted": { color: "text-blue-400",    bg: "bg-blue-500/10",    icon: RefreshCw, label: "Rerouted" },
  };

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: "#060818" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/8 px-4 h-14 flex items-center justify-between"
        style={{ background: "rgba(6,8,24,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <Globe2 size={13} className="text-white"/>
          </div>
          <span className="font-black text-sm text-white">Supply Chain AI</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> Live
        </span>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Ship, label: "Fleet Size", value: ships.length, color: "#3b82f6" },
            { icon: AlertTriangle, label: "At Risk", value: atRisk.length, color: "#f97316" },
            { icon: RefreshCw, label: "Rerouted", value: rerouted.length, color: "#a855f7" },
            { icon: CheckCircle, label: "On Time", value: onTime.length, color: "#10b981" },
          ].map((k, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.color + "20" }}>
                <k.icon size={18} style={{ color: k.color }}/>
              </div>
              <div>
                <p className="text-xl font-black text-white">{k.value}</p>
                <p className="text-[10px] text-gray-500">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* At-risk vessels */}
        {atRisk.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-orange-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertTriangle size={12}/> Needs Attention ({atRisk.length})
            </h2>
            <div className="flex flex-col gap-2">
              {atRisk.map((ship: any, i: number) => {
                const cfg = STATUS[ship.status as keyof typeof STATUS] || STATUS["at-risk"];
                const Icon = cfg.icon;
                return (
                  <motion.div key={ship.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`glass-panel rounded-xl p-4 flex items-center justify-between border ${cfg.bg}`}>
                    <div>
                      <p className="text-sm font-bold text-white">{ship.name}</p>
                      <p className="text-[10px] text-gray-500">{ship.cargo} · Risk: {ship.risk_score}/100</p>
                      <p className="text-[10px] text-gray-600">{ship.origin} → {ship.destination}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}><Icon size={10}/> {cfg.label}</span>
                      <Link href={`/track/${ship.id}`} className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                        Track <ArrowRight size={10}/>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* All ships */}
        <div>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Ship size={12}/> Full Fleet
          </h2>
          <div className="flex flex-col gap-2">
            {ships.filter((s: any) => s.status === "on-time" || s.status === "rerouted").slice(0, 6).map((ship: any, i: number) => {
              const cfg = STATUS[ship.status as keyof typeof STATUS] || STATUS["on-time"];
              const Icon = cfg.icon;
              return (
                <Link key={ship.id} href={`/track/${ship.id}`}>
                  <div className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{ship.name}</p>
                      <p className="text-[10px] text-gray-600">{ship.destination} · ETA {ship.eta}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}><Icon size={10}/> {cfg.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/8 grid grid-cols-4 h-16"
        style={{ background: "rgba(6,8,24,0.98)", backdropFilter: "blur(20px)" }}>
        {[
          { href: "/mobile", label: "Fleet", icon: Ship },
          { href: "/scenarios", label: "Scenarios", icon: Zap },
          { href: "/audit", label: "Audit", icon: CheckCircle },
          { href: "/dashboard", label: "Full App", icon: Globe2 },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-white transition-colors">
            <item.icon size={18}/>
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
