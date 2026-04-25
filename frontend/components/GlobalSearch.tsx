"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Ship, Anchor, AlertTriangle, RefreshCw, X, ArrowRight } from "lucide-react";
import { fetchFleet, fetchPorts } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Result = {
  id: string;
  type: "ship" | "port" | "route";
  title: string;
  sub: string;
  href: string;
  status?: string;
  color?: string;
};

const STATUS_COLORS: Record<string, string> = {
  "on-time": "#10b981", "at-risk": "#f97316", "delayed": "#ef4444", "rerouted": "#3b82f6",
  "Clear": "#10b981", "Moderate": "#f59e0b", "Congested": "#ef4444",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [allData, setAllData] = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fleet, ports] = await Promise.all([fetchFleet(), fetchPorts()]);
        const shipResults: Result[] = (fleet?.ships || []).map((s: any) => ({
          id: s.id, type: "ship", title: s.name,
          sub: `${s.cargo} · ${s.origin} → ${s.destination} · Risk: ${s.risk_score}/100`,
          href: `/track/${s.id}`, status: s.status, color: STATUS_COLORS[s.status],
        }));
        const portResults: Result[] = (ports?.ports || []).map((p: any) => ({
          id: p.id, type: "port", title: p.full_name || p.name,
          sub: `${p.country} · ${p.status} · Util: ${Math.round(p.current_load/p.capacity*100)}%`,
          href: "/ports", status: p.status, color: STATUS_COLORS[p.status],
        }));
        setAllData([...shipResults, ...portResults]);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults(allData.slice(0, 6)); return; }
    const q = query.toLowerCase();
    const filtered = allData.filter(r =>
      r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.status?.toLowerCase().includes(q)
    );
    setResults(filtered.slice(0, 8));
  }, [query, allData]);

  const TypeIcon = ({ type }: { type: string }) =>
    type === "ship" ? <Ship size={13} /> : <Anchor size={13} />;

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-all">
        <Search size={12} /> Search <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] text-gray-600">⌘/</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0 }} className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              style={{ background: "rgba(6,8,24,0.98)" }} onClick={e => e.stopPropagation()}>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
                <Search size={16} className="text-gray-500 shrink-0" />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search ships, ports, cargo, routes..." autoComplete="off"
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
                {query && <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400"><X size={14}/></button>}
                <kbd className="px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-[10px] text-gray-600">Esc</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {results.length === 0 && (
                  <p className="text-center text-gray-600 text-sm py-8">No results for "{query}"</p>
                )}
                {results.map((r, i) => (
                  <Link key={r.id + i} href={r.href} onClick={() => setOpen(false)}>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: (r.color || "#3b82f6") + "20", color: r.color || "#3b82f6" }}>
                        <TypeIcon type={r.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                        <p className="text-[10px] text-gray-600 truncate">{r.sub}</p>
                      </div>
                      {r.status && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: r.color, background: (r.color || "#3b82f6") + "20" }}>
                          {r.status}
                        </span>
                      )}
                      <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-400 shrink-0" />
                    </motion.div>
                  </Link>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t border-white/8 flex items-center gap-3 text-[10px] text-gray-700">
                <span>{allData.length} items indexed</span>
                <span>·</span>
                <span>Ships, Ports, Routes</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
