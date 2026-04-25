"use client";
import { useState } from "react";
import { Play, Square, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

const DEMO_STEPS = [
  { id: 1, label: "Scanning global network...",         color: "text-blue-400",    delay: 1500 },
  { id: 2, label: "Typhoon detected near Pacific route",color: "text-red-400",     delay: 1800 },
  { id: 3, label: "SH-003 entering danger zone",        color: "text-orange-400",  delay: 1800 },
  { id: 4, label: "Risk score elevated to 87/100",      color: "text-orange-400",  delay: 1500 },
  { id: 5, label: "Gemini AI analyzing alternatives...", color: "text-purple-400",  delay: 2000 },
  { id: 6, label: "Optimal route calculated — Port of Seattle", color: "text-blue-400", delay: 1800 },
  { id: 7, label: "Rerouting vessel — ETA updated",     color: "text-emerald-400", delay: 1500 },
  { id: 8, label: "CO₂ savings: +240 metric tons",      color: "text-emerald-400", delay: 1500 },
  { id: 9, label: "Cargo protected: $12M Electronics",  color: "text-emerald-400", delay: 1500 },
  { id: 10, label: "✅ Incident resolved autonomously", color: "text-emerald-400", delay: 1000 },
];

export default function DemoMode({ onRefresh }: { onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const runDemo = async () => {
    setRunning(true);
    setDone(false);
    setCompletedSteps([]);
    setCurrentStep(0);

    // Trigger auto-pilot on backend
    try { await apiFetch("/toggle-autopilot", { method: "POST" }); } catch {}

    for (let i = 0; i < DEMO_STEPS.length; i++) {
      setCurrentStep(i + 1);
      await new Promise(r => setTimeout(r, DEMO_STEPS[i].delay));
      setCompletedSteps(prev => [...prev, DEMO_STEPS[i].id]);
      if (i === 6) onRefresh(); // refresh UI after reroute step
    }
    onRefresh();
    setDone(true);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setDone(false);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/20">
      <div className="px-5 py-3 border-b border-white/8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play size={14} className="text-purple-400" /> Live Demo Mode
          </h3>
          <p className="text-[11px] text-gray-500">Auto-plays full AI workflow for your video</p>
        </div>
        <div className="flex gap-2">
          {running ? (
            <button onClick={reset} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
              <Square size={11} /> Stop
            </button>
          ) : (
            <button onClick={runDemo} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all">
              <Play size={12} /> {done ? "Replay Demo" : "▶ Start Demo"}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-1.5">
        {DEMO_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = completedSteps.includes(step.id);
          const isPending = !isActive && !isDone;

          return (
            <motion.div
              key={step.id}
              className={`flex items-center gap-2.5 p-2 rounded-lg transition-all text-xs ${
                isActive ? "bg-white/8 border border-white/10" :
                isDone ? "opacity-60" : "opacity-25"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                isDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                "bg-white/5 text-gray-600 border border-white/10"
              }`}>
                {isDone ? "✓" : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                ) : step.id}
              </div>
              <span className={isDone ? "text-gray-400" : isActive ? step.color : "text-gray-600"}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {done && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="px-5 pb-4 text-center">
          <p className="text-xs text-emerald-400 font-bold">🎉 Demo complete! All AI agents operated autonomously.</p>
        </motion.div>
      )}
    </div>
  );
}
