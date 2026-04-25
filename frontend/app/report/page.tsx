"use client";
import { useEffect, useState, useRef } from "react";
import { fetchFleet, fetchMetrics, fetchOptimizationLog } from "@/lib/api";
import { Printer, Download, Globe2, Ship, AlertTriangle, Leaf, ShieldCheck, TrendingUp, CheckCircle, RefreshCw, Clock } from "lucide-react";

export default function ReportPage() {
  const [fleet, setFleet] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [log, setLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    Promise.all([fetchFleet(), fetchMetrics(), fetchOptimizationLog()])
      .then(([f, m, l]) => { setFleet(f); setMetrics(m); setLog(l); })
      .finally(() => setLoading(false));
  }, []);

  const ships = fleet?.ships || [];
  const atRisk = ships.filter((s: any) => s.status === "at-risk");
  const delayed = ships.filter((s: any) => s.status === "delayed");
  const rerouted = ships.filter((s: any) => s.status === "rerouted");
  const onTime = ships.filter((s: any) => s.status === "on-time");
  const totalValue = ships.reduce((s: number, v: any) => s + (v.cargo_value_usd || 0), 0);
  const totalCO2 = log.reduce((s: number, l: any) => s + (l.co2_saved || 0), 0);

  const STATUS_LABELS: Record<string, string> = {
    "on-time": "On Time", "at-risk": "At Risk", "delayed": "Delayed", "rerouted": "Rerouted"
  };

  return (
    <>
      {/* Screen-only controls */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold shadow-lg hover:bg-blue-600 transition-colors">
          <Printer size={15} /> Print / Save PDF
        </button>
        <button onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 border border-white/15 transition-colors">
          ← Back
        </button>
      </div>

      {/* Print-optimized report */}
      <div className="report-body" id="executive-report">
        {/* Cover */}
        <div className="report-cover">
          <div className="report-logo">
            <span className="report-logo-icon">🌐</span>
            <div>
              <h1 className="report-company">Smart Supply Chain AI</h1>
              <p className="report-tagline">Industrial AI Fleet Management · Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          <div className="report-title-block">
            <h2 className="report-title">Executive Briefing</h2>
            <h3 className="report-subtitle">Fleet Operations & AI Performance Report</h3>
            <p className="report-date">{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {now.toLocaleTimeString()}</p>
          </div>
          <div className="report-badge">CONFIDENTIAL — BOARD USE ONLY</div>
        </div>

        <div className="report-divider" />

        {/* Executive Summary */}
        <section className="report-section">
          <h2 className="report-section-title">📋 Executive Summary</h2>
          <div className="report-summary-grid">
            {[
              { icon: "🚢", label: "Total Vessels", value: ships.length, sub: "actively tracked" },
              { icon: "✅", label: "On Time", value: onTime.length, sub: `${ships.length ? Math.round(onTime.length/ships.length*100) : 0}% of fleet` },
              { icon: "⚠️", label: "At Risk / Delayed", value: atRisk.length + delayed.length, sub: "require attention" },
              { icon: "🔄", label: "AI Rerouted", value: rerouted.length, sub: "auto-resolved" },
              { icon: "💰", label: "Cargo Value", value: `$${(totalValue/1e6).toFixed(1)}M`, sub: "under protection" },
              { icon: "🌱", label: "CO₂ Prevented", value: `${totalCO2.toLocaleString()}t`, sub: "this session" },
              { icon: "🤖", label: "AI Decisions", value: log.length, sub: "optimization logs" },
              { icon: "🏭", label: "Ports Monitored", value: metrics?.total_ships || 12, sub: "global hubs" },
            ].map((item, i) => (
              <div key={i} className="report-kpi-card">
                <span className="report-kpi-icon">{item.icon}</span>
                <div className="report-kpi-value">{item.value}</div>
                <div className="report-kpi-label">{item.label}</div>
                <div className="report-kpi-sub">{item.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="report-divider" />

        {/* Fleet Status Table */}
        <section className="report-section">
          <h2 className="report-section-title">🚢 Fleet Status Register</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Vessel ID</th><th>Name</th><th>Status</th><th>Risk Score</th>
                <th>Cargo</th><th>Value (USD)</th><th>Origin → Dest.</th><th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {ships.map((s: any) => (
                <tr key={s.id} className={s.status === "at-risk" || s.status === "delayed" ? "report-row-alert" : s.status === "rerouted" ? "report-row-reroute" : ""}>
                  <td className="report-mono">{s.id}</td>
                  <td className="report-bold">{s.name}</td>
                  <td><span className={`report-status-badge report-status-${s.status}`}>{STATUS_LABELS[s.status] || s.status}</span></td>
                  <td className="report-center">{s.risk_score || 0}/100</td>
                  <td>{s.cargo}</td>
                  <td className="report-right">${((s.cargo_value_usd||0)/1e6).toFixed(1)}M</td>
                  <td className="report-mono">{s.origin} → {s.destination}</td>
                  <td>{s.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="report-divider" />

        {/* AI Audit Trail */}
        {log.length > 0 && (
          <section className="report-section">
            <h2 className="report-section-title">🛡️ AI Optimization Log (Audit Trail)</h2>
            <table className="report-table">
              <thead>
                <tr><th>#</th><th>Vessel</th><th>New Route</th><th>CO₂ Saved</th><th>Mode</th><th>Reason</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {log.slice(0, 20).map((entry: any, i: number) => (
                  <tr key={entry.id || i}>
                    <td className="report-mono report-center">#{String(entry.id || i).padStart(4,"0")}</td>
                    <td className="report-bold">{entry.ship_name || entry.ship_id}</td>
                    <td>→ {entry.new_destination}</td>
                    <td className="report-center">{entry.co2_saved || 0}t</td>
                    <td><span className={`report-status-badge ${entry.auto ? "report-status-rerouted" : "report-status-on-time"}`}>{entry.auto ? "Auto-Pilot" : "Manual"}</span></td>
                    <td className="report-small">{entry.reason || "AI route optimization"}</td>
                    <td className="report-small report-mono">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="report-divider" />

        {/* Economic Impact */}
        <section className="report-section">
          <h2 className="report-section-title">💰 Economic Impact Summary</h2>
          <div className="report-impact-grid">
            <div className="report-impact-card">
              <h4>Demurrage Costs Avoided</h4>
              <p className="report-impact-value">${(log.length * 45000).toLocaleString()}</p>
              <p className="report-impact-sub">Based on {log.length} AI reroutes × $45K avg. saved</p>
            </div>
            <div className="report-impact-card">
              <h4>Carbon Credits Value</h4>
              <p className="report-impact-value">${(totalCO2 * 65).toLocaleString()}</p>
              <p className="report-impact-sub">{totalCO2}t CO₂ × $65/ton market rate</p>
            </div>
            <div className="report-impact-card">
              <h4>Total Cargo Protected</h4>
              <p className="report-impact-value">${(totalValue/1e6).toFixed(1)}M</p>
              <p className="report-impact-sub">Under active AI monitoring</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="report-footer">
          <p>Smart Supply Chain AI v2.0 · Generated {now.toISOString()} · Powered by Gemini 2.0 Flash</p>
          <p>Google H2S Hackathon 2026 · Built by Kiran Biradar · Confidential</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .report-body {
          font-family: 'Inter', sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 48px 60px;
          background: white;
          color: #111827;
          min-height: 100vh;
        }
        .report-cover { margin-bottom: 32px; }
        .report-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
        .report-logo-icon { font-size: 32px; }
        .report-company { font-size: 22px; font-weight: 900; color: #1e40af; margin: 0; }
        .report-tagline { font-size: 11px; color: #6b7280; margin: 2px 0 0; }
        .report-title-block { text-align: center; padding: 32px 0; }
        .report-title { font-size: 36px; font-weight: 900; color: #111827; margin: 0 0 8px; }
        .report-subtitle { font-size: 16px; color: #374151; font-weight: 600; margin: 0 0 12px; }
        .report-date { font-size: 12px; color: #9ca3af; }
        .report-badge { text-align: center; display: inline-block; background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; font-size: 10px; font-weight: 800; padding: 4px 16px; border-radius: 999px; letter-spacing: 2px; margin: 0 auto; display: block; width: fit-content; }
        .report-divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
        .report-section { margin-bottom: 28px; }
        .report-section-title { font-size: 16px; font-weight: 800; color: #1e40af; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #dbeafe; }
        .report-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .report-kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; }
        .report-kpi-icon { font-size: 20px; display: block; margin-bottom: 6px; }
        .report-kpi-value { font-size: 22px; font-weight: 900; color: #1e40af; }
        .report-kpi-label { font-size: 11px; font-weight: 700; color: #374151; margin-top: 2px; }
        .report-kpi-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .report-table th { background: #1e40af; color: white; font-weight: 700; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-table td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
        .report-table tr:hover td { background: #f8fafc; }
        .report-row-alert td { background: #fff7ed !important; }
        .report-row-reroute td { background: #eff6ff !important; }
        .report-status-badge { padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
        .report-status-on-time { background: #d1fae5; color: #065f46; }
        .report-status-at-risk { background: #fed7aa; color: #92400e; }
        .report-status-delayed { background: #fee2e2; color: #991b1b; }
        .report-status-rerouted { background: #dbeafe; color: #1e40af; }
        .report-mono { font-family: monospace; font-size: 10px; }
        .report-bold { font-weight: 700; }
        .report-center { text-align: center; }
        .report-right { text-align: right; }
        .report-small { font-size: 10px; }
        .report-impact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .report-impact-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; }
        .report-impact-card h4 { font-size: 12px; font-weight: 700; color: #374151; margin: 0 0 8px; }
        .report-impact-value { font-size: 26px; font-weight: 900; color: #065f46; margin: 0 0 6px; }
        .report-impact-sub { font-size: 11px; color: #6b7280; }
        .report-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; line-height: 1.8; }
      `}</style>
    </>
  );
}
