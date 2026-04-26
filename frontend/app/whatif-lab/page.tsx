"use client";
import { useState, useRef, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Send, Zap, Bot, Clock, AlertTriangle, Shield, CheckCircle, Leaf, Search, BrainCircuit, RefreshCw, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/api";

const PRESETS = [
  "What if a geopolitical conflict closes the South China Sea and my sustainability score must stay above 85?",
  "What if a Category 5 typhoon hits the Port of Manila and we need to reroute all high-value tech cargo?",
  "What if the Panama Canal water levels drop by 2 meters and draft limits are reduced?",
  "What if a labor strike hits the US West Coast ports starting tomorrow?"
];

type ScenarioResult = {
  scenario_title: string;
  scenario_summary: string;
  probability_estimate: number;
  affected_ships: string[];
  affected_routes: string[];
  council_debate: { agent: string; icon: string; position: string; recommendation: string; confidence: number }[];
  consensus_action: string;
  timeline: string;
  impact: { cost_delta_usd: number; time_delta_hours: number; co2_delta_tons: number; risk_delta_percent: number; esg_score_impact: number; ships_rerouted: number; cargo_at_risk_usd: number };
  alternative_scenarios: string[];
  confidence_score: number;
};

export default function WhatIfLabPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const runScenario = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch("/whatif-lab", { method: "POST", body: JSON.stringify({ query: q, constraints: {} }) });
      setResult(res.result);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Beaker size={26} className="text-blue-400" /> What-If Lab</h1>
          <p className="text-gray-500 mt-1">Simulate infinite supply chain disruptions using natural language. Watch the AI Multi-Agent Council debate and form a consensus.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Input Panel */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all focus-within:border-blue-500/40">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Search size={14} /> Define Scenario
              </label>
              <textarea
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g., What if the Suez Canal is blocked for 3 weeks?"
                className="w-full bg-transparent text-white placeholder:text-gray-600 outline-none resize-none h-32 text-lg"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runScenario(query); } }}
              />
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
                <span className="text-[10px] text-gray-600">Press Enter to simulate</span>
                <button onClick={() => runScenario(query)} disabled={loading || !query.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Run
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">⚡ Preset Scenarios</p>
              <div className="flex flex-col gap-2">
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => runScenario(p)} disabled={loading}
                    className="p-3 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all line-clamp-2 leading-relaxed">
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:w-2/3">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-5 p-20 min-h-[500px]">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <BrainCircuit size={32} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white mb-1">Multi-Agent Council Debating</h3>
                    <p className="text-sm text-gray-500">Navigator, Economist, ESG Officer, and Risk Analyst are analyzing your scenario...</p>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-6">
                  
                  {/* Header */}
                  <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Beaker size={120} /></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">SCENARIO GENERATED</span>
                        <span className="text-[10px] text-gray-500 font-mono">Conf: {Math.round(result.confidence_score * 100)}%</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{result.scenario_title}</h2>
                      <p className="text-gray-400 leading-relaxed max-w-2xl">{result.scenario_summary}</p>
                    </div>
                  </div>

                  {/* Impact Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Cargo at Risk", value: `$${(result.impact.cargo_at_risk_usd / 1e6).toFixed(1)}M`, icon: AlertTriangle, color: "#f97316" },
                      { label: "Cost Delta", value: `+$${(result.impact.cost_delta_usd / 1e6).toFixed(1)}M`, icon: DollarSign, color: "#ef4444" },
                      { label: "ETA Impact", value: `+${result.impact.time_delta_hours}h`, icon: Clock, color: "#f59e0b" },
                      { label: "CO₂ Impact", value: `+${result.impact.co2_delta_tons}t`, icon: Leaf, color: "#10b981" },
                    ].map((m, i) => (
                      <div key={i} className="glass-panel rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-500">
                          <m.icon size={14} style={{ color: m.color }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                        </div>
                        <p className="text-xl font-black text-white">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Council Debate */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4"><Bot size={16} className="text-purple-400" /> Multi-Agent Council Debate</h3>
                    <div className="flex flex-col gap-4">
                      {result.council_debate.map((agent, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/20 flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl shrink-0">{agent.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-black text-white">{agent.agent}</p>
                              <span className="text-[9px] text-gray-600 border border-white/10 px-1.5 py-0.5 rounded-md">Conf: {Math.round(agent.confidence * 100)}%</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{agent.position}</p>
                            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5"><CheckCircle size={12} /> {agent.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consensus Action */}
                  <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-emerald-500" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.1) 0%, rgba(6,8,24,0) 100%)" }}>
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-wider flex items-center gap-2 mb-2"><Shield size={14} /> Consensus Action Plan</h3>
                    <p className="text-sm text-white leading-relaxed">{result.consensus_action}</p>
                  </div>

                </motion.div>
              )}

              {!result && !loading && (
                <div className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-4 p-20 min-h-[500px] text-center border-dashed border-white/10">
                  <Beaker size={48} className="text-gray-700" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-500">The Lab is Ready</h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-md">Type a scenario on the left to see how the AI Council handles the crisis.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
