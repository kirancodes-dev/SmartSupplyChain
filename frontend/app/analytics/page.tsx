"use client";
import { useEffect, useState } from "react";
import { fetchHistory, fetchMetrics, fetchPorts } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { BarChart3, TrendingUp, Leaf, AlertTriangle } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const BASE_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index" as const, intersect: false } },
  scales: {
    x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#4b5563", maxTicksLimit: 10, font: { size: 10 } } },
    y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "#4b5563", font: { size: 10 } } },
  },
};

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [ports, setPorts] = useState<any[]>([]);

  const load = async () => {
    try {
      const [h, m, p] = await Promise.all([fetchHistory(), fetchMetrics(), fetchPorts()]);
      setHistory(h || []);
      setMetrics(m);
      setPorts(p?.ports || []);
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const labels = history.map((_, i) => `T-${history.length - i}`);

  const fleetData = {
    labels,
    datasets: [
      { label: "On Time",  data: history.map(h => h.on_time_count),  borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", fill: true, tension: 0.4, pointRadius: 0 },
      { label: "At Risk",  data: history.map(h => h.at_risk_count),  borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.08)", fill: true, tension: 0.4, pointRadius: 0 },
      { label: "Rerouted", data: history.map(h => h.rerouted_count), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)", fill: true, tension: 0.4, pointRadius: 0 },
    ],
  };

  const co2Data = {
    labels,
    datasets: [{ label: "CO₂ (tons)", data: history.map(h => h.co2_saved), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.12)", fill: true, tension: 0.4, pointRadius: 0 }],
  };

  const portData = {
    labels: ports.map(p => p.name),
    datasets: [{
      label: "Utilization %",
      data: ports.map(p => Math.round((p.current_load / p.capacity) * 100)),
      backgroundColor: ports.map(p => p.status === "Congested" ? "rgba(239,68,68,0.6)" : p.status === "Moderate" ? "rgba(245,158,11,0.6)" : "rgba(16,185,129,0.6)"),
      borderColor: ports.map(p => p.status === "Congested" ? "#ef4444" : p.status === "Moderate" ? "#f59e0b" : "#10b981"),
      borderWidth: 1, borderRadius: 6,
    }],
  };

  const alertData = {
    labels,
    datasets: [{ label: "Alerts", data: history.map(h => h.active_alerts), borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.1)", fill: true, tension: 0.4, pointRadius: 0 }],
  };

  const stats = [
    { label: "CO₂ Total Saved", value: `${(metrics?.total_co2_saved_tons||0).toLocaleString()} t`, icon: Leaf, color: "text-emerald-400" },
    { label: "Routes Optimized", value: metrics?.total_alerts_resolved || 0, icon: TrendingUp, color: "text-blue-400" },
    { label: "Active Alerts", value: metrics?.active_alerts || 0, icon: AlertTriangle, color: "text-orange-400" },
    { label: "Data Points", value: history.length, icon: BarChart3, color: "text-purple-400" },
  ];

  const NoData = () => <div className="h-full flex items-center justify-center text-gray-600 text-sm">Collecting data...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar metrics={metrics} />
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><BarChart3 size={22} className="text-purple-400" /> Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Time-series intelligence across {history.length} ticks</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((c, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-white/5 ${c.color}`}><c.icon size={20} /></div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">{c.label}</p>
                <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">Fleet Status Over Time</h3>
            <p className="text-[10px] text-gray-600 mb-3 flex gap-3">
              {[["#10b981","On Time"],["#f97316","At Risk"],["#3b82f6","Rerouted"]].map(([c,l])=>(
                <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:c}}></span>{l}</span>
              ))}
            </p>
            <div className="h-52">{history.length > 2 ? <Line data={fleetData} options={BASE_OPTS} /> : <NoData />}</div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Leaf size={13} className="text-emerald-400" /> CO₂ Emissions Prevented (Cumulative)</h3>
            <div className="h-52">{history.length > 2 ? <Line data={co2Data} options={BASE_OPTS} /> : <NoData />}</div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Port Utilization</h3>
            <div className="h-52">{ports.length > 0 ? <Bar data={portData} options={{...BASE_OPTS, scales:{...BASE_OPTS.scales, y:{...BASE_OPTS.scales.y, max:100}}}} /> : <NoData />}</div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Disruption Alert Activity</h3>
            <div className="h-52">{history.length > 2 ? <Line data={alertData} options={BASE_OPTS} /> : <NoData />}</div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Port Capacity Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ports.map(p => {
              const util = Math.round((p.current_load / p.capacity) * 100);
              const color = p.status === "Congested" ? "text-red-400" : p.status === "Moderate" ? "text-yellow-400" : "text-emerald-400";
              const bar = p.status === "Congested" ? "bg-red-500" : p.status === "Moderate" ? "bg-yellow-500" : "bg-emerald-500";
              return (
                <div key={p.id} className="glass-bright rounded-xl p-3">
                  <p className="text-xs font-bold text-white truncate">{p.full_name || p.name}</p>
                  <p className="text-[10px] text-gray-600 mb-2">{p.country}</p>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${util}%` }} />
                  </div>
                  <div className="flex justify-between"><span className={`text-xs font-bold ${color}`}>{p.status}</span><span className="text-[10px] text-gray-600">{util}%</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
