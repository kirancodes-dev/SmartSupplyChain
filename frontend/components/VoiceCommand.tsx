"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Volume2, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { showToast } from "./ToastProvider";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceCommand({ onCommand }: { onCommand?: (cmd: string, reply: string) => void }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [supported, setSupported] = useState(true);
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
    };
    rec.onend = async () => {
      if (!transcript) { setState("idle"); return; }
      setState("processing");
      try {
        const res = await apiFetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: transcript }),
        });
        const aiReply = res.reply || "Processing complete.";
        setReply(aiReply);
        setHistory(prev => [{ q: transcript, a: aiReply }, ...prev.slice(0, 4)]);
        onCommand?.(transcript, aiReply);

        // Text to speech
        if ("speechSynthesis" in window) {
          setState("speaking");
          const utt = new SpeechSynthesisUtterance(aiReply.replace(/[*#`]/g, "").slice(0, 200));
          utt.rate = 1.05;
          utt.pitch = 1;
          utt.volume = 0.9;
          utt.onend = () => setState("idle");
          speechSynthesis.speak(utt);
        } else {
          setState("idle");
        }
      } catch {
        setState("idle");
      }
    };
    recognitionRef.current = rec;
  }, [transcript, onCommand]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setReply("");
    setState("listening");
    try { recognitionRef.current.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    setState("idle");
  }, []);

  if (!supported) return null;

  const COLORS = { idle: "#3b82f6", listening: "#ef4444", processing: "#f97316", speaking: "#10b981" };
  const LABELS = { idle: "Voice Command", listening: "Listening...", processing: "AI Thinking...", speaking: "AI Speaking..." };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-blue-500/15">
      <div className="px-5 py-3.5 border-b border-white/8 bg-gradient-to-r from-blue-500/8 to-purple-500/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mic size={14} className="text-blue-400" /> Voice Command Interface
          </h3>
          <p className="text-[11px] text-gray-500">Speak to Gemini AI — "Reroute all at-risk ships"</p>
        </div>
        <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border`}
          style={{ color: COLORS[state], borderColor: COLORS[state] + "40", background: COLORS[state] + "15" }}>
          {LABELS[state]}
        </div>
      </div>

      <div className="p-5 flex flex-col items-center gap-4">
        {/* Mic button */}
        <div className="relative">
          {state === "listening" && (
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.3)" }}/>
          )}
          {state === "speaking" && (
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(16,185,129,0.3)" }}/>
          )}
          <button
            onClick={state === "idle" ? startListening : stopListening}
            className="relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${COLORS[state]}, ${COLORS[state]}99)`, boxShadow: `0 8px 30px ${COLORS[state]}50` }}
          >
            {state === "idle" ? <Mic size={24}/> : state === "processing" ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : state === "speaking" ? <Volume2 size={24}/> : <MicOff size={24}/>}
          </button>
        </div>

        {/* Waveform animation while listening */}
        {state === "listening" && (
          <div className="flex items-end gap-1 h-8">
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} className="w-1.5 rounded-full bg-red-400"
                animate={{ height: [4, Math.random() * 28 + 4, 4] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="w-full glass-bright rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">You said:</p>
            <p className="text-sm text-white font-semibold">"{transcript}"</p>
          </div>
        )}

        {/* AI Reply */}
        {reply && state !== "listening" && (
          <div className="w-full glass-bright rounded-xl px-4 py-3 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1"><Volume2 size={10}/> Gemini AI:</p>
            <p className="text-xs text-gray-300 leading-relaxed">{reply.slice(0, 300)}{reply.length > 300 ? "..." : ""}</p>
          </div>
        )}

        {/* Quick commands */}
        <div className="w-full">
          <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Try saying:</p>
          <div className="flex flex-wrap gap-1.5">
            {["How many ships are at risk?", "Reroute all delayed vessels", "What's the weather situation?", "Give me an executive summary"].map(cmd => (
              <button key={cmd} onClick={async () => {
                setTranscript(cmd);
                setState("processing");
                try {
                  const res = await apiFetch("/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: cmd }) });
                  setReply(res.reply || "");
                  setHistory(prev => [{ q: cmd, a: res.reply }, ...prev.slice(0, 4)]);
                } catch {}
                setState("idle");
              }} className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 bg-white/4 text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="w-full space-y-1.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Recent commands:</p>
            {history.slice(0, 3).map((h, i) => (
              <div key={i} className="glass-bright rounded-lg px-3 py-2 text-[10px]">
                <p className="text-gray-500">Q: {h.q}</p>
                <p className="text-gray-400 mt-0.5 truncate">A: {h.a.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
