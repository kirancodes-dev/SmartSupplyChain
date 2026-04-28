"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchNews } from "@/lib/api";
import { Newspaper, RefreshCw, AlertTriangle, TrendingUp, Anchor, Shield, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SEV = {
  critical: { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20", dot: "bg-red-400" },
  high:     { color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-400" },
  medium:   { color: "#f59e0b", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" },
  low:      { color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "bg-blue-400" },
} as const;

const CAT_ICONS: Record<string, any> = {
  Weather: AlertTriangle, Port: Anchor, Market: TrendingUp, Security: Shield, Regulation: FileText,
};

type NewsItem = { id: number; severity: string; category: string; headline: string; summary: string; impact: string; time: string };

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNews();
      setNews(res.news || []);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45000); // refresh every 45s
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/8">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Newspaper size={15} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Maritime Intelligence Feed</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Gemini-analyzed global shipping news · {lastUpdate ? `${lastUpdate.toLocaleTimeString()}` : "Loading..."}</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-all">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {loading && news.length === 0 && (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-600">Gemini analyzing global maritime data...</p>
          </div>
        )}
        {news.map((item, idx) => {
          const sev = SEV[item.severity as keyof typeof SEV] || SEV.low;
          const Icon = CAT_ICONS[item.category] || Newspaper;
          const isOpen = selected === item.id;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
              className="px-5 py-3.5 cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setSelected(isOpen ? null : item.id)}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${sev.dot} ${item.severity === "critical" ? "animate-pulse" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-xs font-bold text-white leading-snug">{item.headline}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: sev.color, borderColor: sev.color + "40", background: sev.color + "15" }}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-[11px] text-gray-300 mt-1.5 leading-relaxed font-medium">{item.summary}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] font-mono text-gray-500">{item.time}</span>
                    <span className="text-[10px] font-bold" style={{ color: sev.color }}>⚡ {item.impact}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
