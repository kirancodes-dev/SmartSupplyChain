"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { WS_URL, toggleAutopilot, fetchMetrics } from "@/lib/api";
import NavBar from "@/components/NavBar";
import GlobeMap from "@/components/GlobeMap";
import AlertsPanel from "@/components/AlertsPanel";
import KPIStats from "@/components/KPIStats";
import ChatWidget from "@/components/ChatWidget";
import PortsTable from "@/components/PortsTable";
import SavingsPanel from "@/components/SavingsPanel";
import DemoMode from "@/components/DemoMode";
import AlertTicker from "@/components/AlertTicker";
import ToastProvider, { showToast } from "@/components/ToastProvider";
import OnboardingModal from "@/components/OnboardingModal";
import CommandPalette from "@/components/CommandPalette";
import WeatherControl from "@/components/WeatherControl";
import ForecastPanel from "@/components/ForecastPanel";
import MultiAgentPanel from "@/components/MultiAgentPanel";
import VoiceCommand from "@/components/VoiceCommand";
import { Power, Wifi, WifiOff, Globe, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [state, setState] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"globe" | "map">("globe");
  const wsRef = useRef<WebSocket | null>(null);
  const prevShipStatuses = useRef<Record<string, string>>({});

  const loadMetrics = useCallback(async () => {
    try { setMetrics(await fetchMetrics()); } catch {}
  }, []);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          showToast({ type: "info", title: "Connected", message: "WebSocket live feed established." });
        };
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            // Detect status changes and fire toasts
            data.ships?.forEach((ship: any) => {
              const prev = prevShipStatuses.current[ship.id];
              if (prev && prev !== ship.status) {
                if (ship.status === "at-risk")
                  showToast({ type: "warning", title: `${ship.name} At Risk`, message: `Risk score ${ship.risk_score}/100 · ${ship.cargo}` });
                if (ship.status === "rerouted")
                  showToast({ type: "ai", title: `${ship.name} Rerouted`, message: `AI optimized route to ${ship.destination} · CO₂ savings logged` });
                if (ship.status === "on-time" && prev === "at-risk")
                  showToast({ type: "success", title: `${ship.name} Clear`, message: "Vessel back on optimal route." });
              }
              prevShipStatuses.current[ship.id] = ship.status;
            });

            setState(data);
            setLastUpdate(new Date());
          } catch {}
        };
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => ws.close();
      } catch { reconnectTimer = setTimeout(connect, 3000); }
    };
    connect();
    const metricsInterval = setInterval(loadMetrics, 5000);
    loadMetrics();
    return () => { clearTimeout(reconnectTimer); clearInterval(metricsInterval); wsRef.current?.close(); };
  }, [loadMetrics]);

  const handleToggleAutoPilot = async () => {
    await toggleAutopilot();
    loadMetrics();
    const isOn = !state?.agent_auto_pilot;
    showToast({
      type: isOn ? "ai" : "info",
      title: `Auto-Pilot ${isOn ? "Enabled" : "Disabled"}`,
      message: isOn ? "Gemini AI is now autonomously resolving disruptions." : "Manual mode active.",
    });
  };

  const isAutoPilot = state?.agent_auto_pilot || false;

  return (
    <div className="min-h-screen flex flex-col">
      <ToastProvider />
      <OnboardingModal />
      <NavBar metrics={metrics} extraRight={<CommandPalette onAutoPilot={handleToggleAutoPilot} />} />
      <AlertTicker state={state} />

      <AnimatePresence>
        {isAutoPilot && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
            className="border-b border-emerald-500/20 bg-emerald-500/8 overflow-hidden">
            <div className="max-w-[1800px] mx-auto px-8 py-2 flex items-center gap-3 text-xs text-emerald-300">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
              <strong>Agentic Auto-Pilot Active</strong>
              <span className="text-emerald-500/60 hidden md:inline">— Gemini AI is autonomously monitoring all 15 vessels. Disruptions are resolved without human intervention.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">Operations Center</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {wsConnected
                ? <span className="flex items-center gap-1.5 text-[11px] text-emerald-400"><Wifi size={11}/> WebSocket Live {lastUpdate && <span className="text-gray-600">· {lastUpdate.toLocaleTimeString()}</span>}</span>
                : <span className="flex items-center gap-1.5 text-[11px] text-red-400"><WifiOff size={11}/> Reconnecting...</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-xl border border-white/10 overflow-hidden bg-white/5">
              <button onClick={() => setViewMode("globe")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${viewMode==="globe" ? "bg-blue-500/20 text-blue-300" : "text-gray-500 hover:text-gray-300"}`}>
                <Globe size={13}/> 3D Globe
              </button>
              <button onClick={() => setViewMode("map")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${viewMode==="map" ? "bg-blue-500/20 text-blue-300" : "text-gray-500 hover:text-gray-300"}`}>
                <Map size={13}/> Flat Map
              </button>
            </div>
            <button onClick={handleToggleAutoPilot}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isAutoPilot ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/20" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}>
              <Power size={14} className={isAutoPilot ? "animate-pulse" : ""} />
              {isAutoPilot ? "Auto-Pilot ON" : "Auto-Pilot OFF"}
            </button>
          </div>
        </div>

        <KPIStats state={state} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><GlobeMap state={state} onWeatherAdded={loadMetrics} /></div>
          <div className="lg:col-span-1"><AlertsPanel alerts={state?.alerts || []} onOptimized={loadMetrics} /></div>
        </div>

        <SavingsPanel state={state} metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DemoMode onRefresh={loadMetrics} />
          <WeatherControl onWeatherChange={loadMetrics} />
        </div>

        <ForecastPanel />

        {/* Multi-Agent + Voice side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MultiAgentPanel />
          <VoiceCommand />
        </div>

        {state?.ports && <PortsTable ports={state.ports} />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Cargo Value", value: `$${((metrics?.total_cargo_value_usd||0)/1e6).toFixed(0)}M`, sub: "under management" },
            { label: "AI Optimizations",  value: metrics?.total_alerts_resolved || 0, sub: "routes resolved" },
            { label: "WebSocket Clients", value: metrics?.websocket_clients ?? "—", sub: "live connections" },
            { label: "Uptime",            value: metrics?.uptime_seconds ? `${Math.floor(metrics.uptime_seconds/60)}m ${Math.floor(metrics.uptime_seconds%60)}s` : "—", sub: "continuous monitoring" },
          ].map((item,i) => (
            <div key={i} className="glass rounded-xl p-4">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{item.label}</p>
              <p className="text-xl font-black text-white mt-1">{item.value}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>

        <footer className="text-center text-[10px] text-gray-700 pb-2">
          Smart Supply Chain AI v2.0 · Gemini 2.0 Flash · Google H2S Hackathon 2026 · Press <kbd className="font-mono bg-white/10 px-1 rounded">⌘K</kbd> for commands
        </footer>
      </main>
      <ChatWidget />
    </div>
  );
}
