"use client";
import { useState, useRef } from "react";
import { requestOptimization, analyzeVision } from "@/lib/api";
import {
  AlertCircle, Zap, Check, Upload,
  ChevronDown, ChevronUp, Bot, Clock, Ship, Anchor, Eye, AlertTriangle, MapPin, Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Config ─────────────────────────────────────────────────── */
const SEV: Record<string, { bar: string; badge: string; badgeBg: string; text: string; cardBg: string; cardBorder: string }> = {
  High: {
    bar: "#ef4444",
    badge: "text-red-200",
    badgeBg: "bg-red-500/20 border-red-400/40",
    text: "text-red-300",
    cardBg: "bg-red-900/15",
    cardBorder: "border-red-500/30",
  },
  Medium: {
    bar: "#f97316",
    badge: "text-orange-200",
    badgeBg: "bg-orange-500/20 border-orange-400/40",
    text: "text-orange-300",
    cardBg: "bg-orange-900/12",
    cardBorder: "border-orange-500/25",
  },
  Low: {
    bar: "#3b82f6",
    badge: "text-blue-200",
    badgeBg: "bg-blue-500/20 border-blue-400/40",
    text: "text-blue-300",
    cardBg: "bg-blue-900/10",
    cardBorder: "border-blue-500/20",
  },
};

const STATUS_COLORS: Record<string, string> = {
  "on-time":  "#10b981",
  "at-risk":  "#f97316",
  "delayed":  "#ef4444",
  "rerouted": "#3b82f6",
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

/* ─── Mini Route Map ─────────────────────────────────────────── */
function ShipRouteMap({ ship, destPort }: { ship: any; destPort: any }) {
  const W = 284, H = 130;
  const PAD = 24;

  const lats = [ship.lat ?? 35, destPort?.lat ?? 30];
  const lngs = [ship.lng ?? 120, destPort?.lng ?? 115];
  const latSpan = Math.max(12, Math.abs(lats[0] - lats[1]) * 1.6);
  const lngSpan = Math.max(20, Math.abs(lngs[0] - lngs[1]) * 1.6);
  const midLat = (lats[0] + lats[1]) / 2;
  const midLng = (lngs[0] + lngs[1]) / 2;
  const minLat = midLat - latSpan / 2;
  const maxLat = midLat + latSpan / 2;
  const minLng = midLng - lngSpan / 2;
  const maxLng = midLng + lngSpan / 2;

  const toXY = (lat: number, lng: number) => ({
    x: Math.round(PAD + ((lng - minLng) / (maxLng - minLng)) * (W - PAD * 2)),
    y: Math.round(PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - PAD * 2)),
  });

  const sXY = toXY(ship.lat ?? 35, ship.lng ?? 120);
  const pXY = destPort ? toXY(destPort.lat, destPort.lng) : { x: W - PAD, y: H / 2 };
  const col = STATUS_COLORS[ship.status] || "#3b82f6";
  const portName = destPort?.name?.split(" ")[0] || destPort?.id || "Dest";

  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/8" style={{ background: "#060e1f" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0d2a4a" />
            <stop offset="100%" stopColor="#04060f" />
          </radialGradient>
          <radialGradient id={`glow-${ship.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={col} stopOpacity="0.45" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean background */}
        <rect width={W} height={H} fill="url(#sg)" />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <g key={t}>
            <line x1={W * t} y1="0" x2={W * t} y2={H} stroke="#1e3a5f" strokeWidth="0.5" />
            <line x1="0" y1={H * t} x2={W} y2={H * t} stroke="#1e3a5f" strokeWidth="0.5" />
          </g>
        ))}

        {/* Equator hint (if visible) */}
        {minLat < 0 && maxLat > 0 && (
          <line x1="0" y1={toXY(0, midLng).y} x2={W} y2={toXY(0, midLng).y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="4,6" />
        )}

        {/* Route line */}
        <line x1={sXY.x} y1={sXY.y} x2={pXY.x} y2={pXY.y}
          stroke={col} strokeWidth="1.5" strokeDasharray="7,5" opacity="0.7" />

        {/* Port marker */}
        <circle cx={pXY.x} cy={pXY.y} r="9" fill="#0f2240" stroke="#3b82f6" strokeWidth="1.5" />
        <text x={pXY.x} y={pXY.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#60a5fa">⚓</text>
        <text x={pXY.x} y={pXY.y + 16} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.85)" fontWeight="700">{portName}</text>

        {/* Ship glow */}
        <circle cx={sXY.x} cy={sXY.y} r="20" fill={`url(#glow-${ship.id})`} />

        {/* Pulse ring animation */}
        <circle cx={sXY.x} cy={sXY.y} r="10" fill="none" stroke={col} strokeWidth="1" opacity="0.5">
          <animate attributeName="r" values="6;18;6" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Ship dot */}
        <circle cx={sXY.x} cy={sXY.y} r="5.5" fill={col} stroke="white" strokeWidth="1.5" />
        {/* Ship icon triangle */}
        <path d={`M ${sXY.x} ${sXY.y - 3} L ${sXY.x + 2.5} ${sXY.y + 2} L ${sXY.x - 2.5} ${sXY.y + 2} Z`} fill="white" opacity="0.9" />

        {/* Ship label */}
        <text x={sXY.x} y={sXY.y - 14} textAnchor="middle" fontSize="8.5" fill="white" fontWeight="800">{ship.name || ship.id}</text>

        {/* Coords + speed */}
        <text x="5" y={H - 5} fontSize="7" fill="rgba(100,116,139,0.8)" fontFamily="monospace">
          {(ship.lat ?? 0).toFixed(1)}°{(ship.lat ?? 0) >= 0 ? "N" : "S"} {(ship.lng ?? 0).toFixed(1)}°{(ship.lng ?? 0) >= 0 ? "E" : "W"}
        </text>
        {ship.speed_knots && (
          <text x={W - 5} y={H - 5} textAnchor="end" fontSize="7" fill="rgba(100,116,139,0.8)">
            {ship.speed_knots}kn
          </text>
        )}
      </svg>

      {/* Stats row below map */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/6 text-[10px]">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Navigation size={9} style={{ color: col }} />
          <span style={{ color: col }} className="font-bold uppercase">{ship.status}</span>
        </div>
        <div className="text-gray-500">
          <span className="text-white font-semibold">{ship.cargo || "Mixed Cargo"}</span>
        </div>
        {ship.cargo_value_usd && (
          <div className="text-emerald-400 font-bold">
            ${((ship.cargo_value_usd) / 1e6).toFixed(1)}M
          </div>
        )}
        {ship.eta && (
          <div className="text-blue-400">
            ETA {ship.eta}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────── */
export default function AlertsPanel({
  alerts,
  ships = [],
  ports = [],
  onOptimized,
}: {
  alerts: any[];
  ships?: any[];
  ports?: any[];
  onOptimized: () => void;
}) {
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExplain = async (alert: any) => {
    if (explanations[alert.id]) { setExplanations(p => ({ ...p, [alert.id]: "" })); return; }
    setExplaining(alert.id);
    const ship = ships.find(s => s.id === alert.ship_id);
    const shipCtx = ship ? ` Ship ${ship.name} at ${ship.lat?.toFixed(1)}°, ${ship.lng?.toFixed(1)}°, status: ${ship.status}.` : "";
    try {
      const res = await import("@/lib/api").then(m => m.chatWithAI(
        `In 2 concise sentences, explain the supply chain risk and recommended action for: [${alert.severity} ${alert.type}] ${alert.message}${shipCtx}`
      ));
      setExplanations(p => ({ ...p, [alert.id]: res.reply || "Analysis complete." }));
    } catch {
      setExplanations(p => ({ ...p, [alert.id]: "AI analysis temporarily unavailable." }));
    }
    setExplaining(null);
  };

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
            <p className="text-xs text-gray-500 mt-0.5">
              {alerts.length} active
              {highCount > 0 && <span className="text-red-400 font-semibold ml-1.5">· {highCount} critical</span>}
              {medCount > 0  && <span className="text-orange-400 font-semibold ml-1.5">· {medCount} medium</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleVision} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {uploading
              ? <><span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /> Scanning...</>
              : <><Upload size={12} /> Vision Scan</>
            }
          </button>
        </div>
      </div>

      {/* ── Severity bar ── */}
      {alerts.length > 0 && (
        <div className="px-5 py-2 border-b border-white/5 shrink-0 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5 flex gap-0.5">
            {highCount > 0 && <div className="h-full bg-red-500 rounded-full" style={{ width: `${(highCount / alerts.length) * 100}%` }} />}
            {medCount > 0  && <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(medCount / alerts.length) * 100}%` }} />}
            <div className="h-full bg-blue-500/60 rounded-full flex-1" />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{alerts.length} events</span>
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
            const matchedShip = ships.find(s => s.id === alert.ship_id);
            const destPort    = matchedShip ? ports.find(p => p.id === matchedShip.destination) : null;

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
                  className="w-full p-3 text-left flex items-start gap-3 hover:bg-white/4 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : alert.id)}
                >
                  {/* Left accent bar + icon */}
                  <div className="flex items-stretch gap-2 shrink-0">
                    <div className="w-1 self-stretch rounded-full" style={{ background: cfg.bar }} />
                    <div className="p-1.5 rounded-lg mt-0.5" style={{ background: cfg.bar + "20" }}>
                      <Icon size={14} style={{ color: cfg.bar }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                          {alert.type}
                        </span>
                        {isAuto && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border text-emerald-300 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1">
                            <Bot size={8} /> Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 shrink-0">
                        <Clock size={9} />
                        <span className="text-[10px]">{timeAgo(alert.timestamp)}</span>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-gray-200 leading-relaxed font-medium line-clamp-2">
                      {cleanMsg || "Alert detected — click to expand for details."}
                    </p>

                    {/* Ship badge (if matched) */}
                    {matchedShip && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin size={9} className="text-blue-400 shrink-0" />
                        <span className="text-[10px] font-bold text-blue-300">{matchedShip.name}</span>
                        <span className="text-[9px] text-gray-600">
                          {matchedShip.lat?.toFixed(1)}°, {matchedShip.lng?.toFixed(1)}°
                        </span>
                        {matchedShip.risk_score && (
                          <span className="ml-auto text-[9px] font-black" style={{ color: matchedShip.risk_score > 70 ? "#ef4444" : matchedShip.risk_score > 40 ? "#f97316" : "#10b981" }}>
                            Risk {matchedShip.risk_score}/100
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand arrow */}
                  <div className="shrink-0 mt-1">
                    {isExpanded
                      ? <ChevronUp size={14} className="text-gray-400" />
                      : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {/* ── Expanded section ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/8 overflow-hidden"
                    >
                      <div className="px-4 py-3 flex flex-col gap-3">

                        {/* Full message */}
                        <p className="text-xs text-gray-300 leading-relaxed">{cleanMsg}</p>

                        {/* Ship + Route Mini Map */}
                        {matchedShip && (
                          <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                              <Ship size={10} className="text-blue-400" /> Live Vessel Position
                            </p>
                            <ShipRouteMap ship={matchedShip} destPort={destPort} />
                          </div>
                        )}

                        {/* Gemini Explains */}
                        <button
                          onClick={() => handleExplain(alert)}
                          disabled={explaining === alert.id}
                          className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-60"
                        >
                          {explaining === alert.id
                            ? <><span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" /> Gemini Analyzing...</>
                            : <><Bot size={11} /> {explanations[alert.id] ? "Refresh AI Analysis" : "Ask Gemini to Explain"}</>}
                        </button>
                        {explanations[alert.id] && (
                          <div className="p-3 rounded-lg bg-purple-500/8 border border-purple-500/20">
                            <p className="text-xs text-purple-200 leading-relaxed">{explanations[alert.id]}</p>
                          </div>
                        )}

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
        <p className="text-[10px] text-gray-600">Click alert to see ship position · Vision scan for AI analysis</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-gray-600">AI Monitoring Live</span>
        </div>
      </div>
    </div>
  );
}
