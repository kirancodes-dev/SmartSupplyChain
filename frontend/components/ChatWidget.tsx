"use client";
import { useState, useRef, useEffect } from "react";
import { chatWithAI } from "@/lib/api";
import { MessageSquare, X, Send, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "How many ships are at risk?",
  "Which port is most congested?",
  "What routes are being rerouted?",
  "How much CO₂ have we saved?",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; ts?: string }[]>([
    {
      role: "ai",
      text: "👋 Hello! I'm your **AI Supply Chain Assistant** powered by Gemini. Ask me anything about live vessel data, disruptions, or route optimizations.",
      ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const query = text || input;
    if (!query.trim()) return;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: query, ts }]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatWithAI(query);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.reply, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't reach the AI engine right now.", ts },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          boxShadow: "0 0 30px rgba(99,102,241,0.5)",
        }}
        aria-label="Open AI Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-white" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={22} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#060818] animate-pulse" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              height: "520px",
              background: "rgba(8, 12, 28, 0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 0 60px rgba(59,130,246,0.2), 0 25px 50px rgba(0,0,0,0.7)",
            }}
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))" }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#060818]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Supply Chain AI</h3>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1"><Sparkles size={9} /> Powered by Gemini</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    msg.role === "user" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-emerald-500 to-teal-500"
                  }`}>
                    {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none"
                        : "bg-white/8 border border-white/10 text-gray-200 rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                    {msg.ts && <span className="text-[10px] text-gray-600 px-1">{msg.ts}</span>}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                    <Bot size={13} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/8 border border-white/10 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 3 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/8 text-blue-300 hover:bg-blue-500/15 transition-all">
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                placeholder="Ask about your supply chain..."
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
