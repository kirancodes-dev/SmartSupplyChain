"use client";
import { useEffect, useState } from "react";
import DashboardMap from "@/components/DashboardMap";
import AlertsPanel from "@/components/AlertsPanel";
import KPIStats from "@/components/KPIStats";
import ChatWidget from "@/components/ChatWidget";
import { fetchState, toggleAutopilot } from "@/lib/api";
import { Sparkles, Power, RefreshCw, Globe2, Satellite } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      const data = await fetchState();
      setState(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (manual) setTimeout(() => setRefreshing(false), 600);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoPilot = async () => {
    await toggleAutopilot();
    loadData(true);
  };

  const isAutoPilot = state?.agent_auto_pilot || false;
  const atRisk = state?.ships?.filter((s: any) => s.status === "at-risk").length || 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ──── Top Bar ──── */}
      <header className="sticky top-0 z-40 border-b border-white/8 backdrop-blur-xl bg-[rgba(6,8,24,0.85)]">
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Globe2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black gradient-text leading-none tracking-tight">Smart Supply Chain AI</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Disruption Detector & Optimizer</p>
            </div>
          </div>

          {/* Status bar */}
          <div className="hidden md:flex items-center gap-2">
            {atRisk > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="badge badge-orange"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                {atRisk} vessels at risk
              </motion.div>
            )}
            <div className="badge badge-blue">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Live Telemetry
            </div>
            <div className="badge badge-purple">
              <Sparkles size={9} className="text-purple-400" />
              Gemini AI
            </div>
            <div className="badge badge-emerald">
              <Satellite size={9} />
              Vision API
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              title="Refresh data"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleToggleAutoPilot}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                isAutoPilot
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/20"
                  : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Power size={14} className={isAutoPilot ? "animate-pulse" : ""} />
              {isAutoPilot ? "Auto-Pilot ON" : "Auto-Pilot OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* Auto-Pilot Banner */}
      <AnimatePresence>
        {isAutoPilot && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-emerald-500/20 bg-emerald-500/8 overflow-hidden"
          >
            <div className="max-w-[1700px] mx-auto px-8 py-2 flex items-center gap-3 text-xs text-emerald-300">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              <strong>Agentic Auto-Pilot Active</strong>
              <span className="text-emerald-500">—</span>
              <span className="text-emerald-400/70">Gemini AI is autonomously monitoring all vessels and will automatically reroute any at-risk shipment without human intervention.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-[1700px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* KPIs */}
        <KPIStats state={state} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Map */}
          <div className="lg:col-span-2">
            <DashboardMap state={state} />
          </div>

          {/* Alerts */}
          <div className="lg:col-span-1">
            <AlertsPanel alerts={state?.alerts || []} onOptimized={() => loadData()} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-700 pb-2">
          {lastRefresh && (
            <span>Last updated: {lastRefresh.toLocaleTimeString()} · </span>
          )}
          Smart Supply Chain AI · Built with Gemini 2.5 Pro · Google H2S Hackathon
        </footer>
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
