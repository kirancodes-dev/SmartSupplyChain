"use client";
import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RISK_CONFIG = {
  High:   { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/25",    dot: "bg-red-400",    icon: AlertTriangle },
  Medium: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/25", dot: "bg-orange-400", icon: Minus },
  Low:    { color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/25",dot: "bg-emerald-400", icon: CheckCircle },
};

export default function ForecastPanel() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/forecast", { method: "POST" });
      setForecast(res.forecast || []);
      setGenerated(true);
    } catch { setForecast([]); }
    setLoading(false);
  }, []);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-blue-500/15">
      <div className="px-5 py-3 border-b border-white/8 bg-gradient-to-r from-blue-500/8 to-purple-500/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" /> 24h AI Predictive Forecast
          </h3>
          <p className="text-[11px] text-gray-500">Gemini generates real-time fleet risk forecast based on live data</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Generating..." : generated ? "Refresh" : "Generate Forecast"}
        </button>
      </div>

      <div className="p-4">
        {!generated && !loading && (
          <div className="py-8 text-center">
            <TrendingUp size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Click "Generate Forecast" to run Gemini's 24-hour predictive analysis.</p>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Gemini analyzing fleet patterns...</p>
          </div>
        )}

        <AnimatePresence>
          {!loading && forecast.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {forecast.map((item: any, idx: number) => {
                const cfg = RISK_CONFIG[item.risk_level as keyof typeof RISK_CONFIG] || RISK_CONFIG.Low;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`rounded-xl p-4 border ${cfg.bg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.hour}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{item.risk_level}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 leading-tight">{item.headline}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{item.detail}</p>
                    <p className={`text-xs font-bold ${cfg.color}`}>{item.metric}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
