"use client";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Globe2, Ship, Zap, Leaf, Bot, BarChart3, ShieldCheck, ArrowRight,
  Star, Play, TrendingUp, AlertTriangle, RefreshCw, CheckCircle,
  CloudLightning, Mic, Calculator, Trophy, FileText, Newspaper,
  Lightbulb, Map, Activity, ChevronRight, Sparkles, Clock, Camera, DollarSign
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

const QUICK_START = [
  {
    step: "1", icon: Activity, color: "#3b82f6",
    title: "Open the Dashboard",
    desc: "Live 3D globe with 15 vessels. Click any ship for details.",
    href: "/dashboard", cta: "Go to Dashboard",
  },
  {
    step: "2", icon: Zap, color: "#ef4444",
    title: "Run an AI Scenario",
    desc: "Trigger a Typhoon or Suez Canal blockage and watch AI respond.",
    href: "/scenarios", cta: "Try Scenarios",
  },
  {
    step: "3", icon: Bot, color: "#a855f7",
    title: "Generate a Briefing",
    desc: "Gemini writes a full executive briefing from live fleet data.",
    href: "/briefing", cta: "AI Briefing",
  },
  {
    step: "4", icon: FileText, color: "#10b981",
    title: "Export a Report",
    desc: "Print-quality PDF executive report with AI audit trail.",
    href: "/report", cta: "View Report",
  },
];

const ALL_PAGES = [
  { icon: Globe2, label: "Dashboard", href: "/dashboard", desc: "3D globe + live KPIs", color: "#3b82f6" },
  { icon: Ship, label: "Fleet", href: "/fleet", desc: "15 vessels, sortable table", color: "#6366f1" },
  { icon: BarChart3, label: "Analytics", href: "/analytics", desc: "4 live chart panels", color: "#8b5cf6" },
  { icon: Zap, label: "Scenarios", href: "/scenarios", desc: "5 disaster simulations", color: "#ef4444" },
  { icon: Map, label: "Ports", href: "/ports", desc: "12 global port centers", color: "#f97316" },
  { icon: Bot, label: "AI Briefing", href: "/briefing", desc: "Gemini daily executive brief", color: "#a855f7" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard", desc: "Vessel performance rank", color: "#f59e0b" },
  { icon: Leaf, label: "ESG", href: "/esg", desc: "IMO 2030 sustainability", color: "#10b981" },
  { icon: Camera, label: "Cargo Vision", href: "/cargo-inspector", desc: "Gemini visual inspection", color: "#ec4899" },
  { icon: Lightbulb, label: "What-If Lab", href: "/whatif-lab", desc: "NL crisis simulation", color: "#6366f1" },
  { icon: DollarSign, label: "Carbon Market", href: "/carbon-market", desc: "Trade CO₂ credit savings", color: "#10b981" },
  { icon: ShieldCheck, label: "Blockchain Audit", href: "/audit", desc: "Cryptographic AI proof", color: "#84cc16" },
  { icon: Calculator, label: "Calculator", href: "/calculator", desc: "AI shipping cost quote", color: "#14b8a6" },
  { icon: FileText, label: "Report", href: "/report", desc: "Printable executive PDF", color: "#22c55e" },
  { icon: Activity, label: "Status", href: "/status", desc: "Live system health", color: "#10b981" },
  { icon: Sparkles, label: "Settings", href: "/settings", desc: "Tune AI parameters", color: "#64748b" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const [animStats, setAnimStats] = useState(false);
  const [liveStats, setLiveStats] = useState([
    { v: "15", label: "Live Vessels" },
    { v: "$4.2M", label: "Daily Savings" },
    { v: "1,240t", label: "CO₂ Prevented" },
    { v: "< 2s", label: "AI Response" },
    { v: "18", label: "Platform Pages" },
    { v: "99.8%", label: "Uptime" },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setAnimStats(true), 600);
    const fetchLive = async () => {
      try {
        const [metrics, fleet] = await Promise.all([apiFetch("/metrics"), apiFetch("/fleet")]);
        const vessels = fleet?.ships?.length ?? 15;
        const resolved = metrics?.total_alerts_resolved ?? 0;
        const co2 = metrics?.total_co2_saved_tons ?? 0;
        const savings = resolved * 112500;
        setLiveStats([
          { v: String(vessels), label: "Live Vessels" },
          { v: savings >= 1e6 ? `$${(savings / 1e6).toFixed(1)}M` : `$${Math.round(savings / 1000)}K`, label: "Daily Savings" },
          { v: co2 >= 1000 ? `${(co2 / 1000).toFixed(1)}kt` : `${co2}t`, label: "CO₂ Prevented" },
          { v: "< 2s", label: "AI Response" },
          { v: "18", label: "Platform Pages" },
          { v: "99.8%", label: "Uptime" },
        ]);
      } catch {}
    };
    fetchLive();
    return () => clearTimeout(t);
  }, []);

  const gradText = {
    background: "linear-gradient(135deg, #3b82f6 0%, #10b981 50%, #a855f7 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#060818" }}>
      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8"
        style={{ background: "rgba(6,8,24,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Globe2 size={16} className="text-white" />
            </div>
            <span className="font-black text-sm" style={gradText}>Smart Supply Chain AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/status" className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All Systems Live
            </Link>
            <Link href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
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
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6">
          <Star size={12} fill="currentColor" /> Google H2S Hackathon 2026 · Powered by Gemini 3 Flash
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 max-w-5xl">
          <span className="text-white">The AI That Protects </span>
          <span style={gradText}>$Billions in Cargo</span>
          <br /><span className="text-white">Before Disaster Strikes</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Industrial-grade AI command center. 15 live vessels. 12 global ports. Gemini 3 autonomously detects, analyzes, and resolves disruptions — <strong className="text-white">in real-time</strong>.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="flex items-center gap-4 flex-wrap justify-center mb-14">
          <Link href="/dashboard"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-black text-white hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 40px rgba(59,130,246,0.5)" }}>
            <Play size={16} fill="white" /> Launch Dashboard
          </Link>
          <Link href="/scenarios"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold border border-white/15 hover:bg-white/5 transition-all"
            style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <Zap size={16} /> Try AI Scenarios
          </Link>
        </motion.div>

        {/* Animated stats */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}
          className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl w-full">
          {liveStats.map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-xl md:text-2xl font-black text-white">{s.v}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── QUICK START ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/8" style={{ background: "rgba(59,130,246,0.03)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-4">
              <Play size={11} fill="currentColor" /> START HERE
            </span>
            <h2 className="text-4xl font-black text-white">Your 4-Step Demo Guide</h2>
            <p className="text-gray-500 mt-3 text-lg">Follow these steps to see the full power of the platform in 3 minutes.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_START.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={item.href}
                  className="flex flex-col gap-3 p-5 rounded-2xl border border-white/8 hover:border-white/20 transition-all group h-full"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black" style={{ color: item.color + "60" }}>{item.step}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: item.color + "20" }}>
                      <item.icon size={18} style={{ color: item.color }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="mt-auto text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: item.color }}>
                    {item.cta} <ChevronRight size={12} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ALL PAGES GRID ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full mb-4">
              <Globe2 size={11} /> 18 PAGES · EVERYTHING
            </span>
            <h2 className="text-4xl font-black text-white">Every Tool in One Platform</h2>
            <p className="text-gray-500 mt-3 text-lg">Click any card to go directly to that feature.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {ALL_PAGES.map((page, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
                <Link href={page.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/8 hover:border-white/20 text-center transition-all group hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.025)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: page.color + "20" }}>
                    <page.icon size={18} style={{ color: page.color }} />
                  </div>
                  <p className="text-xs font-bold text-white">{page.label}</p>
                  <p className="text-[9px] text-gray-600 leading-snug">{page.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/8" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-4">From Alert to Resolution in 4 Steps</h2>
            <p className="text-gray-500 text-lg">Autonomous workflow — no human required.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: AlertTriangle, color: "#f97316", step: "01", title: "Disruption Detected", desc: "AI sensors detect weather, congestion, or delay anomalies across all 15 vessels simultaneously." },
              { icon: Bot, color: "#a855f7", step: "02", title: "Gemini Analyzes", desc: "Function Calling agents autonomously query fleet status, port availability, and weather data." },
              { icon: RefreshCw, color: "#3b82f6", step: "03", title: "Route Optimized", desc: "Optimal alternative route selected, minimizing delay, cost, and carbon footprint." },
              { icon: CheckCircle, color: "#10b981", step: "04", title: "Cargo Protected", desc: "Vessels rerouted, stakeholders notified, savings logged. Average: $45K saved per reroute." },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center gap-4">
                {i > 0 && <div className="hidden md:block absolute -left-4 top-8 h-px w-8 bg-white/15" />}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 relative"
                  style={{ background: `${step.color}18`, boxShadow: `0 0 30px ${step.color}25` }}>
                  <step.icon size={24} style={{ color: step.color }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-black text-white flex items-center justify-center" style={{ background: step.color }}>{step.step}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KEYBOARD TIPS ────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-black text-white mb-2">Pro Tips</h2>
            <p className="text-gray-600 text-sm mb-8">Master the platform with these power-user shortcuts</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { keys: ["⌘", "K"], desc: "Command Palette" },
                { keys: ["⌘", "/"], desc: "Global Search" },
                { keys: ["?"], desc: "All Shortcuts" },
                { keys: ["🧭", "Tour"], desc: "Guided Tour" },
              ].map((tip, i) => (
                <div key={i} className="glass-panel rounded-xl p-4 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    {tip.keys.map((k, j) => (
                      <kbd key={j} className="px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-black text-white">{k}</kbd>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600">{tip.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden border-t border-white/8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[120px] opacity-20" style={{ background: "radial-gradient(ellipse, #3b82f6, transparent)" }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to See It Live?</h2>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">Open the industrial dashboard and watch Gemini AI protect your fleet in real-time.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/dashboard"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-black text-white hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)", boxShadow: "0 8px 60px rgba(59,130,246,0.6)" }}>
              <Play size={20} fill="white" /> Launch Dashboard
            </Link>
            <Link href="/leaderboard"
              className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl text-base font-bold text-white border border-white/15 hover:bg-white/5 transition-all">
              <Trophy size={18} className="text-yellow-400" /> Fleet Leaderboard
            </Link>
          </div>
          <p className="text-gray-700 text-xs mt-8">No signup · No credit card · Open source · 18 pages · Google H2S Hackathon 2026</p>
        </motion.div>
      </section>

      <footer className="border-t border-white/8 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Globe2 size={13} className="text-white" />
            </div>
            <span className="text-xs text-gray-600">Smart Supply Chain AI v2.0 · Built by Kiran Biradar</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-700">
            {[["Dashboard", "/dashboard"], ["ESG", "/esg"], ["Status", "/status"], ["GitHub", "https://github.com/kirancodes-dev/SmartSupplyChain"]].map(([label, href]) => (
              <Link key={label} href={href} className="hover:text-gray-400 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
