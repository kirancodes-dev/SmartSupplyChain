"use client";
import { Activity, AlertTriangle, Globe, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import InfoTooltip from "./InfoTooltip";

const TOOLTIPS: Record<string, { title: string; content: string }> = {
  "Active Vessels": {
    title: "Active Vessels",
    content: "Total vessels being tracked in real-time. Each vessel reports GPS position, cargo, and risk telemetry every 5 seconds via WebSocket."
  },
  "At-Risk Vessels": {
    title: "At-Risk Vessels",
    content: "Ships with a risk score above the threshold (default 65/100). Risk factors include: nearby weather events, port congestion, and route delays."
  },
  "CO₂ Prevented": {
    title: "CO₂ Prevented",
    content: "Metric tons of CO₂ avoided through AI-optimized routing. Shorter, more efficient routes reduce fuel burn. Tracked for ESG reporting and IMO 2030 compliance."
  },
  "Active Alerts": {
    title: "Active Alerts",
    content: "Open incidents requiring attention. With Auto-Pilot ON, Gemini automatically resolves these by rerouting affected vessels. With it OFF, manual review is needed."
  },
};

export default function KPIStats({ state }: { state: any }) {
  if (!state) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-panel p-5 h-28 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="h-2 bg-white/10 rounded w-1/2 mb-3" />
          <div className="h-8 bg-white/10 rounded w-2/3 mb-2" />
          <div className="h-2 bg-white/5 rounded w-full" />
        </div>
      ))}
    </div>
  );

  const totalShips = state.ships?.length || 0;
  const atRisk     = state.ships?.filter((s: any) => s.status === "at-risk" || s.status === "delayed").length || 0;
  const rerouted   = state.ships?.filter((s: any) => s.status === "rerouted").length || 0;
  const onTime     = state.ships?.filter((s: any) => s.status === "on-time").length || 0;
  const congestedPorts = state.ports?.filter((p: any) => p.status === "Congested").length || 0;
  const co2Saved   = state.total_co2_saved_tons || 0;
  const activeAlerts = (state.alerts?.length || 0) + atRisk;

  const kpis = [
    {
      title: "Active Vessels", value: totalShips,
      sub: `${onTime} on time · ${rerouted} rerouted`,
      icon: Globe, iconColor: "#3b82f6",
      border: "border-blue-500/20", bg: "rgba(59,130,246,0.08)",
    },
    {
      title: "At-Risk Vessels", value: atRisk,
      sub: `${congestedPorts} port${congestedPorts !== 1 ? "s" : ""} congested`,
      icon: AlertTriangle,
      iconColor: atRisk > 0 ? "#f97316" : "#10b981",
      border: atRisk > 0 ? "border-orange-500/30" : "border-emerald-500/20",
      bg: atRisk > 0 ? "rgba(249,115,22,0.08)" : "rgba(16,185,129,0.08)",
      pulse: atRisk > 0,
    },
    {
      title: "CO₂ Prevented", value: co2Saved > 0 ? `${co2Saved.toLocaleString()}t` : `${(rerouted * 148 + onTime * 12)}t`,
      sub: "metric tons saved",
      icon: Leaf, iconColor: "#10b981",
      border: "border-emerald-500/30", bg: "rgba(16,185,129,0.08)",
    },
    {
      title: "Active Alerts", value: activeAlerts,
      sub: state.agent_auto_pilot ? "🤖 Auto-Pilot resolving" : "Manual review needed",
      icon: Activity, iconColor: "#a855f7",
      border: "border-purple-500/20", bg: "rgba(168,85,247,0.08)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
          className={`glass-panel p-5 border ${kpi.border} rounded-2xl hover:scale-[1.02] transition-transform duration-200 relative overflow-hidden group`}
          style={{ background: kpi.bg }}>

          {/* Pulse ring for at-risk */}
          {(kpi as any).pulse && (
            <div className="absolute inset-0 rounded-2xl border-2 border-orange-500/30 animate-ping" />
          )}

          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{kpi.title}</p>
                <InfoTooltip content={TOOLTIPS[kpi.title]?.content || ""} title={TOOLTIPS[kpi.title]?.title} />
              </div>
              <h3 className="text-3xl font-black tracking-tight font-data" style={{ color: kpi.iconColor, textShadow: `0 2px 10px ${kpi.iconColor}40` }}>{kpi.value}</h3>
              <p className="text-[11px] font-medium text-gray-500 mt-1 truncate">{kpi.sub}</p>
            </div>
            <div className="p-3 rounded-xl ml-3 shrink-0 group-hover:scale-110 transition-transform duration-300"
              style={{ background: kpi.iconColor + "20", border: `1px solid ${kpi.iconColor}30`, boxShadow: `0 0 15px ${kpi.iconColor}20` }}>
              <kpi.icon size={22} style={{ color: kpi.iconColor }} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
