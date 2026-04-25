"use client";
import { useState, useCallback } from "react";
import { whatIfAnalysis } from "@/lib/api";
import { Lightbulb, Loader2, Zap, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [
  "What if the Suez Canal is blocked for 2 weeks?",
  "What if a major typhoon hits the South China Sea tomorrow?",
  "What if China imposes export restrictions on semiconductors?",
  "What if fuel prices rise 40% due to Middle East conflict?",
  "What if a cyberattack disables port systems at Rotterdam?",
];

export default function WhatIfPanel() {
  const [scenario, setScenario] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (text?: string) => {
    const q = text || scenario;
    if (!q.trim()) return;
    setScenario(q);
    setLoading(true);
    setAnalysis("");
    try {
      const res = await whatIfAnalysis(q);
      setAnalysis(res.analysis || "Analysis unavailable.");
    } catch {
      setAnalysis("Analysis failed. Check backend connection.");
    }
    setLoading(false);
  }, [scenario]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-purple-500/15">
      <div className="px-5 py-3.5 border-b border-white/8 bg-gradient-to-r from-purple-500/8 to-indigo-500/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Lightbulb size={14} className="text-purple-400"/> What-If Scenario Analyzer</h3>
        <p className="text-[11px] text-gray-500">Ask Gemini to analyze any hypothetical supply chain disruption</p>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p} onClick={() => run(p)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/4 text-gray-500 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all text-left truncate max-w-[200px]"
              title={p}>{p.slice(0, 40)}...</button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input value={scenario} onChange={e => setScenario(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
            placeholder="Type your own scenario: What if..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 focus:bg-purple-500/5 transition-all" />
          <button onClick={() => run()} disabled={loading || !scenario.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
            {loading ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
            Analyze
          </button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 glass-bright rounded-xl p-4 border border-purple-500/15">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin shrink-0"/>
              <p className="text-xs text-gray-500">Gemini analyzing cascading supply chain impacts...</p>
            </motion.div>
          )}
          {analysis && !loading && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-bright rounded-xl p-4 border border-purple-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} className="text-purple-400"/>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider">AI Impact Analysis</p>
              </div>
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{analysis}</pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
