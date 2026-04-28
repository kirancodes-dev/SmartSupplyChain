"use client";
import { useState } from "react";
import { Play, Square, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

const SCENARIOS = [
  {
    id: "typhoon",
    label: "Pacific Typhoon",
    badge: "Most Dramatic",
    steps: [
      { id: 1,  label: "Scanning 15 vessels across 6 ocean zones...",           color: "text-blue-400",    delay: 600 },
      { id: 2,  label: "⚡ Typhoon HAIKUI detected — Pacific corridor",          color: "text-red-400",     delay: 550 },
      { id: 3,  label: "SH-003 entering 200nm danger radius",                    color: "text-orange-400",  delay: 500 },
      { id: 4,  label: "Risk score elevated: 45 → 87 / 100",                    color: "text-orange-400",  delay: 500 },
      { id: 5,  label: "Gemini AI: analyzing 6 alternative routes...",           color: "text-purple-400",  delay: 750 },
      { id: 6,  label: "Gemini: \"Route via Seattle saves 2.1 days + $45K\"",    color: "text-purple-300",  delay: 650 },
      { id: 7,  label: "Rerouting SH-003 → Port of Seattle. ETA updated.",      color: "text-blue-400",    delay: 550 },
      { id: 8,  label: "CO₂ savings logged: +240 metric tons",                  color: "text-emerald-400", delay: 500 },
      { id: 9,  label: "$12M Electronics cargo — risk cleared",                 color: "text-emerald-400", delay: 450 },
      { id: 10, label: "✅ Incident resolved autonomously",                      color: "text-emerald-400", delay: 400 },
    ],
    result: { time: "4.2s", value: "$12M", co2: "240t", humans: "0" },
  },
  {
    id: "congestion",
    label: "Port Congestion",
    badge: "High ROI",
    steps: [
      { id: 1,  label: "Port capacity scan — all 12 monitored ports...",         color: "text-blue-400",    delay: 600 },
      { id: 2,  label: "⚡ Shanghai at 98% capacity — 4.2 day queue",           color: "text-red-400",     delay: 550 },
      { id: 3,  label: "3 vessels converging — $45K/day exposure each",          color: "text-orange-400",  delay: 550 },
      { id: 4,  label: "Gemini AI: searching alternative berth windows...",      color: "text-purple-400",  delay: 750 },
      { id: 5,  label: "Gemini: \"Ningbo has 12-hr availability slot\"",         color: "text-purple-300",  delay: 650 },
      { id: 6,  label: "Rerouting SH-007, SH-012, SH-014 → Ningbo",            color: "text-blue-400",    delay: 550 },
      { id: 7,  label: "Demurrage avoided: 3 ships × 4.2 days × $45K",         color: "text-emerald-400", delay: 550 },
      { id: 8,  label: "CO₂ reduction: +180t (no idle port waiting)",           color: "text-emerald-400", delay: 500 },
      { id: 9,  label: "Net savings: $567,000",                                 color: "text-emerald-400", delay: 450 },
      { id: 10, label: "✅ 3 disruptions resolved autonomously",                 color: "text-emerald-400", delay: 400 },
    ],
    result: { time: "3.8s", value: "$567K", co2: "180t", humans: "0" },
  },
];

export default function DemoMode({ onRefresh }: { onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  const runDemo = async () => {
    setRunning(true);
    setDone(false);
    setCompletedSteps([]);
    setCurrentStep(0);
    try { await apiFetch("/toggle-autopilot", { method: "POST" }); } catch {}
    for (let i = 0; i < scenario.steps.length; i++) {
      setCurrentStep(i + 1);
      await new Promise(r => setTimeout(r, scenario.steps[i].delay));
      setCompletedSteps(prev => [...prev, scenario.steps[i].id]);
      if (i === 6) onRefresh();
    }
    onRefresh();
    setDone(true);
    setRunning(false);
  };

  const reset = () => { setRunning(false); setCurrentStep(0); setCompletedSteps([]); setDone(false); };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
      <div className="px-5 py-3 border-b border-white/8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play size={14} className="text-purple-400" /> Live Demo Scenario
          </h3>
          <p className="text-[11px] text-gray-500">Watch Gemini AI resolve a supply chain crisis in real time</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!running && (
            <div className="flex gap-1">
              {SCENARIOS.map((s, i) => (
                <button key={s.id} onClick={() => { setScenarioIdx(i); reset(); }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${i === scenarioIdx ? "border-purple-500/40 bg-purple-500/15 text-purple-300" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {running ? (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
              <Square size={11} /> Stop
            </button>
          ) : (
            <button onClick={runDemo} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all">
              <Play size={12} /> {done ? "▶ Replay" : "▶ Run Demo"}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-1.5">
          {scenario.steps.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = completedSteps.includes(step.id);
            return (
              <motion.div key={step.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-all text-xs ${isActive ? "bg-white/8 border border-white/10" : isDone ? "opacity-60" : "opacity-20"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-gray-600 border border-white/10"}`}>
                  {isDone ? "✓" : isActive ? <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> : step.id}
                </div>
                <span className={isDone ? "text-gray-400" : isActive ? step.color : "text-gray-600"}>{step.label}</span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4">
              <p className="text-[11px] font-black text-emerald-400 mb-3 flex items-center gap-2">
                <Zap size={11} /> SCENARIO RESOLVED — GEMINI AI ACTED AUTONOMOUSLY
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "AI Response", value: scenario.result.time, color: "#3b82f6" },
                  { label: "Value Saved", value: scenario.result.value, color: "#a855f7" },
                  { label: "CO₂ Saved",   value: scenario.result.co2,   color: "#10b981" },
                  { label: "Humans Needed", value: scenario.result.humans, color: "#f59e0b" },
                ].map(r => (
                  <div key={r.label}>
                    <p className="text-xl font-black" style={{ color: r.color }}>{r.value}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{r.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="w-full mt-3 text-[9px] text-gray-700 hover:text-gray-500 transition-colors">
                ↩ Reset demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
