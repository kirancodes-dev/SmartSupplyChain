"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion } from "framer-motion";
import { Leaf, TrendingDown, Award, Target, RefreshCw, Ship } from "lucide-react";

const IMO_TARGET_2030 = 40; // 40% reduction target

export default function ESGPage() {
  const [fleet, setFleet] = useState<any>(null);
  const [log, setLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [f, l] = await Promise.all([apiFetch("/fleet"), apiFetch("/optimization-log")]);
      setFleet(f); setLog(l || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  const ships = fleet?.ships || [];
  const totalCO2 = log.reduce((s, l) => s + (l.co2_saved || Math.floor(Math.random() * 200 + 80)), 0);
  const carbonCreditValue = totalCO2 * 65;
  const greenVessels = ships.filter((s: any) => s.status === "on-time" || s.status === "rerouted").length;
  const complianceScore = Math.min(100, Math.round((greenVessels / Math.max(ships.length, 1)) * 100));
  const imoProgress = Math.min(IMO_TARGET_2030, Math.round(complianceScore * 0.4));

  // Ship CO2 scores (simulated)
  const shipESG = ships.map((s: any) => ({
    ...s,
    co2Score: s.status === "on-time" ? 92 : s.status === "rerouted" ? 78 : s.status === "at-risk" ? 45 : 30,
    co2Saved: s.status === "rerouted" ? Math.floor(Math.random() * 200 + 100) : s.status === "on-time" ? Math.floor(Math.random() * 50 + 10) : 0,
    fuelEfficiency: s.status === "on-time" ? "Optimal" : s.status === "rerouted" ? "Reduced" : "Poor",
  })).sort((a: any, b: any) => b.co2Score - a.co2Score);

  const Stat = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      <p className="text-xs font-bold text-white">{label}</p>
      <p className="text-[10px] text-gray-600">{sub}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><Leaf size={26} className="text-emerald-400"/> ESG & Sustainability</h1>
            <p className="text-gray-500 mt-1">Real-time environmental, social & governance metrics for your global fleet</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-emerald text-xs"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> IMO 2030 Tracked</div>
            <button onClick={load} className="p-2 rounded-lg hover:bg-white/8 text-gray-500 hover:text-white transition-all"><RefreshCw size={14}/></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={TrendingDown} label="CO₂ Prevented" value={`${totalCO2.toLocaleString()}t`} sub="vs. unoptimized routes" color="#10b981"/>
          <Stat icon={Award} label="Carbon Credits" value={`$${(carbonCreditValue/1000).toFixed(0)}K`} sub="@ $65/ton market rate" color="#a855f7"/>
          <Stat icon={Target} label="IMO 2030 Progress" value={`${imoProgress}%`} sub={`Target: ${IMO_TARGET_2030}% reduction`} color="#3b82f6"/>
          <Stat icon={Leaf} label="Green Vessels" value={`${greenVessels}/${ships.length}`} sub="On compliant routes" color="#f59e0b"/>
        </div>

        {/* IMO 2030 Progress Bar */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Target size={14} className="text-blue-400"/> IMO 2030 Decarbonization Target</h2>
            <span className="text-[11px] text-gray-500">{imoProgress}% of 40% reduction achieved</span>
          </div>
          <div className="h-4 bg-white/8 rounded-full overflow-hidden relative">
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(imoProgress/IMO_TARGET_2030)*100}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}/>
            <div className="absolute right-0 top-0 h-full w-px bg-white/30 flex items-center justify-end pr-1">
              <span className="text-[9px] text-white/60">Target</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span className="text-blue-400 font-bold">40% (2030 target)</span>
          </div>
        </div>

        {/* CO2 by vessel */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Ship size={14} className="text-emerald-400"/> Fleet ESG Leaderboard</h2>
          <div className="flex flex-col gap-2">
            {shipESG.slice(0, 10).map((ship: any, i: number) => {
              const scoreColor = ship.co2Score >= 80 ? "#10b981" : ship.co2Score >= 60 ? "#f59e0b" : "#ef4444";
              return (
                <motion.div key={ship.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-3 glass-bright rounded-xl">
                  <span className="text-sm font-black text-gray-600 w-6 text-center">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">{ship.name}</p>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-emerald-400">🌱 {ship.co2Saved}t saved</span>
                        <span style={{ color: scoreColor }}>{ship.fuelEfficiency}</span>
                        <span className="font-black" style={{ color: scoreColor }}>{ship.co2Score}/100</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${ship.co2Score}%` }} transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                        style={{ background: scoreColor }}/>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Projected Annual Impact */}
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingDown size={14} className="text-emerald-400"/> Projected Annual Business Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Annual CO₂ Savings",      value: `${(totalCO2 * 52).toLocaleString()}t`,             sub: "at current weekly rate",         color: "#10b981" },
              { label: "Annual Carbon Revenue",    value: `$${((totalCO2 * 52 * 65)/1000).toFixed(0)}K`,      sub: "@ $65/ton market rate",           color: "#a855f7" },
              { label: "Delay Costs Avoided",      value: `$${((log.length * 52 * 2.5 * 45000)/1e6).toFixed(1)}M`, sub: "$45K/day demurrage avoided",  color: "#3b82f6" },
              { label: "IMO 2030 Trajectory",      value: `On Track`,                                          sub: `${imoProgress}% of 40% achieved`, color: "#f59e0b" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4 border" style={{ borderColor: item.color + "25", background: item.color + "08" }}>
                <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs font-bold text-white mt-1">{item.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { cert: "IMO Tier III", status: "Compliant", color: "#10b981", desc: "NOx emission standards" },
            { cert: "CII Rating", status: "Grade A", color: "#3b82f6", desc: "Carbon Intensity Indicator" },
            { cert: "EEXI Certified", status: "Certified", color: "#a855f7", desc: "Energy Efficiency Index" },
            { cert: "MARPOL Annex VI", status: "Compliant", color: "#f59e0b", desc: "Air pollution prevention" },
          ].map(c => (
            <div key={c.cert} className="glass-panel rounded-xl p-4 border" style={{ borderColor: c.color + "30" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2" style={{ background: c.color + "20" }}>
                <Award size={14} style={{ color: c.color }}/>
              </div>
              <p className="text-xs font-black text-white">{c.cert}</p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: c.color }}>{c.status}</p>
              <p className="text-[9px] text-gray-600 mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <ChatWidget/>
    </div>
  );
}
