"use client";
import { useEffect, useState } from "react";
import { fetchPorts, fetchFleet } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { Anchor, Ship, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  "Clear":     { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  "Moderate":  { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/25" },
  "Congested": { text: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/25" },
};

export default function PortsPage() {
  const [ports, setPorts] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try {
      const [pRes, fRes] = await Promise.all([fetchPorts(), fetchFleet()]);
      setPorts(pRes?.ports || []);
      setShips(fRes?.ships || []);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const getIncoming = (portId: string) => ships.filter(s => s.destination === portId);
  const getOutgoing = (portId: string) => ships.filter(s => s.origin === portId && s.status !== "rerouted");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Anchor size={24} className="text-blue-400"/> Port Operations Center</h1>
          <p className="text-gray-500 mt-1">{ports.length} global ports monitored · Click any port for detailed operations view</p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Clear Ports",     value: ports.filter(p => p.status === "Clear").length,     color: "#10b981" },
            { label: "Moderate Traffic", value: ports.filter(p => p.status === "Moderate").length,  color: "#f59e0b" },
            { label: "Congested",       value: ports.filter(p => p.status === "Congested").length, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="glass-panel rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              <div className="mt-2 h-1 rounded-full" style={{ background: s.color, opacity: 0.5 }}/>
            </div>
          ))}
        </div>

        {/* Port cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ports.map((port, idx) => {
            const cfg = STATUS_COLORS[port.status] || STATUS_COLORS["Clear"];
            const util = Math.round((port.current_load / port.capacity) * 100);
            const incoming = getIncoming(port.id);
            const outgoing = getOutgoing(port.id);

            return (
              <motion.div key={port.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                onClick={() => setSelected(selected?.id === port.id ? null : port)}
                className={`glass-panel rounded-2xl p-5 cursor-pointer transition-all hover:border-blue-500/25 ${selected?.id === port.id ? "border border-blue-500/30 bg-blue-500/5" : "border border-white/8"}`}>

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{port.name}</h3>
                    <p className="text-[11px] text-gray-500">{port.full_name || port.name} · {port.country}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.bg} ${cfg.border}`}>
                    {port.status}
                  </span>
                </div>

                {/* Utilization bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-600">Capacity</span>
                    <span className={cfg.text + " font-bold"}>{util}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${util}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      style={{ background: util >= 85 ? "#ef4444" : util >= 60 ? "#f59e0b" : "#10b981" }}/>
                  </div>
                  <p className="text-[10px] text-gray-700 mt-1">{port.current_load} / {port.capacity} units</p>
                </div>

                {/* Vessel counts */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="glass-bright rounded-lg p-2">
                    <p className="text-sm font-black text-blue-300">{incoming.length}</p>
                    <p className="text-[9px] text-gray-600">Incoming</p>
                  </div>
                  <div className="glass-bright rounded-lg p-2">
                    <p className="text-sm font-black text-emerald-300">{outgoing.length}</p>
                    <p className="text-[9px] text-gray-600">Outgoing</p>
                  </div>
                  <div className="glass-bright rounded-lg p-2">
                    <p className="text-sm font-black text-orange-300">{incoming.filter(s => s.status === "delayed").length}</p>
                    <p className="text-[9px] text-gray-600">Delayed</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected port detail */}
        {selected && (() => {
          const incoming = getIncoming(selected.id);
          const cfg = STATUS_COLORS[selected.status] || STATUS_COLORS["Clear"];
          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-white">{selected.full_name || selected.name}</h2>
                  <p className="text-gray-500 text-sm">{selected.region} · {selected.country}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-xl">×</button>
              </div>

              {incoming.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Ship size={12}/> Inbound Vessels ({incoming.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {incoming.map(ship => (
                      <div key={ship.id} className="glass-bright rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-bold text-white">{ship.name}</span>
                          <span className={`text-[10px] font-bold ${ship.status === "at-risk" ? "text-orange-400" : ship.status === "delayed" ? "text-red-400" : ship.status === "rerouted" ? "text-blue-400" : "text-emerald-400"}`}>{ship.status}</span>
                        </div>
                        <p className="text-gray-600">Cargo: {ship.cargo}</p>
                        <p className="text-gray-600">ETA: {ship.eta} {ship.delay_hours > 0 ? `(+${ship.delay_hours}h)` : ""}</p>
                        <p className="text-gray-600">Value: ${((ship.cargo_value_usd||0)/1e6).toFixed(1)}M</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No vessels currently bound for this port.</p>
              )}
            </motion.div>
          );
        })()}
      </main>
      <ChatWidget />
    </div>
  );
}
