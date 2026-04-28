"use client";
import { useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Upload, Camera, AlertTriangle, CheckCircle, FileText, DollarSign, Zap, RefreshCw, Package, Thermometer, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";

type InspectionResult = {
  shipment_details: { cargo_type: string; estimated_weight_kg: number; dimensions: string; condition: string; hazmat_detected: boolean; temperature_sensitive: boolean };
  discrepancies: { field: string; detected: string; expected: string; severity: string }[];
  damage_assessment: { damage_detected: boolean; severity: string; damage_type: string; affected_percentage: number; estimated_repair_cost_usd: number; estimated_replacement_cost_usd: number };
  insurance_recommendation: { claim_recommended: boolean; estimated_claim_usd: number; urgency: string; notes: string };
  ai_confidence: number;
  inspection_notes: string;
};

const CONDITION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  excellent: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "Excellent ✓" },
  good:      { color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  label: "Good ✓" },
  damaged:   { color: "#f97316", bg: "rgba(249,115,22,0.15)",  label: "Damaged ⚠" },
  critical:  { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "Critical ✕" },
};

const SEVERITY_COLOR: Record<string, string> = { low: "#10b981", medium: "#f59e0b", high: "#ef4444", none: "#10b981", minor: "#f59e0b", moderate: "#f97316", severe: "#ef4444" };

const DEMO_SCENARIOS = [
  { label: "📦 Intact Electronics", desc: "No damage, weight OK" },
  { label: "💧 Water Damage", desc: "Moisture detected, moderate damage" },
  { label: "⚠️ Shipping Label Discrepancy", desc: "Weight mismatch, possible fraud" },
  { label: "🔥 Heat Damage", desc: "Temperature breach detected" },
];

export default function CargoInspectorPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [model, setModel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = (reader.result as string).split(",")[1];
      setImage(b64);
    };
    reader.readAsDataURL(file);
  };

  const inspect = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch("/cargo-inspect", { method: "POST", body: JSON.stringify({ image_b64: image || "", context: context || "general cargo inspection" }) });
      setResult(res.result);
      setModel(res.model);
    } catch {}
    setLoading(false);
  };

  const runDemo = async (idx: number) => {
    const labels = ["intact electronics shipment, all seals intact", "water damage detected on outer packaging, moisture indicators triggered", "weight discrepancy on shipping label vs actual, possible manifest fraud", "heat damage detected, temperature logger shows breach of 45°C"];
    setContext(labels[idx]);
    setImage(null);
    setImageName(`demo_scenario_${idx + 1}.jpg`);
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch("/cargo-inspect", { method: "POST", body: JSON.stringify({ image_b64: "", context: labels[idx] }) });
      setResult(res.result);
      setModel(res.model);
    } catch {}
    setLoading(false);
  };

  const cond = result ? (CONDITION_STYLES[result.shipment_details.condition] || CONDITION_STYLES.good) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Eye size={26} className="text-purple-400" /> Visual Cargo Inspector</h1>
          <p className="text-gray-500 mt-1">Upload any cargo photo, shipping label, or manifest — Gemini 2.0 Flash Vision extracts details, flags discrepancies, and estimates damage costs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload panel */}
          <div className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
              className="glass-panel rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-10 text-center"
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={e => e.preventDefault()}>
              {image ? (
                <><CheckCircle size={36} className="text-emerald-400" /><p className="text-sm font-bold text-white">{imageName}</p><p className="text-xs text-gray-500">Image ready for inspection · Click to change</p></>
              ) : (
                <><Upload size={36} className="text-gray-600" /><p className="text-sm font-semibold text-gray-400">Drop cargo photo, shipping label, or manifest</p><p className="text-xs text-gray-700">JPG, PNG, HEIC · Max 10MB</p></>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {/* Context */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Additional Context (optional)</label>
              <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                placeholder="e.g. High-value electronics shipment from Shenzhen, expected weight 4t, refrigerated cargo..."
                className="w-full chat-input p-3 text-sm rounded-xl resize-none" />
            </div>

            {/* Inspect button */}
            <button onClick={inspect} disabled={loading}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 40px rgba(168,85,247,0.4)" }}>
              {loading ? <><RefreshCw size={16} className="animate-spin" /> Gemini Vision Analyzing...</> : <><Eye size={16} /> Inspect Cargo</>}
            </button>

            {/* Demo scenarios */}
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">⚡ Quick Demo Scenarios</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_SCENARIOS.map((d, i) => (
                  <button key={i} onClick={() => runDemo(i)} disabled={loading}
                    className="flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all">
                    <span className="text-xs font-bold text-white">{d.label}</span>
                    <span className="text-[10px] text-gray-600">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results panel */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-4 p-12">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
                  <Eye size={24} className="absolute inset-0 m-auto text-purple-400" />
                </div>
                <p className="text-sm font-bold text-white">Gemini Vision Analyzing...</p>
                <p className="text-xs text-gray-500">Extracting cargo details, checking discrepancies, assessing damage</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4">
                {/* Condition banner */}
                <div className="glass-panel rounded-2xl p-5 flex items-center gap-4 border" style={{ borderColor: (cond?.color || "#3b82f6") + "40" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: cond?.bg }}>
                    <Package size={26} style={{ color: cond?.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-white">{result.shipment_details.cargo_type}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: cond?.color, background: cond?.bg }}>{cond?.label}</span>
                      <span className="text-[10px] text-gray-600">{result.shipment_details.dimensions} · {(result.shipment_details.estimated_weight_kg/1000).toFixed(1)}t</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">AI Confidence</p>
                    <p className="text-lg font-black text-white">{Math.round(result.ai_confidence * 100)}%</p>
                  </div>
                </div>

                {/* Flags */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: AlertTriangle, label: "Hazmat", val: result.shipment_details.hazmat_detected, color: "#ef4444" },
                    { icon: Thermometer, label: "Temp Sensitive", val: result.shipment_details.temperature_sensitive, color: "#f59e0b" },
                    { icon: Shield, label: "Damage Detected", val: result.damage_assessment.damage_detected, color: "#f97316" },
                    { icon: FileText, label: "Claim Recommended", val: result.insurance_recommendation.claim_recommended, color: "#a855f7" },
                  ].map((f, i) => (
                    <div key={i} className="glass-panel rounded-xl p-3 flex items-center gap-2">
                      <f.icon size={13} style={{ color: f.val ? f.color : "#374151" }} />
                      <span className="text-[11px] text-gray-400">{f.label}</span>
                      <span className="ml-auto text-[10px] font-black" style={{ color: f.val ? f.color : "#10b981" }}>{f.val ? "YES" : "NO"}</span>
                    </div>
                  ))}
                </div>

                {/* Discrepancies */}
                {result.discrepancies.length > 0 && (
                  <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                      <AlertTriangle size={13} className="text-orange-400" />
                      <p className="text-xs font-black text-white">Discrepancies ({result.discrepancies.length})</p>
                    </div>
                    {result.discrepancies.map((d, i) => (
                      <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-white">{d.field}</p>
                          <p className="text-[10px] text-gray-500">Expected: <span className="text-gray-400">{d.expected}</span> · Got: <span style={{ color: SEVERITY_COLOR[d.severity] }}>{d.detected}</span></p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color: SEVERITY_COLOR[d.severity], background: SEVERITY_COLOR[d.severity] + "20" }}>{d.severity.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Damage + Insurance */}
                {(result.damage_assessment.damage_detected || result.insurance_recommendation.claim_recommended) && (
                  <div className="glass-panel rounded-xl p-4 border border-orange-500/20">
                    <p className="text-xs font-black text-orange-400 mb-2 flex items-center gap-1.5"><DollarSign size={12} /> Insurance Assessment</p>
                    <p className="text-sm font-bold text-white">Estimated Claim: ${result.insurance_recommendation.estimated_claim_usd.toLocaleString()}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{result.insurance_recommendation.notes}</p>
                  </div>
                )}

                {/* Notes */}
                <div className="glass-panel rounded-xl p-4">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mb-1">AI Inspector Notes</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{result.inspection_notes}</p>
                  <p className="text-[9px] text-gray-700 mt-2">Model: {model} · Powered by Gemini 2.0 Flash Vision</p>
                </div>
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-3 p-12 text-center">
                <Camera size={40} className="text-gray-700" />
                <p className="text-sm font-bold text-gray-500">Upload a cargo image or run a demo</p>
                <p className="text-xs text-gray-700">Gemini Vision will analyze condition, detect damage, and generate insurance recommendations</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
