"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default function FleetHealthGauge({ state, metrics }: { state: any; metrics: any }) {
  const ships = state?.ships || [];

  const score = useMemo(() => {
    if (!ships.length) return 0;
    const weights = { "on-time": 100, "rerouted": 75, "at-risk": 30, "delayed": 10 };
    const total = ships.reduce((s: number, ship: any) => s + (weights[ship.status as keyof typeof weights] ?? 50), 0);
    return Math.round(total / ships.length);
  }, [ships]);

  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "At Risk" : "Critical";
  const Icon = score >= 75 ? TrendingUp : score >= 50 ? Minus : TrendingDown;

  // Gauge: 220deg arc from -200deg to 20deg (bottom left to bottom right)
  const startAngle = -200;
  const endAngle = 20;
  const range = endAngle - startAngle;
  const scoreAngle = startAngle + (score / 100) * range;

  const cx = 80, cy = 80, r = 60;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col items-center gap-3 border border-white/8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="text-sm font-bold text-white">Fleet Health Score</h3>
          <p className="text-[10px] text-gray-500">Real-time composite rating</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border`}
          style={{ color, borderColor: color + "40", background: color + "15" }}>
          <Icon size={12} /> {label}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="relative">
        <svg width="160" height="110" viewBox="0 0 160 110">
          {/* Background arc */}
          <path d={describeArc(cx, cy, r, startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
          {/* Colored progress arc */}
          <motion.path
            d={describeArc(cx, cy, r, startAngle, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
          {/* Needle dot */}
          <motion.circle
            cx={cx + r * Math.cos((scoreAngle * Math.PI) / 180)}
            cy={cy + r * Math.sin((scoreAngle * Math.PI) / 180)}
            r="7"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
          {/* Score text */}
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="26" fontWeight="900" fill="white">{score}</text>
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="9" fill="rgba(156,163,175,1)">/100</text>
        </svg>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {[
          { label: "On Time",   value: ships.filter((s: any) => s.status === "on-time").length,  color: "#10b981" },
          { label: "Rerouted", value: ships.filter((s: any) => s.status === "rerouted").length, color: "#3b82f6" },
          { label: "At Risk",  value: ships.filter((s: any) => s.status === "at-risk").length,  color: "#f97316" },
          { label: "Delayed",  value: ships.filter((s: any) => s.status === "delayed").length,   color: "#ef4444" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 glass-bright rounded-lg px-2.5 py-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-[10px] text-gray-500">{item.label}</span>
            <span className="text-xs font-black text-white ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
