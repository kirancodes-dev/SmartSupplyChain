"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function PortsTable({ ports }: { ports: any[] }) {
  if (!ports || ports.length === 0) return null;

  const sorted = [...ports].sort((a, b) => {
    const ua = (a.current_load / a.capacity) * 100;
    const ub = (b.current_load / b.capacity) * 100;
    return ub - ua;
  });

  const statusColor: Record<string, string> = {
    Congested: "text-red-400",
    Moderate: "text-yellow-400",
    Clear: "text-emerald-400",
  };
  const barColor: Record<string, string> = {
    Congested: "bg-red-500",
    Moderate: "bg-yellow-500",
    Clear: "bg-emerald-500",
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/8 bg-black/30 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Port Capacity Monitor</h3>
        <span className="text-xs text-gray-500">{ports.length} ports tracked globally</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5 text-gray-600 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-semibold">Port</th>
              <th className="text-left px-4 py-2.5 font-semibold">Region</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold w-40">Utilization</th>
              <th className="text-right px-4 py-2.5 font-semibold">Load</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((port, idx) => {
              const util = Math.round((port.current_load / port.capacity) * 100);
              return (
                <tr key={port.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${idx % 2 === 0 ? "" : "bg-white/[0.015]"}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{port.full_name || port.name}</p>
                    <p className="text-gray-600">{port.country}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{port.region}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${statusColor[port.status] || "text-gray-400"}`}>
                      {port.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor[port.status] || "bg-blue-500"}`}
                          style={{ width: `${util}%` }}
                        />
                      </div>
                      <span className={`w-8 text-right font-bold ${statusColor[port.status] || ""}`}>{util}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {port.current_load.toLocaleString()} / {port.capacity.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
