"use client";
import { useState, useRef } from "react";
import { requestOptimization, analyzeVision } from "@/lib/api";
import {
  AlertCircle, Zap, Check, Upload, Image as ImageIcon,
  ChevronDown, ChevronUp, Bot, Clock, Ship, Anchor, Eye, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Config ─────────────────────────────────────────────────── */
const SEV: Record<string, { bar: string; badge: string; badgeBg: string; text: string; cardBg: string; cardBorder: string }> = {
  High: {
    bar: "#ef4444",
    badge: "text-red-300",
    badgeBg: "bg-red-500/15 border-red-500/30",
    text: "text-red-300",
    cardBg: "bg-red-950/20",
    cardBorder: "border-red-500/25",
  },
  Medium: {
    bar: "#f97316",
    badge: "text-orange-300",
    badgeBg: "bg-orange-500/15 border-orange-500/30",
    text: "text-orange-300",
    cardBg: "bg-orange-950/20",
    cardBorder: "border-orange-500/25",
  },
  Low: {
    bar: "#3b82f6",
    badge: "text-blue-300",
    badgeBg: "bg-blue-500/15 border-blue-500/30",
    text: "text-blue-300",
    cardBg: "bg-blue-950/20",
    cardBorder: "border-blue-500/25",
  },
};

const TYPE_ICONS: Record<string, any> = {
  "Port Congestion": Anchor,
  "Transit Risk": Ship,
  "Satellite Anomaly": Eye,
  "Visual Anomaly": Eye,
  "Weather Injection: Typhoon": AlertCircle,
};

function timeAgo(ts: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(ts + (ts.endsWith("Z") ? "" : "Z")).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  } catch { return "just now"; }
}

/* ─── Component ──────────────────────────────────────────────── */
export default function AlertsPanel({ alerts, onOptimized }: { alerts: any[]; onOptimized: () => void }) {
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleOptimize = async (shipId: string, alertId: string) => {
    try {
      setOptimizing(alertId);
      const res = await requestOptimization(shipId);
      if (res.status === "success") {
        setSuccess(alertId);
        onOptimized();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (e) { console.error(e); }
    finally { setOptimizing(null); }
  };

  const handleVision = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result?.toString().split(",")[1];
      if (b64) { try { await analyzeVision(b64); onOptimized(); } catch {} }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const highCount = alerts.filter(a => a.severity === "High").length;
  const medCount  = alerts.filter(a => a.severity === "Medium").length;

  return (
    <div className="glass-panel h-[580px] flex flex-col overflow-hidden rounded-2xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/25">
              <AlertTriangle size={15} className="text-red-400" />
            </div>
            {highCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                {highCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Disruption Alerts</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {alerts.length} active
              {highCount > 0 && <span className="text-red-400 ml-1.5">· {highCount} critical</span>}
              {medCount > 0  && <span className="text-orange-400 ml-1.5">· {medCount} medium</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleVision} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {uploading
              ? <><span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /> Scanning...</>
              : <><Upload size={11} /> Vision Scan</>
            }
          </button>
        </div>
      </div>

      {/* ── Severity summary bar ── */}
      {alerts.length > 0 && (
        <div className="px-5 py-2 border-b border-white/5 shrink-0 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/5 flex gap-0.5">
            {highCount > 0 && <div className="h-full bg-red-500 rounded-full" style={{ width: `${(highCount / alerts.length) * 100}%` }} />}
            {medCount > 0  && <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(medCount / alerts.length) * 100}%` }} />}
            <div className="h-full bg-blue-500 rounded-full flex-1" />
          </div>
          <span className="text-[9px] text-gray-600 whitespace-nowrap">{alerts.length} events</span>
        </div>
      )}

      {/* ── Alert list ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Check size={28} className="text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-semibold text-sm">All Clear</p>
              <p className="text-gray-600 text-xs mt-1">No active disruptions detected</p>
            </motion.div>
          ) : alerts.map((alert, idx) => {
            const cfg        = SEV[alert.severity] || SEV.Medium;
            const isExpanded = expanded === alert.id;
            const isDone     = success === alert.id;
            const isWorking  = optimizing === alert.id;
            const isAuto     = alert.message?.startsWith("[AUTO-PILOT");
            const Icon       = TYPE_ICONS[alert.type] || AlertCircle;
            const cleanMsg   = isAuto ? alert.message.replace("[AUTO-PILOT] ", "") : alert.message;

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, height: 0 }}
                transition={{ duration: 0.22, delay: idx < 6 ? idx * 0.03 : 0 }}
                className={`rounded-xl overflow-hidden border ${cfg.cardBorder} ${cfg.cardBg} shadow-md`}
              >
                {/* Card body */}
                <button
                  className="w-full p-3 text-left flex items-start gap-3 hover:bg-white/3 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : alert.id)}
                >
                  {/* Left: colored accent bar + icon */}
                  <div className="flex items-stretch gap-2 shrink-0">
                    <div className="w-0.5 self-stretch rounded-full" style={{ background: cfg.bar }} />
                    <div className="p-1.5 rounded-lg mt-0.5" style={{ background: cfg.bar + "20" }}>
                      <Icon size={13} style={{ color: cfg.bar }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                          {alert.type}
                        </span>
                        {isAuto && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border text-emerald-300 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                            <Bot size={8} /> Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 shrink-0">
                        <Clock size={9} />
                        <span className="text-[9px]">{timeAgo(alert.timestamp)}</span>
                      </div>
                    </div>

                    {/* Message — fully readable */}
                    <p className="text-[11px] text-gray-200 leading-relaxed font-medium line-clamp-2">
                      {cleanMsg}
                    </p>

                    {/* Entity ref */}
                    {alert.related_entity && (
                      <p className="text-[9px] font-mono text-gray-600 mt-1">
                        ID: {alert.related_entity}
                      </p>
                    )}
                  </div>

                  {/* Expand arrow */}
                  <div className="shrink-0 mt-1">
                    {isExpanded
                      ? <ChevronUp size={13} className="text-gray-500" />
                      : <ChevronDown size={13} className="text-gray-500" />}
                  </div>
                </button>

                {/* Expanded section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/6 overflow-hidden"
                    >
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 leading-relaxed mb-3">{cleanMsg}</p>
                        {alert.actionable && alert.ship_id && (
                          <button
                            onClick={() => handleOptimize(alert.ship_id, alert.id)}
                            disabled={isWorking || isDone}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isDone
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                : "btn-primary"
                            }`}
                          >
                            {isDone ? (
                              <><Check size={13} /> Route Optimized</>
                            ) : isWorking ? (
                              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gemini AI Optimizing...</>
                            ) : (
                              <><Zap size={13} /> AI Reroute Recommendation</>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-2 border-t border-white/5 bg-black/20 shrink-0 flex items-center justify-between">
        <p className="text-[10px] text-gray-700">Click alert to expand · Upload image for AI scan</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-gray-700">AI Monitoring Live</span>
        </div>
      </div>
    </div>
  );
}
