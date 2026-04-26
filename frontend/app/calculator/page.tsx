"use client";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { costEstimate } from "@/lib/api";
import { useState, useCallback } from "react";
import { Calculator, Loader2, DollarSign, Clock, Leaf, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PORTS = ["Shanghai", "Singapore", "Rotterdam", "Los Angeles", "Dubai (Jebel Ali)", "Hamburg", "Hong Kong", "Tokyo", "Mumbai", "New York/Newark", "Busan", "Antwerp"];
const CARGO_TYPES = ["Electronics", "Automotive Parts", "Chemicals", "Crude Oil", "LNG", "Grain/Wheat", "Pharmaceuticals", "Consumer Goods", "Steel/Metals", "Textiles", "Perishables", "Machinery"];

export default function CalculatorPage() {
  const [form, setForm] = useState({ origin: "Shanghai", destination: "Rotterdam", cargo_type: "Electronics", weight_tons: 500, urgency: "standard" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await costEstimate(form);
      setResult(res.estimate);
    } catch {
      setResult({ error: true });
    }
    setLoading(false);
  }, [form]);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-400">{label}</label>
      {children}
    </div>
  );

  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 focus:bg-blue-500/5 transition-all appearance-none cursor-pointer";

  const RISK_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Calculator size={24} className="text-blue-400"/> Shipping Cost Calculator</h1>
          <p className="text-gray-500 mt-1">AI-powered quote estimation using live market rates · Powered by Gemini 3</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white">Shipment Details</h2>
            <Field label="Origin Port">
              <select value={form.origin} onChange={e => set("origin", e.target.value)} className={selectClass}>
                {PORTS.map(p => <option key={p} value={p} className="bg-[#060818]">{p}</option>)}
              </select>
            </Field>
            <Field label="Destination Port">
              <select value={form.destination} onChange={e => set("destination", e.target.value)} className={selectClass}>
                {PORTS.filter(p => p !== form.origin).map(p => <option key={p} value={p} className="bg-[#060818]">{p}</option>)}
              </select>
            </Field>
            <Field label="Cargo Type">
              <select value={form.cargo_type} onChange={e => set("cargo_type", e.target.value)} className={selectClass}>
                {CARGO_TYPES.map(c => <option key={c} value={c} className="bg-[#060818]">{c}</option>)}
              </select>
            </Field>
            <Field label={`Weight: ${form.weight_tons.toLocaleString()} metric tons`}>
              <input type="range" min={50} max={5000} step={50} value={form.weight_tons}
                onChange={e => set("weight_tons", Number(e.target.value))}
                className="accent-blue-500 w-full" />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>50t</span><span>5,000t</span>
              </div>
            </Field>
            <Field label="Service Level">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", label: "Standard", sub: "~18 days", color: "#3b82f6" },
                  { id: "express",  label: "Express",  sub: "~12 days", color: "#f59e0b" },
                  { id: "critical", label: "Critical", sub: "~8 days",  color: "#ef4444" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => set("urgency", opt.id)}
                    className={`flex flex-col items-center gap-0.5 p-3 rounded-xl border text-xs font-bold transition-all ${form.urgency === opt.id ? "text-white border-opacity-50" : "border-white/10 bg-white/5 text-gray-500 hover:text-gray-300"}`}
                    style={form.urgency === opt.id ? { borderColor: opt.color + "50", background: opt.color + "15", color: opt.color } : {}}>
                    {opt.label}
                    <span className="text-[9px] font-normal">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </Field>
            <button onClick={calculate} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 30px rgba(59,130,246,0.3)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin"/> Gemini Calculating...</> : <><Calculator size={15}/> Get AI Quote</>}
            </button>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin"/>
                  <p className="text-sm text-gray-500">Gemini analyzing live market rates...</p>
                </motion.div>
              )}
              {result && !loading && !result.error && (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                  {/* Total */}
                  <div className="glass-panel rounded-2xl p-6 text-center border border-blue-500/20">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Total Estimated Cost</p>
                    <p className="text-5xl font-black text-white">${(result.total_usd || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{form.origin} → {form.destination} · {result.transit_days} days</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: RISK_COLORS[result.risk_rating as keyof typeof RISK_COLORS] || "#3b82f6", borderColor: (RISK_COLORS[result.risk_rating as keyof typeof RISK_COLORS] || "#3b82f6") + "40", background: (RISK_COLORS[result.risk_rating as keyof typeof RISK_COLORS] || "#3b82f6") + "15" }}>
                        {(result.risk_rating || "medium").toUpperCase()} RISK
                      </span>
                      <span className="text-xs text-emerald-400">🌱 {result.co2_tons}t CO₂</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="glass-panel rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cost Breakdown</h3>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Base Freight", value: result.base_freight_usd, icon: DollarSign },
                        { label: "Fuel Surcharge", value: result.fuel_surcharge_usd, icon: DollarSign },
                        { label: "Port Fees", value: result.port_fees_usd, icon: Leaf },
                        { label: "Marine Insurance", value: result.insurance_usd, icon: ShieldCheck },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <row.icon size={12} className="text-gray-600"/>
                            <span className="text-xs text-gray-400">{row.label}</span>
                          </div>
                          <span className="text-xs font-bold text-white">${(row.value || 0).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-black text-white">Total</span>
                        <span className="text-sm font-black text-blue-300">${(result.total_usd || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {result.recommendation && (
                    <div className="glass-panel rounded-xl p-4 border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-400 font-bold mb-1">🤖 AI Recommendation</p>
                      <p className="text-xs text-gray-400">{result.recommendation}</p>
                    </div>
                  )}
                </motion.div>
              )}
              {!result && !loading && (
                <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-3 text-center border border-dashed border-white/10">
                  <Calculator size={32} className="text-gray-700"/>
                  <p className="text-sm text-gray-600">Fill in the details and click "Get AI Quote"</p>
                  <p className="text-xs text-gray-700">Powered by Gemini 3 Flash + live market data</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
