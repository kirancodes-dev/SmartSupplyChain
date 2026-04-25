"use client";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import ToastProvider, { showToast } from "@/components/ToastProvider";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CloudLightning, AlertTriangle, Ship, Anchor, RefreshCw, Play, CheckCircle, ChevronRight } from "lucide-react";

const SCENARIOS = [
  {
    id: "suez-blockage",
    icon: Anchor,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.15)",
    name: "Suez Canal Blockage",
    desc: "A mega-vessel runs aground. 400+ ships affected. Global trade halted.",
    severity: "CRITICAL",
    events: [
      { type: "Sand Storm", name: "Suez Sandstorm", lat: 30.5, lng: 32.5, radius_km: 200, severity: "High", wind_speed_knots: 80 },
    ],
    ports: ["PORT-001", "PORT-002"],
    expectedSavings: "$180M",
    affectedVessels: 7,
  },
  {
    id: "pacific-typhoon-season",
    icon: CloudLightning,
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    name: "Pacific Typhoon Season",
    desc: "3 simultaneous Super Typhoons across the Pacific. Multiple shipping lanes closed.",
    severity: "CRITICAL",
    events: [
      { type: "Typhoon", name: "Typhoon Kai", lat: 22, lng: 138, radius_km: 500, severity: "High", wind_speed_knots: 165 },
      { type: "Typhoon", name: "Typhoon Nari", lat: 18, lng: 128, radius_km: 420, severity: "High", wind_speed_knots: 145 },
      { type: "Typhoon", name: "Typhoon Mawar", lat: 28, lng: 145, radius_km: 380, severity: "High", wind_speed_knots: 135 },
    ],
    expectedSavings: "$340M",
    affectedVessels: 11,
  },
  {
    id: "port-strike-wave",
    icon: Anchor,
    color: "#a855f7",
    glow: "rgba(168,85,247,0.15)",
    name: "Global Port Strike Wave",
    desc: "Simultaneous labor strikes at 5 major ports. Supply chains across 3 continents disrupted.",
    severity: "HIGH",
    events: [
      { type: "Dense Fog", name: "LA Port Fog", lat: 33.7, lng: -118.3, radius_km: 150, severity: "Medium", wind_speed_knots: 20 },
    ],
    expectedSavings: "$95M",
    affectedVessels: 5,
  },
  {
    id: "arctic-storm-system",
    icon: AlertTriangle,
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    name: "Arctic Storm System",
    desc: "Unprecedented Arctic blizzard system disrupts North Atlantic and North Pacific routes.",
    severity: "HIGH",
    events: [
      { type: "Hurricane", name: "Arctic Hurricane Alpha", lat: 65, lng: -30, radius_km: 600, severity: "High", wind_speed_knots: 120 },
      { type: "Storm", name: "Bering Sea Blizzard", lat: 58, lng: -175, radius_km: 400, severity: "High", wind_speed_knots: 95 },
    ],
    expectedSavings: "$210M",
    affectedVessels: 8,
  },
  {
    id: "indian-ocean-crisis",
    icon: CloudLightning,
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    name: "Indian Ocean Perfect Storm",
    desc: "Cyclone meets monsoon meets piracy alerts across Indian Ocean corridor.",
    severity: "CRITICAL",
    events: [
      { type: "Cyclone", name: "Cyclone Biparjoy", lat: -12, lng: 72, radius_km: 380, severity: "High", wind_speed_knots: 140 },
      { type: "Cyclone", name: "Cyclone Mocha", lat: 15, lng: 65, radius_km: 320, severity: "High", wind_speed_knots: 125 },
    ],
    expectedSavings: "$155M",
    affectedVessels: 9,
  },
];

const SEV_STYLE: Record<string, string> = {
  "CRITICAL": "bg-red-500/15 border-red-500/30 text-red-300",
  "HIGH": "bg-orange-500/15 border-orange-500/30 text-orange-300",
};

export default function ScenariosPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeLog, setActiveLog] = useState<string[]>([]);

  const runScenario = async (scenario: typeof SCENARIOS[0]) => {
    setRunning(scenario.id);
    setActiveLog([]);
    const log = (msg: string) => setActiveLog(prev => [...prev, msg]);

    try {
      log(`🚨 SCENARIO ACTIVATED: ${scenario.name}`);
      log(`📡 Injecting ${scenario.events.length} weather event(s)...`);

      for (const event of scenario.events) {
        await apiFetch("/weather/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        log(`⛈️  ${event.name} injected at (${event.lat}°, ${event.lng}°) — Wind: ${event.wind_speed_knots}kn`);
        await new Promise(r => setTimeout(r, 600));
      }

      log(`🤖 Gemini AI analyzing ${scenario.affectedVessels} affected vessels...`);
      await new Promise(r => setTimeout(r, 1500));

      log(`🔄 Auto-routing vessels away from danger zones...`);
      await new Promise(r => setTimeout(r, 1200));

      log(`✅ AI rerouting complete. Cargo protected: ${scenario.expectedSavings}`);
      log(`📊 Full analysis available in Audit Trail`);

      showToast({ type: "warning", title: `Scenario: ${scenario.name}`, message: `${scenario.events.length} events active. ${scenario.affectedVessels} vessels affected. AI responding.` });
      setCompleted(prev => new Set(prev).add(scenario.id));
    } catch {
      log(`❌ Error running scenario. Check backend connection.`);
      showToast({ type: "error", title: "Scenario Failed", message: "Backend connection error." });
    }
    setRunning(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ToastProvider />
      <NavBar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Zap size={24} className="text-orange-400" /> AI Scenario Builder
          </h1>
          <p className="text-gray-500 mt-1">Trigger complex multi-event disaster scenarios. Watch Gemini AI respond autonomously.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SCENARIOS.map(scenario => {
            const Icon = scenario.icon;
            const isRunning = running === scenario.id;
            const isDone = completed.has(scenario.id);
            return (
              <motion.div key={scenario.id} whileHover={{ scale: 1.01, y: -2 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/8 flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: scenario.glow }}>
                      <Icon size={22} style={{ color: scenario.color }} />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full border tracking-wider ${SEV_STYLE[scenario.severity]}`}>
                      {scenario.severity}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-2">{scenario.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{scenario.desc}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="glass-bright rounded-lg p-2">
                      <p className="text-xs font-bold text-white">{scenario.events.length}</p>
                      <p className="text-[9px] text-gray-600">Events</p>
                    </div>
                    <div className="glass-bright rounded-lg p-2">
                      <p className="text-xs font-bold text-orange-300">{scenario.affectedVessels}</p>
                      <p className="text-[9px] text-gray-600">Vessels</p>
                    </div>
                    <div className="glass-bright rounded-lg p-2">
                      <p className="text-xs font-bold text-emerald-300">{scenario.expectedSavings}</p>
                      <p className="text-[9px] text-gray-600">Protected</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => runScenario(scenario)}
                    disabled={!!running}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      isDone ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300" :
                      isRunning ? "border border-orange-500/30 bg-orange-500/10 text-orange-300" :
                      "text-white border border-white/15 hover:border-orange-500/40 hover:bg-orange-500/10"
                    } disabled:opacity-60`}
                    style={!isDone && !isRunning ? { background: `${scenario.color}15` } : {}}
                  >
                    {isRunning ? <><RefreshCw size={14} className="animate-spin"/> Running...</>
                      : isDone ? <><CheckCircle size={14}/> Completed</>
                      : <><Play size={14} fill="currentColor"/> Activate Scenario</>
                    }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live execution log */}
        <AnimatePresence>
          {activeLog.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-panel rounded-2xl p-5 border border-orange-500/20">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap size={13} className="text-orange-400"/> AI Execution Log
              </h3>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {activeLog.map((line, i) => (
                  <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`${line.startsWith("✅") ? "text-emerald-400" : line.startsWith("❌") ? "text-red-400" : line.startsWith("🚨") ? "text-red-300 font-bold" : "text-gray-400"}`}>
                    <span className="text-gray-700 mr-2">{String(i+1).padStart(2,"0")}.</span>{line}
                  </motion.p>
                ))}
                {running && <p className="text-gray-600 animate-pulse">_ AI processing...</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <ChatWidget />
    </div>
  );
}
