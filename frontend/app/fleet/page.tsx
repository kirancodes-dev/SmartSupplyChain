"use client";
import { useEffect, useState, useMemo } from "react";
import { fetchFleet, requestOptimization, fetchMetrics } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import EmailDrafter from "@/components/EmailDrafter";
import { exportFleetCSV } from "@/lib/export";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Download, Mail } from "lucide-react";
import { Ship, ChevronUp, ChevronDown, Search, Filter, Zap, Check, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortKey = "name" | "status" | "risk_score" | "cargo_value_usd" | "eta" | "delay_hours";
type FilterStatus = "all" | "at-risk" | "delayed" | "on-time" | "rerouted";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  "on-time":  { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "On Time"  },
  "at-risk":  { color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20",   icon: AlertTriangle, label: "At Risk" },
  "delayed":  { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",          icon: Clock, label: "Delayed"  },
  "rerouted": { color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",         icon: RefreshCw, label: "Rerouted" },
};

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-orange-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 70 ? "text-red-400" : score >= 40 ? "text-orange-400" : "text-emerald-400"}`}>
        {score}
      </span>
    </div>
  );
}

export default function FleetPage() {
  const [fleet, setFleet] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [sortKey, setSortKey] = useState<SortKey>("risk_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [emailShip, setEmailShip] = useState<any>(null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const [f, m] = await Promise.all([fetchFleet(), fetchMetrics()]);
      setFleet(f);
      setMetrics(m);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  const ships: any[] = fleet?.ships || [];

  const filtered = useMemo(() => {
    let s = ships;
    if (filter !== "all") s = s.filter(v => v.status === filter);
    if (search) s = s.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.cargo.toLowerCase().includes(search.toLowerCase())
    );
    return [...s].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : (av - bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [ships, filter, search, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleOptimize = async (shipId: string) => {
    setOptimizing(shipId);
    try {
      await requestOptimization(shipId);
      setOptimized(prev => new Set(prev).add(shipId));
      await load();
    } catch {}
    setOptimizing(null);
  };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
    : <span className="w-3 h-3" />;

  const filters: FilterStatus[] = ["all", "at-risk", "delayed", "rerouted", "on-time"];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar metrics={metrics} />
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Ship size={22} className="text-blue-400" /> Fleet Management
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{ships.length} vessels tracked globally</p>
          </div>
          {/* Summary badges */}
          <div className="flex gap-2 flex-wrap items-center">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = ships.filter(s => s.status === key).length;
              return (
                <button key={key} onClick={() => setFilter(filter === key ? "all" : key as FilterStatus)}
                  className={`badge text-[11px] cursor-pointer transition-all ${filter === key ? cfg.bg + " border" : "badge-blue opacity-60 hover:opacity-100"}`}>
                  {count} {cfg.label}
                </button>
              );
            })}
            <button
              onClick={() => exportFleetCSV(ships)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all ml-2"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search vessel, ID, or cargo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="chat-input pl-9 py-2 text-sm rounded-xl"
            />
          </div>
          <div className="flex gap-1.5">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${filter === f ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/5 text-gray-500 hover:text-gray-300"}`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-auto">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-gray-600 uppercase tracking-wider text-[10px]">
                  {[
                    { key: "name" as SortKey, label: "Vessel" },
                    { key: "status" as SortKey, label: "Status" },
                    { key: "risk_score" as SortKey, label: "Risk Score" },
                    { key: "cargo_value_usd" as SortKey, label: "Cargo Value" },
                    { key: "eta" as SortKey, label: "ETA" },
                    { key: "delay_hours" as SortKey, label: "Delay" },
                  ].map(col => (
                    <th key={col.key} className="text-left px-4 py-3 font-semibold cursor-pointer hover:text-gray-300 select-none" onClick={() => handleSort(col.key)}>
                      <span className="flex items-center gap-1">{col.label} <SortIcon k={col.key} /></span>
                    </th>
                  ))}
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((ship, idx) => {
                    const cfg = STATUS_CONFIG[ship.status] || STATUS_CONFIG["on-time"];
                    const Icon = cfg.icon;
                    const isOpt = optimized.has(ship.id);
                    const isOptimizing = optimizing === ship.id;
                    return (
                      <motion.tr
                        key={ship.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        onClick={() => setSelected(selected?.id === ship.id ? null : ship)}
                        className={`border-b border-white/5 cursor-pointer hover:bg-white/4 transition-colors ${selected?.id === ship.id ? "bg-blue-500/8" : idx % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{ship.name}</p>
                          <p className="text-gray-600">{ship.id} · {ship.vessel_type}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3"><RiskBar score={ship.risk_score || 0} /></td>
                        <td className="px-4 py-3 text-blue-300 font-semibold">
                          ${((ship.cargo_value_usd || 0) / 1e6).toFixed(1)}M
                        </td>
                        <td className="px-4 py-3 text-gray-400">{ship.eta}</td>
                        <td className="px-4 py-3">
                          {ship.delay_hours > 0
                            ? <span className="text-red-400 font-bold">{ship.delay_hours}h late</span>
                            : <span className="text-gray-600">—</span>
                          }
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          {(ship.status === "at-risk" || ship.status === "delayed") && !isOpt ? (
                            <button
                              onClick={() => handleOptimize(ship.id)}
                              disabled={isOptimizing}
                              className="btn-primary py-1.5 px-3 text-[11px] flex items-center gap-1.5"
                            >
                              {isOptimizing ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Optimizing</> : <><Zap size={11} /> Reroute</>}
                            </button>
                          ) : isOpt ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold"><Check size={11} /> Done</span>
                          ) : (
                            <span className="text-gray-600 text-[11px]">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-600">No vessels match your search.</div>
            )}
          </div>
        </div>

        {/* Selected ship detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-panel rounded-2xl p-5 border border-blue-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{selected.name}</h3>
                  <p className="text-gray-500 text-sm">{selected.company} · Flag: {selected.flag}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(selected.status === "at-risk" || selected.status === "delayed" || selected.status === "rerouted") && (
                    <button onClick={() => setEmailShip(selected)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all">
                      <Mail size={12}/> Draft Email
                    </button>
                  )}
                  <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-xl">×</button>
                </div>
              </div>

              {/* Lifecycle stages */}
              {(() => {
                const STAGES = ["Order Placed", "In Transit", "Port Arrival", "Customs", "Delivered"];
                const activeIdx = selected.status === "rerouted" ? 2 : selected.status === "at-risk" ? 1 : selected.status === "delayed" ? 1 : 2;
                return (
                  <div className="mb-4 flex items-center gap-1 flex-wrap">
                    {STAGES.map((s, i) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${i < activeIdx ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : i === activeIdx ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/8 bg-white/4 text-gray-600"}`}>{s}</div>
                        {i < STAGES.length - 1 && <ArrowRight size={10} className="text-gray-700 shrink-0" />}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-4">
                {/* Details */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: "Cargo Type", value: selected.cargo },
                    { label: "Cargo Value", value: `$${((selected.cargo_value_usd||0)/1e6).toFixed(1)}M` },
                    { label: "Speed", value: `${selected.speed_knots} knots` },
                    { label: "Vessel Type", value: selected.vessel_type },
                    { label: "Origin", value: selected.origin },
                    { label: "Destination", value: selected.destination },
                    { label: "Position", value: `${selected.lat?.toFixed(2)}°, ${selected.lng?.toFixed(2)}°` },
                    { label: "Risk Score", value: `${selected.risk_score || 0}/100` },
                  ].map(item => (
                    <div key={item.label} className="glass-bright p-3 rounded-xl">
                      <p className="text-gray-600 uppercase tracking-wider text-[10px]">{item.label}</p>
                      <p className="text-white font-bold mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* QR Code */}
                <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG
                      value={`http://localhost:3000/track/${selected.id}`}
                      size={90}
                      bgColor="#ffffff"
                      fgColor="#060818"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 text-center">Scan to track live</p>
                  <p className="text-[9px] text-gray-700 font-mono">{selected.id}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      <ChatWidget />
      <AnimatePresence>
        {emailShip && <EmailDrafter ship={emailShip} onClose={() => setEmailShip(null)} />}
      </AnimatePresence>
    </div>
  );
}
