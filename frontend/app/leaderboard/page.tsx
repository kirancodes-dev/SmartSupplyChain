"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Ship, ArrowRight } from "lucide-react";

type ShipScore = {
  id: string; name: string; vessel_type: string; cargo: string; flag: string;
  status: string; risk_score: number; cargo_value_usd: number; eta: string;
  perf: number; rank: number; delta: number;
};

function calcPerf(ship: any): number {
  const statusScore = { "on-time": 100, "rerouted": 75, "at-risk": 30, "delayed": 10 }[ship.status as string] ?? 50;
  const riskScore = Math.max(0, 100 - (ship.risk_score || 50));
  const valueScore = Math.min(100, (ship.cargo_value_usd || 0) / 50000000 * 100);
  return Math.round(statusScore * 0.5 + riskScore * 0.35 + valueScore * 0.15);
}

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  "on-time":  { color: "#10b981", label: "On Time" },
  "rerouted": { color: "#3b82f6", label: "Rerouted" },
  "at-risk":  { color: "#f97316", label: "At Risk" },
  "delayed":  { color: "#ef4444", label: "Delayed" },
};

export default function LeaderboardPage() {
  const [ships, setShips] = useState<ShipScore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiFetch("/fleet");
      const ranked = (res?.ships || [])
        .map((s: any) => ({ ...s, perf: calcPerf(s) }))
        .sort((a: any, b: any) => b.perf - a.perf)
        .map((s: any, i: number) => ({ ...s, rank: i + 1, delta: Math.floor(Math.random() * 3) - 1 }));
      setShips(ranked);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const top3 = ships.slice(0, 3);
  const rest = ships.slice(3);

  const MedalIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-sm font-black text-gray-600">#{rank}</span>;
  };

  const DeltaIcon = ({ d }: { d: number }) => d > 0 ? <TrendingUp size={11} className="text-emerald-400"/> : d < 0 ? <TrendingDown size={11} className="text-red-400"/> : <Minus size={11} className="text-gray-600"/>;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3"><Trophy size={26} className="text-yellow-400"/> Fleet Performance Leaderboard</h1>
          <p className="text-gray-500 mt-1">Real-time vessel rankings by composite performance score · Updates every 8 seconds</p>
        </div>

        {/* Podium — top 3 */}
        <div className="grid grid-cols-3 gap-4">
          {[top3[1], top3[0], top3[2]].map((ship, podiumIdx) => {
            if (!ship) return <div key={podiumIdx}/>;
            const heights = ["h-28", "h-36", "h-24"];
            const status = STATUS_STYLES[ship.status] || STATUS_STYLES["on-time"];
            return (
              <motion.div key={ship.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIdx * 0.1 }}
                className="glass-panel rounded-2xl p-4 flex flex-col items-center gap-2 text-center border"
                style={{ borderColor: (podiumIdx === 1 ? "#f59e0b" : podiumIdx === 0 ? "#9ca3af" : "#cd7c2e") + "40" }}>
                <MedalIcon rank={ship.rank} />
                <p className="text-sm font-black text-white">{ship.name}</p>
                <p className="text-[10px] text-gray-500 truncate w-full">{ship.cargo}</p>
                <div className="text-2xl font-black text-white">{ship.perf}</div>
                <p className="text-[9px] text-gray-600">Performance Score</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: status.color, background: status.color + "20" }}>{status.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Ship size={14} className="text-blue-400"/> All {ships.length} Vessels</h2>
            <span className="text-[10px] text-gray-600">Ranked by performance · risk · cargo value</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {["Rank", "Vessel", "Type", "Status", "Risk Score", "Perf Score", "Cargo Value", "ETA", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ships.map((ship, i) => {
                  const status = STATUS_STYLES[ship.status] || STATUS_STYLES["on-time"];
                  const perfColor = ship.perf >= 75 ? "#10b981" : ship.perf >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                    <motion.tr key={ship.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MedalIcon rank={ship.rank}/>
                          <DeltaIcon d={ship.delta}/>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-white">{ship.name}</p>
                        <p className="text-[10px] text-gray-600">{ship.flag}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{ship.vessel_type}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: status.color, background: status.color + "20" }}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${ship.risk_score}%` }}/>
                          </div>
                          <span className="text-[11px] text-white font-bold">{ship.risk_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${ship.perf}%`, background: perfColor }}/>
                          </div>
                          <span className="text-[11px] font-black" style={{ color: perfColor }}>{ship.perf}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400">${((ship.cargo_value_usd || 0)/1e6).toFixed(0)}M</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{ship.eta}</td>
                      <td className="px-4 py-3">
                        <Link href={`/track/${ship.id}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] font-semibold">Track <ArrowRight size={11}/></Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <ChatWidget/>
    </div>
  );
}
