"use client";
import { useState, useCallback } from "react";
import { Mail, Copy, Check, Loader2, X, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface EmailDrafterProps {
  ship: any;
  onClose: () => void;
}

export default function EmailDrafter({ ship, onClose }: EmailDrafterProps) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<"professional" | "urgent" | "apologetic">("professional");

  const generate = useCallback(async () => {
    setLoading(true);
    setDraft("");
    try {
      const delayText = ship.delay_hours > 0 ? `${ship.delay_hours} hours behind schedule` : "potentially delayed";
      const prompt = `Draft a ${tone} shipping delay notification email for the following situation:
- Vessel: ${ship.name} (${ship.vessel_type})
- Cargo: ${ship.cargo} valued at $${((ship.cargo_value_usd||0)/1e6).toFixed(1)}M
- Status: ${ship.status === "at-risk" ? "At Risk of Delay" : ship.status === "delayed" ? `Delayed by ${ship.delay_hours}h` : "Rerouted by AI"}
- Route: ${ship.origin} → ${ship.destination}
- ETA: ${ship.eta}
- Situation: ${delayText}

Write a complete professional email with Subject line, greeting, body explaining the situation, actions taken (AI rerouting to minimize delay), revised ETA, and apology/assurance. Keep it concise and executive-level. Start with "Subject:"`;

      const res = await apiFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });
      setDraft(res.reply || "Could not generate email.");
    } catch {
      setDraft("Error generating email. Please check backend connection.");
    }
    setLoading(false);
  }, [ship, tone]);

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-blue-500/20 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-indigo-500/5">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">AI Email Drafter</h3>
              <p className="text-[10px] text-gray-500">Draft delay notification for {ship.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Tone selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Email tone:</span>
            {(["professional", "urgent", "apologetic"] as const).map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all border ${tone === t ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/5 text-gray-500 hover:text-white"}`}>
                {t}
              </button>
            ))}
            <button onClick={generate} disabled={loading}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {loading ? "Generating..." : draft ? "Regenerate" : "Generate Email"}
            </button>
          </div>

          {/* Email output */}
          <div className="relative min-h-[280px] glass-bright rounded-xl p-4 border border-white/8">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Gemini drafting email...</p>
                </div>
              </div>
            )}
            {!loading && !draft && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-gray-600">Click "Generate Email" to draft a delay notification</p>
              </div>
            )}
            {draft && (
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{draft}</pre>
            )}
          </div>

          {/* Actions */}
          {draft && (
            <div className="flex items-center gap-2">
              <button onClick={copy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${copied ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}>
                {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy Email</>}
              </button>
              <button onClick={() => {
                const subject = draft.split("\n")[0].replace("Subject: ", "");
                const body = draft.split("\n").slice(1).join("\n");
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
              }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all">
                <Mail size={12}/> Open in Mail App
              </button>
              <span className="ml-auto text-[10px] text-gray-600">Powered by Gemini 3 Flash</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
