"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle, AlertTriangle, Zap, Bot, RefreshCw, Ship } from "lucide-react";
import { apiFetch } from "@/lib/api";

type NotifItem = {
  id: string; type: "success" | "warning" | "ai" | "info";
  title: string; body: string; time: string; read: boolean;
};

const TYPE_CFG = {
  success: { icon: CheckCircle, color: "#10b981", label: "Resolved" },
  warning: { icon: AlertTriangle, color: "#f97316", label: "Alert" },
  ai:      { icon: Bot,          color: "#a855f7", label: "AI" },
  info:    { icon: Ship,         color: "#3b82f6", label: "Update" },
};

function buildNotifs(log: any[], fleet: any): NotifItem[] {
  const items: NotifItem[] = [];
  const ships = fleet?.ships || [];
  const atRisk = ships.filter((s: any) => s.status === "at-risk" || s.status === "delayed");
  const rerouted = ships.filter((s: any) => s.status === "rerouted");

  rerouted.slice(0, 3).forEach((s: any, i: number) => items.push({
    id: `r${i}`, type: "success", read: false,
    title: `${s.name} rerouted`, body: `AI optimized route from ${s.origin} — ETA secured, $45K saved.`,
    time: `${i * 3 + 2}m ago`,
  }));
  atRisk.slice(0, 2).forEach((s: any, i: number) => items.push({
    id: `a${i}`, type: "warning", read: true,
    title: `${s.name} at risk`, body: `Risk score ${s.risk_score}/100 · Cargo: ${s.cargo}. Review routing options.`,
    time: `${i * 5 + 8}m ago`,
  }));
  (log || []).slice(-3).forEach((l: any, i: number) => items.push({
    id: `l${i}`, type: "ai", read: true,
    title: "AI optimization completed", body: l.recommendation || "Route optimized — reduced risk and CO₂ impact.",
    time: `${i * 12 + 15}m ago`,
  }));
  if (items.length === 0) items.push({
    id: "d0", type: "info", read: true,
    title: "Fleet all clear", body: "All 15 vessels operating on schedule. No active alerts.",
    time: "Just now",
  });
  return items.slice(0, 6);
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [log, fleet] = await Promise.all([apiFetch("/optimization-log"), apiFetch("/fleet")]);
      setNotifs(buildNotifs(log, fleet));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const unread = notifs.filter(n => !n.read).length;
  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white" title="Notifications">
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center animate-pulse">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[340px] z-[95] flex flex-col border-l border-white/10 shadow-2xl"
              style={{ background: "rgba(6,8,24,0.98)", backdropFilter: "blur(24px)" }}>

              {/* Header */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white flex items-center gap-2"><Bell size={14} /> Notifications</h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-600 hover:text-white transition-all">
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  </button>
                  {unread > 0 && <button onClick={markAll} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-2 py-1 rounded-lg hover:bg-blue-500/10">Mark all read</button>}
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/8 text-gray-600 hover:text-white transition-all"><X size={14} /></button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto">
                {loading && notifs.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                    <p className="text-xs text-gray-600">Loading notifications...</p>
                  </div>
                )}
                {notifs.map((n, i) => {
                  const cfg = TYPE_CFG[n.type];
                  return (
                    <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex gap-3 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer ${!n.read ? "bg-white/3" : ""}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.color + "20" }}>
                        <cfg.icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between mb-0.5">
                          <p className="text-xs font-bold text-white truncate">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{n.body}</p>
                        <p className="text-[9px] text-gray-700 mt-1.5">{n.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-white/8 text-center">
                <p className="text-[10px] text-gray-700">Auto-synced from live fleet telemetry</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
