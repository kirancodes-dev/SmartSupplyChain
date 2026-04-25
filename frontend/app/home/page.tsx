"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Globe2, Ship, Zap, Leaf, Bot, Eye, BarChart3, ShieldCheck, ArrowRight, Star, Play, TrendingUp, AlertTriangle, RefreshCw, CheckCircle, CloudLightning, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { icon: Globe2, color: "#3b82f6", glow: "rgba(59,130,246,0.15)", title: "3D Global Command Center", desc: "WebGL spinning globe with live vessel arcs, storm zones, and port overlays — every ship, every storm, every port, live." },
  { icon: Bot, color: "#a855f7", glow: "rgba(168,85,247,0.15)", title: "Gemini 2.0 Function Calling", desc: "AI autonomously queries fleet, port, and weather data using Google's Function Calling API — true agentic intelligence." },
  { icon: Zap, color: "#10b981", glow: "rgba(16,185,129,0.15)", title: "Autonomous Auto-Pilot", desc: "Enable Auto-Pilot and Gemini reroutes at-risk vessels without human input. Disruptions resolved in seconds." },
  { icon: CloudLightning, color: "#f97316", glow: "rgba(249,115,22,0.15)", title: "Live Weather Lab", desc: "Inject Typhoons, Cyclones anywhere on Earth. Watch AI detect affected vessels and respond in real-time." },
  { icon: TrendingUp, color: "#3b82f6", glow: "rgba(59,130,246,0.15)", title: "24h AI Forecast", desc: "Gemini generates a 4-slot 24-hour fleet risk outlook with risk levels, headlines, and actionable metrics." },
  { icon: ShieldCheck, color: "#10b981", glow: "rgba(16,185,129,0.15)", title: "Tamper-Evident Audit Trail", desc: "Every AI rerouting decision logged with hash signatures, timestamps, and CO₂ impact for compliance." },
  { icon: Eye, color: "#a855f7", glow: "rgba(168,85,247,0.15)", title: "Satellite Vision Scanning", desc: "Upload satellite images — Gemini Vision API detects weather anomalies and port blockages automatically." },
  { icon: Leaf, color: "#10b981", glow: "rgba(16,185,129,0.15)", title: "CO₂ & ESG Tracking", desc: "Real-time sustainability dashboard with carbon credit valuations for board-level reporting." },
];

const FLOW = [
  { icon: AlertTriangle, color: "#f97316", step: "01", title: "Disruption Detected", desc: "AI sensors detect weather, congestion, or delay anomalies across all 15 vessels simultaneously." },
  { icon: Bot, color: "#a855f7", step: "02", title: "Gemini Analyzes", desc: "Function Calling agents autonomously query fleet status, port availability, and weather data." },
  { icon: RefreshCw, color: "#3b82f6", step: "03", title: "Route Optimized", desc: "Optimal alternative route selected, minimizing delay, cost, and carbon footprint." },
  { icon: CheckCircle, color: "#10b981", step: "04", title: "Cargo Protected", desc: "Vessels rerouted, stakeholders notified, savings logged. Average: $45K saved per reroute." },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const [count, setCount] = useState({ ships: 0, savings: 0, co2: 0 });

  useEffect(() => {
    const t = setTimeout(() => {
      const i = setInterval(() => setCount(p => ({ ships: Math.min(p.ships + 1, 15), savings: Math.min(p.savings + 70, 4200), co2: Math.min(p.co2 + 20, 1240) })), 25);
      return () => clearInterval(i);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const gradText = { background: "linear-gradient(135deg, #3b82f6 0%, #10b981 50%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#060818" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8" style={{ background: "rgba(6,8,24,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Globe2 size={16} className="text-white" />
            </div>
            <span className="font-black text-sm" style={gradText}>Smart Supply Chain AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1 rounded-full border border-white/8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Gemini 2.0 Flash
            </span>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}>
              Launch App <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        <motion.div style={{ y: yBg }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6">
          <Star size={12} fill="currentColor" /> Google H2S Hackathon 2026 · Powered by Gemini 2.0 Flash
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 max-w-4xl">
          <span className="text-white">AI That Protects </span>
          <span style={gradText}>$Billions in Cargo</span>
          <span className="text-white"> Before Disaster Strikes</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Industrial-grade AI supply chain command center. Detects disruptions, reroutes vessels, and saves millions — <strong className="text-white">autonomously</strong>.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex items-center gap-4 flex-wrap justify-center mb-16">
          <Link href="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black text-white hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 40px rgba(59,130,246,0.5)" }}>
            <Play size={16} fill="white" /> Launch Dashboard
          </Link>
          <Link href="/architecture" className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-gray-300 border border-white/15 hover:bg-white/5 transition-all">
            Architecture <ArrowRight size={16} />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { v: `${count.ships}`, l: "Live Vessels" },
            { v: `$${count.savings.toLocaleString()}K`, l: "Daily Savings" },
            { v: `${count.co2}t`, l: "CO₂ Prevented" },
            { v: "< 2s", l: "AI Response" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-2xl font-black text-white">{s.v}</p>
              <p className="text-xs text-gray-600 mt-1">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-4">8 AI-Powered Modules. One Platform.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Everything needed to protect a global fleet — working together in real-time.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02, y: -4 }} className="rounded-2xl p-5 border border-white/8 transition-all" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.glow }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-white/8" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-4">From Alert to Resolution in 4 Steps</h2>
            <p className="text-gray-500 text-lg">Autonomous workflow — no human required.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {FLOW.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-white/10"
                  style={{ background: `${step.color}18`, boxShadow: `0 0 30px ${step.color}25` }}>
                  <step.icon size={24} style={{ color: step.color }} />
                </div>
                <span className="text-[10px] font-black text-gray-700 tracking-widest mb-2">STEP {step.step}</span>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[120px] opacity-20" style={{ background: "radial-gradient(ellipse, #3b82f6, transparent)" }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to See It Live?</h2>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">Open the industrial dashboard and watch Gemini AI protect your fleet in real-time.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-black text-white hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)", boxShadow: "0 8px 60px rgba(59,130,246,0.6)" }}>
            <Play size={20} fill="white" /> Launch Dashboard Now
          </Link>
          <p className="text-gray-700 text-xs mt-6">No signup · No credit card · Open source · Google H2S Hackathon 2026</p>
        </motion.div>
      </section>

      <footer className="border-t border-white/8 py-6 text-center text-xs text-gray-700">
        Smart Supply Chain AI v2.0 · Built by Kiran Biradar · Gemini 2.0 Flash · Google H2S Hackathon 2026
      </footer>
    </div>
  );
}
