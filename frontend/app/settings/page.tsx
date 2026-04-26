"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Zap, Bell, Palette, Shield, Globe2, Save,
  CheckCircle, RefreshCw, Volume2, Eye, Bot, Sliders,
  AlertTriangle, Clock, Wind, BarChart3, Wifi, Moon
} from "lucide-react";

type Section = "simulation" | "ai" | "alerts" | "display" | "privacy";

const DEFAULTS = {
  simSpeed: 3,
  riskThreshold: 65,
  weatherSeverity: 70,
  autoPilotDelay: 5,
  autoRefreshInterval: 5,
  showVoice: true,
  showGlobe: true,
  showCommodities: true,
  showNews: true,
  pushNotifications: true,
  soundAlerts: false,
  emailAlerts: true,
  riskAlertLevel: "high",
  agentModel: "gemini-3-flash",
  agentDebate: true,
  forecastHours: 24,
  co2Tracking: true,
  anonymousMode: false,
  compactMode: false,
  animationsEnabled: true,
};

type Settings = typeof DEFAULTS;

function Toggle({ value, onChange, label, desc, color = "#10b981" }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        {desc && <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#060818]"
        style={{ background: value ? color : "rgba(255,255,255,0.1)" }}>
        <motion.div animate={{ x: value ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md" />
      </button>
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, unit, onChange, color = "#3b82f6", desc }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void; color?: string; desc?: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className="text-sm font-black px-2 py-0.5 rounded-lg" style={{ color, background: color + "20" }}>{value}{unit}</span>
      </div>
      {desc && <p className="text-[11px] text-gray-500 mb-2">{desc}</p>}
      <div className="relative h-2 bg-white/10 rounded-full overflow-visible">
        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all"
          style={{ left: `calc(${pct}% - 8px)`, background: color }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-700 mt-1.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, desc }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; desc?: string }) {
  return (
    <div className="py-3">
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      {desc && <p className="text-[11px] text-gray-500 mb-2">{desc}</p>}
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${value === opt.value ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SECTIONS: { id: Section; icon: any; label: string; color: string }[] = [
  { id: "simulation", icon: Sliders, label: "Simulation", color: "#3b82f6" },
  { id: "ai", icon: Bot, label: "AI Engine", color: "#a855f7" },
  { id: "alerts", icon: Bell, label: "Alerts", color: "#f97316" },
  { id: "display", icon: Palette, label: "Display", color: "#10b981" },
  { id: "privacy", icon: Shield, label: "Privacy", color: "#6b7280" },
];

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [active, setActive] = useState<Section>("simulation");
  const [saved, setSaved] = useState(false);
  const [changed, setChanged] = useState(false);

  const set = (key: keyof Settings, val: any) => {
    setS(prev => ({ ...prev, [key]: val }));
    setChanged(true);
  };

  const save = () => {
    localStorage.setItem("supply_chain_settings", JSON.stringify(s));
    setSaved(true);
    setChanged(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => { setS(DEFAULTS); setChanged(true); };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("supply_chain_settings");
      if (stored) setS(JSON.parse(stored));
    } catch {}
  }, []);

  const section = active;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><Settings size={26} className="text-blue-400" /> Settings</h1>
            <p className="text-gray-500 mt-1">Customize simulation behavior, AI parameters, and display preferences</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <RefreshCw size={12} /> Reset
            </button>
            <button onClick={save} disabled={!changed}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${changed ? "text-white" : "text-gray-600 opacity-50 cursor-not-allowed"}`}
              style={changed ? { background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" } : { background: "rgba(255,255,255,0.05)" }}>
              {saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Unsaved indicator */}
        <AnimatePresence>
          {changed && !saved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-xl">
              <AlertTriangle size={13} /> You have unsaved changes — click Save to apply.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Section tabs */}
          <div className="flex flex-row md:flex-col gap-2">
            {SECTIONS.map(sec => (
              <button key={sec.id} onClick={() => setActive(sec.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${active === sec.id ? "text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                style={active === sec.id ? { background: sec.color + "20", color: sec.color, border: `1px solid ${sec.color}30` } : { border: "1px solid transparent" }}>
                <sec.icon size={15} />
                <span className="hidden md:inline">{sec.label}</span>
              </button>
            ))}
          </div>

          {/* Settings panel */}
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="md:col-span-3 glass-panel rounded-2xl p-6 divide-y divide-white/8">

              {active === "simulation" && <>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest pb-3">Simulation Engine</p>
                <SliderField label="Simulation Speed" value={s.simSpeed} min={1} max={10} unit="x" onChange={v => set("simSpeed", v)} color="#3b82f6" desc="How fast ship positions and events update in the live simulation." />
                <SliderField label="Risk Alert Threshold" value={s.riskThreshold} min={10} max={95} unit="%" onChange={v => set("riskThreshold", v)} color="#ef4444" desc="Ships above this risk score will trigger auto-pilot rerouting." />
                <SliderField label="Weather Severity Filter" value={s.weatherSeverity} min={10} max={100} unit="%" onChange={v => set("weatherSeverity", v)} color="#f97316" desc="Only weather events above this intensity affect routing." />
                <SliderField label="Auto-Refresh Interval" value={s.autoRefreshInterval} min={2} max={30} unit="s" onChange={v => set("autoRefreshInterval", v)} color="#6366f1" desc="How often the dashboard polls the backend for new data." />
              </>}

              {active === "ai" && <>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest pb-3">AI Engine</p>
                <Select label="AI Model" value={s.agentModel}
                  options={[
                    { value: "gemini-3-flash", label: "Gemini 3 Flash ⚡" },
                    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro 🧠" },
                    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash 🚀" },
                    { value: "gemini-3-pro", label: "Gemini 3 Pro 💎" },
                  ]}
                  onChange={v => set("agentModel", v)}
                  desc="The Gemini model used for all AI analysis and generation." />
                <div className="divide-y divide-white/5">
                  <Toggle value={s.agentDebate} onChange={v => set("agentDebate", v)} label="Multi-Agent Council Debates" desc="Let AI agents argue and reach consensus before a decision." color="#a855f7" />
                  <Toggle value={s.co2Tracking} onChange={v => set("co2Tracking", v)} label="CO₂ Impact Calculation" desc="Calculate carbon savings for every AI-optimized route." color="#10b981" />
                </div>
                <SliderField label="Auto-Pilot Decision Delay" value={s.autoPilotDelay} min={1} max={30} unit="s" onChange={v => set("autoPilotDelay", v)} color="#a855f7" desc="Wait time before auto-pilot executes a rerouting decision." />
                <SliderField label="Forecast Window" value={s.forecastHours} min={6} max={72} unit="h" onChange={v => set("forecastHours", v)} color="#f59e0b" desc="How many hours ahead the AI generates the fleet risk forecast." />
              </>}

              {active === "alerts" && <>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest pb-3">Alert Preferences</p>
                <Select label="Risk Alert Sensitivity" value={s.riskAlertLevel}
                  options={[
                    { value: "low", label: "Low — All alerts" },
                    { value: "medium", label: "Medium — Moderate+" },
                    { value: "high", label: "High — Critical only" },
                    { value: "off", label: "Off — No alerts" },
                  ]}
                  onChange={v => set("riskAlertLevel", v)}
                  desc="Which severity level of incidents trigger notifications." />
                <div className="divide-y divide-white/5">
                  <Toggle value={s.pushNotifications} onChange={v => set("pushNotifications", v)} label="Browser Push Notifications" desc="System-level alerts even when tab is in background." color="#f97316" />
                  <Toggle value={s.soundAlerts} onChange={v => set("soundAlerts", v)} label="Sound Alerts" desc="Play a chime when a high-risk vessel is detected." color="#ef4444" />
                  <Toggle value={s.emailAlerts} onChange={v => set("emailAlerts", v)} label="Auto Email Draft on Risk" desc="Automatically open email drafter when a ship is at risk." color="#3b82f6" />
                </div>
              </>}

              {active === "display" && <>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest pb-3">Display & Layout</p>
                <div className="divide-y divide-white/5">
                  <Toggle value={s.showGlobe} onChange={v => set("showGlobe", v)} label="3D Globe Visualization" desc="Show the interactive WebGL globe on the dashboard." color="#3b82f6" />
                  <Toggle value={s.showCommodities} onChange={v => set("showCommodities", v)} label="Commodity Price Ticker" desc="Show the live market price feed (BDIY, Brent, LNG)." color="#f59e0b" />
                  <Toggle value={s.showNews} onChange={v => set("showNews", v)} label="AI News Intelligence Feed" desc="Show the Gemini-generated maritime news widget." color="#f97316" />
                  <Toggle value={s.showVoice} onChange={v => set("showVoice", v)} label="Voice Command Widget" desc="Show the voice-to-AI interface on the dashboard." color="#a855f7" />
                  <Toggle value={s.animationsEnabled} onChange={v => set("animationsEnabled", v)} label="Animations & Transitions" desc="Disable for better performance on slower devices." color="#10b981" />
                  <Toggle value={s.compactMode} onChange={v => set("compactMode", v)} label="Compact Mode" desc="Reduce card padding and font sizes for more data density." color="#6b7280" />
                </div>
              </>}

              {active === "privacy" && <>
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest pb-3">Privacy & Data</p>
                <div className="divide-y divide-white/5">
                  <Toggle value={s.anonymousMode} onChange={v => set("anonymousMode", v)} label="Anonymous Demo Mode" desc="Mask ship names and cargo details for public demos." color="#6b7280" />
                </div>
                <div className="pt-4 pb-2">
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">Data Management</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Clear Optimization History", desc: "Removes all AI decision logs", color: "#f97316" },
                      { label: "Reset All Settings", desc: "Restore all values to default", color: "#ef4444" },
                      { label: "Export Settings JSON", desc: "Download your configuration", color: "#3b82f6" },
                    ].map(action => (
                      <button key={action.label}
                        onClick={action.label === "Reset All Settings" ? reset : action.label === "Export Settings JSON" ? () => { const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "supply_chain_settings.json"; a.click(); } : undefined}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all group">
                        <div>
                          <p className="text-sm font-bold text-white">{action.label}</p>
                          <p className="text-[11px] text-gray-600">{action.desc}</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-lg border transition-all" style={{ color: action.color, borderColor: action.color + "40", background: action.color + "15" }}>Run</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Save confirmation toast */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl z-50 border border-emerald-500/30"
              style={{ background: "rgba(16,185,129,0.15)", backdropFilter: "blur(20px)" }}>
              <CheckCircle size={16} className="text-emerald-400" />
              <p className="text-sm font-bold text-white">Settings saved successfully</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <ChatWidget />
    </div>
  );
}
