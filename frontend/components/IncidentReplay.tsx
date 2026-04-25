"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Play, Pause, SkipBack, SkipForward, Clock, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IncidentReplay() {
  const [history, setHistory] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [commentary, setCommentary] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    apiFetch("/optimization-log").then(data => {
      if (Array.isArray(data) && data.length > 0) setHistory(data);
    }).catch(() => {});
  }, []);

  const generateCommentary = useCallback(async (entry: any) => {
    try {
      const res = await apiFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `In 1 sentence, narrate this AI decision: Vessel ${entry.ship_name || entry.ship_id} was rerouted to ${entry.new_destination}. Reason: ${entry.reason || "risk avoidance"}. CO₂ saved: ${entry.co2_saved}t. Be dramatic and executive-level.` }),
      });
      setCommentary(prev => [res.reply, ...prev.slice(0, 4)]);
    } catch {}
  }, []);

  useEffect(() => {
    if (playing && history.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrent(c => {
          const next = (c + 1) % history.length;
          generateCommentary(history[next]);
          return next;
        });
      }, 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, history, generateCommentary]);

  const entry = history[current];
  if (history.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-blue-500/15">
      <div className="px-5 py-3.5 border-b border-white/8 bg-gradient-to-r from-blue-500/8 to-indigo-500/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock size={14} className="text-blue-400"/> Incident Replay</h3>
          <p className="text-[11px] text-gray-500">Replay past AI decisions with live narration</p>
        </div>
        <span className="text-[10px] font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 px-2 py-1 rounded-full">{history.length} events</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Current event */}
        {entry && (
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="glass-bright rounded-xl p-4 border border-blue-500/15">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-blue-300">#{entry.id || current+1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{entry.ship_name || entry.ship_id} → {entry.new_destination}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{entry.reason || "AI route optimization"}</p>
                  <div className="flex gap-3 mt-2 text-[10px]">
                    <span className="text-emerald-400">🌱 {entry.co2_saved || 0}t CO₂</span>
                    <span className="text-blue-300">🤖 {entry.auto ? "Auto-Pilot" : "Manual"}</span>
                    <span className="text-gray-600">{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "—"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <SkipBack size={14}/>
            </button>
            <button onClick={() => setPlaying(p => !p)}
              className="px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 text-white transition-all"
              style={{ background: playing ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
              {playing ? <><Pause size={12}/> Pause</> : <><Play size={12}/> Play Replay</>}
            </button>
            <button onClick={() => setCurrent(c => Math.min(history.length - 1, c + 1))} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <SkipForward size={14}/>
            </button>
          </div>
          <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div className="h-full bg-blue-500 rounded-full" animate={{ width: `${((current+1)/history.length)*100}%` }} transition={{ duration: 0.5 }}/>
          </div>
          <span className="text-[10px] text-gray-600 shrink-0">{current+1}/{history.length}</span>
        </div>

        {/* AI Commentary */}
        {commentary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-600 flex items-center gap-1"><Bot size={10}/> AI Narrator:</p>
            {commentary.slice(0, 2).map((c, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-xs leading-relaxed ${i === 0 ? "text-gray-300" : "text-gray-600"}`}>
                {c}
              </motion.p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
