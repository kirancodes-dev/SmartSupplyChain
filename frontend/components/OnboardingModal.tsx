"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Ship, Zap, Leaf, Bot, Eye, X, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Globe2, color: "#3b82f6", title: "3D Globe", desc: "Live vessel & port tracking on an interactive WebGL globe. Hover ships for details." },
  { icon: Bot,    color: "#a855f7", title: "Gemini AI Chat", desc: "Ask questions about live fleet data. Gemini uses Function Calling to fetch real data." },
  { icon: Zap,    color: "#10b981", title: "Auto-Pilot Mode", desc: "Enable autonomous AI rerouting. Gemini resolves disruptions without human input." },
  { icon: Eye,    color: "#f97316", title: "Vision Scan", desc: "Upload satellite images. Gemini Vision API detects weather anomalies automatically." },
  { icon: Leaf,   color: "#10b981", title: "CO₂ Tracking", desc: "Every reroute saves CO₂. Track cumulative sustainability impact in real-time." },
  { icon: Ship,   color: "#3b82f6", title: "Fleet Manager", desc: "Full 15-vessel table with sortable risk scores, cargo values, and 1-click rerouting." },
];

const DISMISSED_KEY = "ssc_onboarded";

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setTimeout(() => setOpen(true), 800); // slight delay for drama
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[300]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-full max-w-xl rounded-3xl overflow-hidden"
            style={{ background: "rgba(7,10,26,0.99)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 80px rgba(59,130,246,0.2), 0 30px 60px rgba(0,0,0,0.9)" }}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 text-center" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.08), rgba(168,85,247,0.05))" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
                <Globe2 size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-black gradient-text mb-2">Smart Supply Chain AI</h2>
              <p className="text-gray-400 text-sm">Industrial-grade AI for global logistics · Powered by Gemini 2.0 Flash</p>
              <div className="flex items-center justify-center gap-4 mt-3">
                {[
                  { value: "15", label: "Live Vessels" },
                  { value: "12", label: "Ports Monitored" },
                  { value: "4", label: "AI Agents" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-black text-white">{s.value}</p>
                    <p className="text-[9px] text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features grid */}
            <div className="px-6 py-5 grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-white/8 hover:bg-white/4 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${f.color}18` }}>
                    <f.icon size={15} style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{f.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={dismiss}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}
              >
                Launch Dashboard <ArrowRight size={16} />
              </button>
              <p className="text-center text-[10px] text-gray-700">Press <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">⌘K</kbd> anytime to open the command palette</p>
            </div>
            <button onClick={dismiss} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
