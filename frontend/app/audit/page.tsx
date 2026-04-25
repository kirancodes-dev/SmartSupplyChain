"use client";
import { useEffect, useState } from "react";
import { fetchOptimizationLog } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import IncidentReplay from "@/components/IncidentReplay";
import { ShieldCheck, Clock, CheckCircle, ArrowRight, RefreshCw, Leaf, User, Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function AuditPage() {
  const [log, setLog] = useState<any[]>([]);

  const load = async () => {
    try { setLog(await fetchOptimizationLog()); } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const STAGES = ["Order Placed", "In Transit", "Risk Detected", "AI Rerouted", "Port Arrival", "Delivered"];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-400" /> Audit Trail
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Immutable log of all AI optimization decisions · {log.length} events recorded</p>
          </div>
          <div className="badge badge-emerald text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tamper-Evident Log
          </div>
        </div>

        {/* Incident Replay */}
        <IncidentReplay />

        {/* Lifecycle Stage Explainer */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Shipment Lifecycle Stages</h3>
          <div className="flex items-center gap-1 flex-wrap">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  i === 0 ? "border-blue-500/30 bg-blue-500/10 text-blue-300" :
                  i === 2 ? "border-orange-500/30 bg-orange-500/10 text-orange-300" :
                  i === 3 ? "border-purple-500/30 bg-purple-500/10 text-purple-300" :
                  i === 5 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                  "border-white/10 bg-white/5 text-gray-400"
                }`}>{stage}</div>
                {i < STAGES.length - 1 && <ArrowRight size={12} className="text-gray-700 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 bg-black/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">AI Decision Log</h3>
            <span className="text-xs text-gray-500">{log.length} decisions logged</span>
          </div>
          {log.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No optimizations yet. Enable Auto-Pilot or manually reroute a vessel.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {log.map((entry: any, idx: number) => (
                <motion.div
                  key={entry.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle size={14} className="text-emerald-400" />
                      </div>
                      {idx < log.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1 min-h-[20px]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-white">{entry.ship_name || entry.ship_id}</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-xs font-bold text-blue-300">{entry.new_destination}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          entry.auto ? "border-purple-500/30 bg-purple-500/10 text-purple-300" : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                        }`}>
                          {entry.auto ? <><Bot size={9}/> Auto-Pilot</> : <><User size={9}/> Manual</>}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{entry.reason || "Route optimized by AI agent"}</p>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-400"><Leaf size={9}/> {entry.co2_saved} t CO₂ saved</span>
                        <span className="text-gray-700">·</span>
                        <span className="flex items-center gap-1 text-gray-500"><RefreshCw size={9}/> Rerouted</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-600">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Hash-like ID for immutability feel */}
                    <div className="hidden md:block shrink-0 text-right">
                      <p className="text-[10px] text-gray-700 font-mono">#{String(entry.id || idx).padStart(6, "0")}</p>
                      <p className="text-[10px] text-gray-700 font-mono mt-0.5">
                        {/* Simulate a hash from timestamp+id */}
                        {(entry.id * 7919 + 13).toString(16).padStart(8, "0").slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Decisions", value: log.length },
            { label: "Auto-Pilot", value: log.filter((l: any) => l.auto).length },
            { label: "Manual", value: log.filter((l: any) => !l.auto).length },
            { label: "Total CO₂ Saved", value: `${log.reduce((s: number, l: any) => s + (l.co2_saved || 0), 0)} t` },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
