"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { category: "Navigation" },
  { keys: ["⌘", "K"],      desc: "Open command palette" },
  { keys: ["?"],            desc: "Open this keyboard shortcuts guide" },
  { keys: ["Esc"],          desc: "Close any modal or overlay" },

  { category: "Dashboard" },
  { keys: ["A"],            desc: "Toggle Auto-Pilot on/off" },
  { keys: ["D"],            desc: "Start Demo Mode" },
  { keys: ["S"],            desc: "Open AI Scenario Builder" },
  { keys: ["F"],            desc: "Go to Fleet Management" },
  { keys: ["R"],            desc: "Open Executive Report" },

  { category: "Globe" },
  { keys: ["G"],            desc: "Focus 3D Globe" },
  { keys: ["M"],            desc: "Toggle Storm Drop Mode" },
  { keys: ["Space"],        desc: "Reset globe rotation" },

  { category: "AI" },
  { keys: ["V"],            desc: "Activate Voice Command" },
  { keys: ["E"],            desc: "Request AI Executive Summary" },
  { keys: ["T"],            desc: "Generate 24h Forecast" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all text-xs font-black">
        ?
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-xl glass-panel rounded-2xl overflow-hidden border border-white/10"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Keyboard size={14} className="text-blue-400"/> Keyboard Shortcuts</h3>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white"><X size={14}/></button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-2 gap-x-8 gap-y-1">
                {SHORTCUTS.map((item, i) => {
                  if ("category" in item) {
                    return <div key={i} className="col-span-2 mt-3 mb-1 first:mt-0">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.category}</p>
                    </div>;
                  }
                  return (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-gray-400">{item.desc}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys?.map((k, j) => (
                          <kbd key={j} className="px-2 py-1 rounded-md text-[10px] font-black text-gray-300 bg-white/10 border border-white/15">{k}</kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-3 border-t border-white/8 text-center text-[10px] text-gray-700">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-gray-400">?</kbd> anywhere to toggle this guide
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
