"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchFleet } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Globe2, Ship, ArrowRight, AlertTriangle, CheckCircle, RefreshCw, Clock, Wifi, ArrowLeft } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  "on-time":  { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle, label: "On Time" },
  "at-risk":  { color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20",   icon: AlertTriangle, label: "At Risk" },
  "delayed":  { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",          icon: Clock, label: "Delayed" },
  "rerouted": { color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",        icon: RefreshCw, label: "Rerouted" },
};

const STAGES = ["Order Placed", "In Transit", "Port Arrival", "Customs Clearance", "Delivered"];

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const [ship, setShip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = async () => {
    try {
      const data = await fetchFleet();
      const found = data?.ships?.find((s: any) => s.id === id);
      setShip(found || null);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  const gradText = { background: "linear-gradient(135deg, #3b82f6, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#060818" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading vessel data...</p>
      </div>
    </div>
  );

  if (!ship) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#060818" }}>
      <div className="text-center">
        <Ship size={48} className="text-gray-700 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Vessel Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">No vessel found with ID: <code className="text-blue-400">{id}</code></p>
        <Link href="/fleet" className="text-blue-400 text-sm hover:underline flex items-center gap-1 justify-center"><ArrowLeft size={14}/> Back to Fleet</Link>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[ship.status] || STATUS_CONFIG["on-time"];
  const Icon = cfg.icon;
  const activeStageIdx = ship.status === "rerouted" ? 2 : ship.status === "at-risk" ? 1 : ship.status === "delayed" ? 1 : 2;
  const trackingUrl = typeof window !== "undefined" ? window.location.href : `http://localhost:3000/track/${id}`;

  return (
    <div className="min-h-screen" style={{ background: "#060818" }}>
      {/* Mini nav */}
      <nav className="border-b border-white/8 sticky top-0 z-40" style={{ background: "rgba(6,8,24,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Globe2 size={13} className="text-white" />
            </div>
            <span className="font-black text-sm" style={gradText}>Smart Supply Chain AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <Wifi size={10}/> Live Tracking
            </span>
            <Link href="/fleet" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={13}/> Fleet
            </Link>
            <Link href="/dashboard" className="text-xs font-bold text-white px-3 py-1.5 rounded-lg"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Live Vessel Tracking</p>
              <h1 className="text-4xl font-black text-white mb-1">{ship.name}</h1>
              <p className="text-gray-500">{ship.company} · {ship.vessel_type} · Flag: {ship.flag}</p>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${cfg.bg} ${cfg.color}`}>
              <Icon size={14}/> {cfg.label}
            </span>
          </div>

          {/* Lifecycle */}
          <div className="glass-panel rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Shipment Lifecycle</p>
            <div className="flex items-center gap-2 flex-wrap">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
                    i < activeStageIdx ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                    i === activeStageIdx ? "border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-500/10" :
                    "border-white/8 bg-white/4 text-gray-600"
                  }`}>
                    {i < activeStageIdx && <CheckCircle size={11}/>}
                    {i === activeStageIdx && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>}
                    {stage}
                  </div>
                  {i < STAGES.length - 1 && <ArrowRight size={12} className="text-gray-700 shrink-0"/>}
                </div>
              ))}
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Cargo", value: ship.cargo },
              { label: "Value at Risk", value: `$${((ship.cargo_value_usd||0)/1e6).toFixed(1)}M` },
              { label: "Speed", value: `${ship.speed_knots} knots` },
              { label: "Risk Score", value: `${ship.risk_score || 0}/100` },
              { label: "Origin", value: ship.origin },
              { label: "Destination", value: ship.destination },
              { label: "ETA", value: ship.eta },
              { label: "Delay", value: ship.delay_hours > 0 ? `${ship.delay_hours}h late` : "On schedule" },
            ].map(item => (
              <div key={item.label} className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Map coords + QR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="glass-panel rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Current Position</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-black text-white">{ship.lat?.toFixed(3)}°</p>
                  <p className="text-xs text-gray-600">Latitude</p>
                </div>
                <div className="w-px h-10 bg-white/10"/>
                <div>
                  <p className="text-2xl font-black text-white">{ship.lng?.toFixed(3)}°</p>
                  <p className="text-xs text-gray-600">Longitude</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-700 mt-3 flex items-center gap-1">
                <Wifi size={10}/> Updated: {lastUpdate?.toLocaleTimeString() || "—"}
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex flex-col items-center gap-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider w-full">Share Tracking</p>
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={trackingUrl} size={100} bgColor="#ffffff" fgColor="#060818" level="M"/>
              </div>
              <p className="text-[10px] text-gray-600 text-center">Scan to track {ship.name}</p>
              <p className="text-[9px] font-mono text-gray-700">{ship.id}</p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
              Open Full Command Center <ArrowRight size={14}/>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
