"use client";
import { useState, useRef } from "react";
import { requestOptimization, analyzeVision } from "@/lib/api";
import { AlertCircle, Zap, Check, Upload, Image as ImageIcon, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const severityConfig: Record<string, { badge: string; ring: string; icon: string }> = {
  High:   { badge: "badge-red",    ring: "border-red-500/30 bg-red-950/30",     icon: "🔴" },
  Medium: { badge: "badge-orange", ring: "border-orange-500/30 bg-orange-950/30", icon: "🟠" },
  Low:    { badge: "badge-blue",   ring: "border-blue-500/30 bg-blue-950/30",   icon: "🔵" },
};

export default function AlertsPanel({ alerts, onOptimized }: { alerts: any[]; onOptimized: () => void }) {
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOptimize = async (shipId: string, alertId: string) => {
    try {
      setOptimizing(alertId);
      const res = await requestOptimization(shipId);
      if (res.status === "success") {
        setSuccess(alertId);
        onOptimized();
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result?.toString().split(",")[1];
      if (b64) {
        try {
          await analyzeVision(b64);
          onOptimized();
        } catch (err) {
          console.error(err);
        }
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="glass-panel h-[580px] flex flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30 rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertCircle size={14} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Disruption Alerts</h2>
            <p className="text-[11px] text-gray-500">{alerts.length} active events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <><span className="animate-spin">⟳</span> Scanning...</>
            ) : (
              <><Upload size={12} /> Vision Scan</>
            )}
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Check size={28} className="text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-semibold text-sm">All Clear</p>
              <p className="text-gray-600 text-xs mt-1">No active disruptions detected</p>
            </motion.div>
          ) : (
            alerts.map((alert) => {
              const cfg = severityConfig[alert.severity] || severityConfig.Medium;
              const isExpanded = expanded === alert.id;
              const isDone = success === alert.id;
              const isWorking = optimizing === alert.id;
              const isAutoHandled = alert.message?.startsWith("[AUTO-PILOT");
              const isVision = alert.id?.includes("vision");

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`border rounded-xl overflow-hidden ${cfg.ring}`}
                >
                  {/* Alert Header */}
                  <button
                    className="w-full p-3 text-left flex items-start gap-2.5 hover:bg-white/3 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : alert.id)}
                  >
                    <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge ${cfg.badge} text-[10px]`}>
                          {isVision && <ImageIcon size={9} />}
                          {alert.type}
                        </span>
                        {isAutoHandled && (
                          <span className="badge badge-emerald text-[10px]">
                            <Bot size={9} /> Auto-Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-snug line-clamp-2">{alert.message}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-500 shrink-0 mt-1" /> : <ChevronDown size={14} className="text-gray-500 shrink-0 mt-1" />}
                  </button>

                  {/* Expanded Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 overflow-hidden"
                      >
                        <p className="text-xs text-gray-400 mb-2 leading-relaxed">{alert.message}</p>
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
                              <><Check size={14} /> Route Optimized Successfully</>
                            ) : isWorking ? (
                              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gemini AI Optimizing...</>
                            ) : (
                              <><Zap size={14} /> AI Reroute Recommendation</>
                            )}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 rounded-b-2xl">
        <p className="text-[10px] text-gray-600 text-center">Click an alert to expand · Upload images for AI visual scan</p>
      </div>
    </div>
  );
}
