"use client";
import { Activity, AlertTriangle, CheckCircle, Package, Leaf, TrendingUp, Clock, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function KPIStats({ state }: { state: any }) {
  if (!state) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-panel p-5 h-28 shimmer rounded-2xl" />
      ))}
    </div>
  );

  const totalShips = state.ships?.length || 0;
  const atRisk = state.ships?.filter((s: any) => s.status === 'at-risk').length || 0;
  const rerouted = state.ships?.filter((s: any) => s.status === 'rerouted').length || 0;
  const onTime = state.ships?.filter((s: any) => s.status === 'on-time').length || 0;
  const congestedPorts = state.ports?.filter((p: any) => p.status === 'Congested').length || 0;
  const co2Saved = state.total_co2_saved_tons || 0;
  const activeAlerts = state.alerts?.length || 0;

  const kpis = [
    {
      title: "Active Vessels",
      value: totalShips,
      sub: `${onTime} on time · ${rerouted} rerouted`,
      icon: Globe,
      color: "blue",
      borderColor: "border-blue-500/20",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      glowColor: "shadow-blue-500/20",
    },
    {
      title: "At-Risk Vessels",
      value: atRisk,
      sub: `${congestedPorts} congested ports`,
      icon: AlertTriangle,
      color: "orange",
      borderColor: atRisk > 0 ? "border-orange-500/30" : "border-emerald-500/20",
      bgColor: atRisk > 0 ? "bg-orange-500/10" : "bg-emerald-500/10",
      iconColor: atRisk > 0 ? "text-orange-400" : "text-emerald-400",
      glowColor: atRisk > 0 ? "shadow-orange-500/20" : "shadow-emerald-500/20",
    },
    {
      title: "CO₂ Prevented",
      value: `${co2Saved.toLocaleString()}`,
      sub: "metric tons saved",
      icon: Leaf,
      color: "emerald",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      glowColor: "shadow-emerald-500/30",
      highlight: true,
    },
    {
      title: "Active Alerts",
      value: activeAlerts,
      sub: state.agent_auto_pilot ? "🤖 Auto-Pilot resolving" : "Manual review needed",
      icon: Activity,
      color: "purple",
      borderColor: "border-purple-500/20",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      glowColor: "shadow-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          className={`glass-panel p-5 border ${kpi.borderColor} ${kpi.highlight ? 'gradient-border' : ''} shadow-lg ${kpi.glowColor} group cursor-default hover:scale-[1.02] transition-transform duration-200 rounded-2xl`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{kpi.title}</p>
              <h3 className={`text-3xl font-black tracking-tight ${kpi.iconColor}`}>{kpi.value}</h3>
              <p className="text-xs text-gray-600 mt-1 truncate">{kpi.sub}</p>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.iconColor} group-hover:scale-110 transition-transform duration-200 ml-3 shrink-0`}>
              <kpi.icon size={22} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
