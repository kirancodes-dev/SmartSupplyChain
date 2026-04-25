"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import { Settings, Zap, Bell, Gauge, Eye, Bot, Save, RotateCcw } from "lucide-react";
import { toggleAutopilot, apiFetch } from "@/lib/api";
import { showToast } from "@/components/ToastProvider";
import { motion } from "framer-motion";

const DEFAULTS = {
  riskThreshold: 60,
  simSpeed: 1,
  autoPilot: false,
  alertsEnabled: true,
  soundEnabled: false,
  toastEnabled: true,
  co2Rate: 65,
  demurrageRate: 45000,
};

type Settings = typeof DEFAULTS;

const STORAGE_KEY = "ssc_settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    showToast({ type: "success", title: "Settings Saved", message: "Your preferences have been applied." });
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    showToast({ type: "info", title: "Reset to Defaults", message: "All settings restored to default values." });
  };

  const Section = ({ icon: Icon, color, title, children }: any) => (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2.5" style={{ background: `${color}08` }}>
        <Icon size={15} style={{ color }} />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );

  const Row = ({ label, desc, children }: any) => (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all ${value ? "bg-blue-500" : "bg-white/10"}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-6" : "left-1"}`} />
    </button>
  );

  const Slider = ({ value, min, max, step, onChange, format }: any) => (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-32 accent-blue-500" />
      <span className="text-sm font-bold text-blue-300 w-16 text-right">{format ? format(value) : value}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2"><Settings size={20} className="text-blue-400"/> Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Configure simulation, AI, and alert preferences</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <RotateCcw size={12}/> Reset
            </button>
            <button onClick={save} className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold text-white transition-all ${saved ? "bg-emerald-500" : "bg-blue-500 hover:bg-blue-600"}`}>
              <Save size={12}/> {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <Section icon={Gauge} color="#3b82f6" title="Simulation">
          <Row label="Simulation Speed" desc="Controls how fast the supply chain simulation runs">
            <Slider value={settings.simSpeed} min={1} max={10} step={1} onChange={(v: number) => set("simSpeed", v)} format={(v: number) => `${v}×`} />
          </Row>
          <Row label="Risk Score Threshold" desc="Ships above this score are flagged as 'at-risk'">
            <Slider value={settings.riskThreshold} min={20} max={90} step={5} onChange={(v: number) => set("riskThreshold", v)} format={(v: number) => `${v}/100`} />
          </Row>
        </Section>

        <Section icon={Bot} color="#a855f7" title="AI & Auto-Pilot">
          <Row label="Auto-Pilot Mode" desc="Gemini AI autonomously reroutes at-risk vessels">
            <Toggle value={settings.autoPilot} onChange={v => set("autoPilot", v)} />
          </Row>
        </Section>

        <Section icon={Bell} color="#f97316" title="Alerts & Notifications">
          <Row label="Toast Notifications" desc="Show popup alerts when ship status changes">
            <Toggle value={settings.toastEnabled} onChange={v => set("toastEnabled", v)} />
          </Row>
          <Row label="Alert Ticker" desc="Show scrolling alert ticker below the navbar">
            <Toggle value={settings.alertsEnabled} onChange={v => set("alertsEnabled", v)} />
          </Row>
        </Section>

        <Section icon={Zap} color="#10b981" title="Economic Calculations">
          <Row label="Carbon Credit Rate ($/ton)" desc="Market rate used for CO₂ savings calculation">
            <Slider value={settings.co2Rate} min={20} max={150} step={5} onChange={(v: number) => set("co2Rate", v)} format={(v: number) => `$${v}`} />
          </Row>
          <Row label="Demurrage Rate ($/reroute)" desc="Avg. cost avoided per AI rerouting action">
            <Slider value={settings.demurrageRate} min={10000} max={100000} step={5000} onChange={(v: number) => set("demurrageRate", v)} format={(v: number) => `$${(v/1000).toFixed(0)}K`} />
          </Row>
        </Section>

        <Section icon={Eye} color="#3b82f6" title="Quick Links">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "View Executive Report", href: "/report", color: "#3b82f6" },
              { label: "AI Architecture Diagram", href: "/architecture", color: "#a855f7" },
              { label: "Audit Trail", href: "/audit", color: "#10b981" },
              { label: "Open API Docs", href: "http://localhost:8000/docs", color: "#f97316", external: true },
            ].map(link => (
              <a key={link.label} href={link.href} target={link.external ? "_blank" : undefined} rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: link.color }} />
                {link.label}
              </a>
            ))}
          </div>
        </Section>

        <p className="text-center text-xs text-gray-700 pb-4">
          Smart Supply Chain AI v2.0 · Settings stored in browser localStorage
        </p>
      </main>
    </div>
  );
}
