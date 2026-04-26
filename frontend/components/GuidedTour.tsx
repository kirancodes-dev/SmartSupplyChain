"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Globe2, Ship, Anchor, Zap, Mic, Bot, FileText, CheckCircle } from "lucide-react";

const STEPS = [
  {
    target: "body",
    icon: Globe2,
    color: "#3b82f6",
    title: "Welcome to Smart Supply Chain AI",
    desc: "This platform uses Gemini 3 Flash to autonomously monitor 15 vessels across global shipping lanes. Let's take a quick tour of the key features.",
    tip: "Press → or click Next to advance",
  },
  {
    target: "#kpi-stats",
    icon: Ship,
    color: "#10b981",
    title: "Live KPI Dashboard",
    desc: "8 real-time metrics update via WebSocket every second — fleet size, at-risk vessels, CO₂ savings, cargo value protected, and more.",
    tip: "All data updates live — no page refresh needed",
  },
  {
    target: "#globe",
    icon: Globe2,
    color: "#6366f1",
    title: "3D Interactive Globe",
    desc: "Click any ship to see its live status. Click anywhere on the ocean to instantly drop a weather event. Watch AI respond in real-time.",
    tip: "Toggle 'Drop Storm Mode' in the globe header",
  },
  {
    target: "#commodity-prices",
    icon: ArrowRight,
    color: "#f59e0b",
    title: "Live Market Index",
    desc: "Baltic Dry Index, Brent Crude, LNG Spot, and Container Rates update every 8 seconds. Watch cargo value fluctuate with real market conditions.",
    tip: "Markets directly affect cargo value calculations",
  },
  {
    target: "#auto-pilot",
    icon: Bot,
    color: "#a855f7",
    title: "Autonomous Auto-Pilot",
    desc: "Toggle Auto-Pilot ON. Gemini AI will continuously monitor all vessels and autonomously reroute any ship that becomes at-risk — no human intervention needed.",
    tip: "Watch the green banner appear and AI log fill up",
  },
  {
    target: "#scenarios",
    icon: Zap,
    color: "#ef4444",
    title: "AI Scenario Builder",
    desc: "Navigate to /scenarios. Choose 'Pacific Typhoon Season' to trigger 3 simultaneous typhoons. Watch the AI cascade response unfold in the execution log.",
    tip: "This is your most powerful demo moment",
  },
  {
    target: "#multi-agent",
    icon: Bot,
    color: "#a855f7",
    title: "Multi-Agent Council",
    desc: "4 specialized Gemini agents — Weather, Economics, ESG, and Risk — debate the best course of action simultaneously and reach a consensus recommendation.",
    tip: "Click 'Start Agent Debate' and watch 4 AIs think",
  },
  {
    target: "#voice",
    icon: Mic,
    color: "#3b82f6",
    title: "Voice Commands",
    desc: "Click the microphone and say: 'How many ships are at risk?' or 'Give me an executive summary'. Gemini responds with spoken voice synthesis.",
    tip: "Works in Chrome, Edge, and Safari",
  },
  {
    target: "#report",
    icon: FileText,
    color: "#10b981",
    title: "Executive Report",
    desc: "Navigate to /report for a print-quality PDF-ready executive briefing — fleet register, AI audit log, and economic impact summary.",
    tip: "Click 'Print / Save PDF' for a take-away document",
  },
  {
    target: "body",
    icon: CheckCircle,
    color: "#10b981",
    title: "You're Ready! 🚀",
    desc: "You've seen all the key features. For your demo: Open /home → Dashboard → Scenarios → /report. Press ⌘K anytime to navigate quickly.",
    tip: "Press ? to see all keyboard shortcuts",
  },
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onClose();
  }, [step, onClose]);

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  // Keyboard
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end justify-center p-6 pb-10">
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden border"
          style={{ borderColor: current.color + "30" }}>
          {/* Progress dots */}
          <div className="flex items-center gap-1 px-5 pt-4">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{ flex: i === step ? 3 : 1, background: i <= step ? current.color : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: current.color + "20" }}>
                <Icon size={22} style={{ color: current.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: current.color }}>
                  Step {step + 1} of {STEPS.length}
                </p>
                <h3 className="text-lg font-black text-white leading-tight">{current.title}</h3>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">{current.desc}</p>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: current.color + "10" }}>
              <span className="text-base">💡</span>
              <p className="text-[11px] font-semibold" style={{ color: current.color }}>{current.tip}</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button onClick={onClose} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Skip Tour</button>
              <div className="flex-1 flex items-center justify-end gap-2">
                {step > 0 && (
                  <button onClick={prev} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-all">
                    <ArrowLeft size={12} /> Back
                  </button>
                )}
                <button onClick={next}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}99)`, boxShadow: `0 4px 20px ${current.color}40` }}>
                  {step === STEPS.length - 1 ? "Finish Tour" : "Next"} <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
