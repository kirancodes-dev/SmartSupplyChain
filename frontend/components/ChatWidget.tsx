"use client";
import { useState, useRef, useEffect } from "react";
import { chatWithAI, fetchExecutiveSummary } from "@/lib/api";
import { MessageSquare, X, Send, Bot, User, Sparkles, FileText, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "How many ships are at risk right now?",
  "Which port is most congested?",
  "What is the total cargo value at risk?",
  "Give me a summary of today's reroutes.",
];

type Msg = { role: "user" | "ai"; text: string; ts: string };

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    role: "ai",
    text: "👋 I'm your **AI Supply Chain Assistant** powered by Gemini 2.0. Ask me anything about live fleet data, or click **Executive Summary** for a board-level briefing.",
    ts: now(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const addAI = (text: string) => setMessages(p => [...p, { role: "ai", text, ts: now() }]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    setMessages(p => [...p, { role: "user", text: q, ts: now() }]);
    setInput("");
    setLoading(true);
    try {
      const r = await chatWithAI(q);
      addAI(r.reply);
    } catch { addAI("Connection error. Please check the backend."); }
    setLoading(false);
  };

  const handleExecutiveSummary = async () => {
    setMessages(p => [...p, { role: "user", text: "📋 Generate Executive Summary", ts: now() }]);
    setSummaryLoading(true);
    setLoading(true);
    try {
      const r = await fetchExecutiveSummary();
      addAI(`📋 **Executive Briefing**\n\n${r.summary}`);
    } catch { addAI("Could not generate executive summary."); }
    setSummaryLoading(false);
    setLoading(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}}><X size={22} className="text-white"/></motion.span>
            : <motion.span key="c" initial={{rotate:90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}}><MessageSquare size={22} className="text-white"/></motion.span>
          }
        </AnimatePresence>
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#060818] animate-pulse"/>}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity:0, y:30, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:30, scale:0.95 }}
            transition={{ type:"spring", damping:22, stiffness:300 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{ width:390, height:540, background:"rgba(7,10,26,0.98)", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 0 60px rgba(59,130,246,0.2),0 25px 50px rgba(0,0,0,0.7)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0"
              style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.12),rgba(99,102,241,0.08))" }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Bot size={17} className="text-white"/>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#060818]"/>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">Supply Chain AI</h3>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1"><Sparkles size={9}/> Gemini 2.0 Flash · Live Data</p>
              </div>
              <button onClick={handleExecutiveSummary} disabled={summaryLoading}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all disabled:opacity-50">
                <FileText size={11}/>
                {summaryLoading ? "Generating..." : "Exec Summary"}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors ml-1">
                <X size={15}/>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-emerald-500 to-teal-500"}`}>
                    {msg.role === "user" ? <User size={12}/> : <Bot size={12}/>}
                  </div>
                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none"
                        : "bg-white/8 border border-white/10 text-gray-200 rounded-tl-none"
                    }`}>{msg.text}</div>
                    <span className="text-[10px] text-gray-600 px-1">{msg.ts}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0"><Bot size={12}/></div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/8 border border-white/10 flex items-center gap-1">
                    {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Quick suggestions */}
            {messages.length < 3 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/8 text-blue-300 hover:bg-blue-500/15 transition-all text-left">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/8 flex gap-2 bg-black/30 shrink-0">
              <input
                className="chat-input text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && send()}
                placeholder="Ask about your fleet..."
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ background:"linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                <Send size={16} className="text-white"/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
