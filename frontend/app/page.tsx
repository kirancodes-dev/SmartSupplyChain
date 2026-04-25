"use client";
import { useEffect, useState } from "react";
import DashboardMap from "@/components/DashboardMap";
import AlertsPanel from "@/components/AlertsPanel";
import KPIStats from "@/components/KPIStats";
import { fetchState } from "@/lib/api";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [state, setState] = useState<any>(null);

  const loadData = async () => {
    try {
      const data = await fetchState();
      setState(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto selection:bg-blue-500/30">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400 tracking-tight">
            Smart Supply Chain AI
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium tracking-wide uppercase">Preemptive Disruption Detection & Optimization</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Live Telemetry
          </div>
          <div className="px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Sparkles size={14} className="text-purple-400" />
            Gemini Engine Active
          </div>
        </div>
      </header>

      <KPIStats state={state} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <DashboardMap state={state} />
        </div>
        <div className="lg:col-span-1 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <AlertsPanel alerts={state?.alerts || []} onOptimized={loadData} />
        </div>
      </div>
    </main>
  );
}
