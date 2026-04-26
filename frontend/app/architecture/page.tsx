"use client";
import { motion } from "framer-motion";
import { Database, Brain, Zap, Globe2, ArrowRight, Bot, AlertTriangle, RefreshCw, Leaf } from "lucide-react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";

const AGENTS = [
  { id: "weather", label: "Weather Agent",   icon: AlertTriangle, color: "#f97316", desc: "Monitors 5 global weather zones, triggers alerts when ships enter danger radius" },
  { id: "risk",    label: "Risk Agent",       icon: Brain,         color: "#a855f7", desc: "Computes real-time 0–100 risk scores per vessel using 8 signals" },
  { id: "route",   label: "Route Agent",      icon: RefreshCw,     color: "#3b82f6", desc: "Calls Gemini function calling to select optimal alternative ports" },
  { id: "carbon",  label: "Sustainability Agent", icon: Leaf,      color: "#10b981", desc: "Calculates CO₂ savings and carbon credit value for each reroute" },
];

const LAYERS = [
  {
    id: "ingestion",
    label: "Data Ingestion Layer",
    color: "#3b82f6",
    icon: Globe2,
    items: ["AIS Vessel Tracking", "Weather Event APIs", "Port Authority Systems", "Cargo Manifests"],
  },
  {
    id: "ai",
    label: "Gemini AI Engine",
    color: "#a855f7",
    icon: Brain,
    items: ["gemini-3-flash", "Function Calling", "Vision API (Satellite)", "Executive Summary"],
  },
  {
    id: "action",
    label: "Action & Alert Layer",
    color: "#10b981",
    icon: Zap,
    items: ["Auto-Pilot Rerouting", "WebSocket Push", "CO₂ Tracking", "SQLite Persistence"],
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-3xl font-black gradient-text mb-2">Multi-Agent AI Architecture</h1>
          <p className="text-gray-500 text-sm">How Gemini 3 orchestrates 4 specialized agents to preemptively protect global supply chains</p>
        </div>

        {/* Pipeline Diagram */}
        <div className="glass-panel rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
            {LAYERS.map((layer, idx) => (
              <div key={layer.id} className="flex items-center gap-4 flex-col md:flex-row">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="rounded-2xl p-5 border text-center w-56"
                  style={{ borderColor: `${layer.color}30`, background: `${layer.color}10` }}
                >
                  <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${layer.color}20` }}>
                    <layer.icon size={20} style={{ color: layer.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-3">{layer.label}</h3>
                  <div className="flex flex-col gap-1.5">
                    {layer.items.map(item => (
                      <div key={item} className="text-[11px] text-gray-400 bg-black/20 rounded-lg px-2 py-1">{item}</div>
                    ))}
                  </div>
                </motion.div>
                {idx < LAYERS.length - 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.15 + 0.2 }}>
                    <ArrowRight size={28} className="text-gray-600 hidden md:block" />
                    <div className="w-px h-8 bg-gray-700 md:hidden mx-auto" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent Cards */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 text-center">Specialized AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AGENTS.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="glass-panel rounded-2xl p-5 border hover:scale-[1.02] transition-transform"
                style={{ borderColor: `${agent.color}25` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${agent.color}15`, color: agent.color }}>
                  <agent.icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{agent.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{agent.desc}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
                  <span className="text-[10px]" style={{ color: agent.color }}>Active</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Gemini Function Calling Diagram */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2"><Bot size={16} className="text-purple-400" /> Gemini Function Calling Flow</h2>
          <div className="flex flex-col md:flex-row gap-3 items-stretch justify-center">
            {[
              { step: "1", label: "User Query", desc: "Natural language question", color: "#3b82f6" },
              { step: "2", label: "Tool Selection", desc: "Gemini picks the right function", color: "#a855f7" },
              { step: "3", label: "Function Exec", desc: "Backend executes real data call", color: "#f97316" },
              { step: "4", label: "AI Synthesis", desc: "Gemini generates grounded answer", color: "#10b981" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-3 flex-1">
                <div className="flex-1 rounded-xl p-4 border text-center" style={{ borderColor: `${s.color}25`, background: `${s.color}08` }}>
                  <div className="w-7 h-7 rounded-full text-xs font-black flex items-center justify-center mx-auto mb-2" style={{ background: s.color, color: "#fff" }}>{s.step}</div>
                  <p className="text-xs font-bold text-white">{s.label}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{s.desc}</p>
                </div>
                {i < 3 && <ArrowRight size={18} className="text-gray-700 shrink-0 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Full Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { category: "AI / ML", items: ["Gemini 3 Flash", "Function Calling", "Vision API", "Agentic Auto-Pilot"] },
              { category: "Backend", items: ["FastAPI (Python)", "WebSocket", "SQLite + aiosqlite", "Pydantic v2"] },
              { category: "Frontend", items: ["Next.js 16 (App Router)", "react-globe.gl", "Chart.js", "Framer Motion"] },
              { category: "DevOps", items: ["Docker + Compose", "Google Cloud Run", "GitHub CI/CD", "Health Checks"] },
            ].map(col => (
              <div key={col.category} className="glass-bright rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">{col.category}</p>
                <div className="flex flex-col gap-2">
                  {col.items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <ChatWidget />
    </div>
  );
}
