"use client";
import { Activity, AlertTriangle, CheckCircle, Package } from "lucide-react";

export default function KPIStats({ state }: { state: any }) {
  if (!state) return null;

  const totalShips = state.ships?.length || 0;
  const atRisk = state.ships?.filter((s: any) => s.status === 'at-risk').length || 0;
  const congestedPorts = state.ports?.filter((p: any) => p.status === 'Congested').length || 0;
  
  const kpis = [
    { title: "Active Shipments", value: totalShips, icon: Package, color: "text-blue-400" },
    { title: "At Risk / Delayed", value: atRisk, icon: AlertTriangle, color: "text-orange-400" },
    { title: "Congested Ports", value: congestedPorts, icon: Activity, color: "text-red-400" },
    { title: "System Status", value: atRisk > 0 ? "Elevated Risk" : "Optimal", icon: CheckCircle, color: atRisk > 0 ? "text-orange-400" : "text-emerald-400" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="glass-panel p-5 flex items-center justify-between group hover:border-white/20 transition-all">
          <div>
            <p className="text-sm text-gray-400">{kpi.title}</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight">{kpi.value}</h3>
          </div>
          <div className={`p-4 rounded-full bg-white/5 ${kpi.color} group-hover:scale-110 transition-transform`}>
            <kpi.icon size={28} />
          </div>
        </div>
      ))}
    </div>
  );
}
