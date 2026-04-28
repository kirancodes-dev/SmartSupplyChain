"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, Anchor, Wind, X } from "lucide-react";
import { useState } from "react";

/*
  Equirectangular projection — all coordinates computed from real lat/lng:
    x = (lng + 180) / 360 * 600
    y = (90  - lat) / 180 * 300
*/
const LAND: Record<string, string> = {
  northAmerica:
    "M 39,31 L 65,37 L 75,55 L 95,68 L 103,93 L 117,112 L 150,125 L 162,135 " +
    "L 167,108 L 175,92 L 183,80 L 193,77 L 212,70 L 200,58 L 167,30 L 133,17 Z",
  southAmerica:
    "M 172,133 L 197,133 L 242,163 L 228,188 L 203,207 L 187,243 L 183,238 " +
    "L 180,205 L 165,158 L 172,143 Z",
  europe:
    "M 285,87 L 288,65 L 292,53 L 342,32 L 352,50 L 360,82 L 348,82 " +
    "L 340,88 L 323,88 L 300,88 L 293,70 Z",
  africa:
    "M 290,92 L 272,125 L 277,135 L 293,142 L 305,140 L 317,143 L 315,148 " +
    "L 320,175 L 325,195 L 330,207 L 352,200 L 367,160 L 385,132 " +
    "L 363,117 L 357,100 L 322,95 L 317,88 L 300,92 Z",
  asia:
    "M 345,88 L 392,58 L 400,40 L 433,37 L 525,30 L 570,50 " +
    "L 518,78 L 503,98 L 480,123 L 467,142 L 452,113 L 433,137 " +
    "L 412,110 L 400,88 L 377,80 L 360,82 Z",
  australia:
    "M 518,170 L 490,187 L 493,203 L 530,208 L 542,213 L 552,207 L 555,195 L 537,167 Z",
  greenland:
    "M 227,50 L 258,30 L 222,18 L 187,22 L 210,47 Z",
  japan:
    "M 517,98 L 535,78 L 542,83 L 527,95 Z",
  newZealand:
    "M 557,237 L 563,248 L 557,255 L 553,247 Z",
  uk:
    "M 288,65 L 302,63 L 297,55 L 289,58 Z",
  indonesia:
    "M 468,150 L 480,148 L 490,155 L 505,155 L 513,162 L 498,167 L 480,162 Z",
};

const STATUS_COLORS: Record<string, { bg: string; glow: string; label: string }> = {
  "on-time":  { bg: "#10b981", glow: "#10b98150", label: "On Time" },
  "at-risk":  { bg: "#f97316", glow: "#f9731650", label: "At Risk" },
  "rerouted": { bg: "#3b82f6", glow: "#3b82f650", label: "Rerouted" },
  "delayed":  { bg: "#ef4444", glow: "#ef444450", label: "Delayed" },
};

const PORT_COLORS: Record<string, { bg: string; ring: string }> = {
  "Clear":     { bg: "#10b981", ring: "#10b98130" },
  "Moderate":  { bg: "#f59e0b", ring: "#f59e0b30" },
  "Congested": { bg: "#ef4444", ring: "#ef444430" },
};

export default function DashboardMap({ state }: { state: any }) {
  const [selectedShip, setSelectedShip] = useState<any>(null);
  const [hoveredPort, setHoveredPort]   = useState<any>(null);

  if (!state) return (
    <div className="glass-panel w-full h-[580px] rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-300/60 text-sm">Loading global telemetry...</p>
      </div>
    </div>
  );

  const project = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 600,
    y: ((90 - lat) / 180) * 300,
  });

  const atRisk   = state.ships?.filter((s: any) => s.status === "at-risk").length  || 0;
  const onTime   = state.ships?.filter((s: any) => s.status === "on-time").length  || 0;
  const rerouted = state.ships?.filter((s: any) => s.status === "rerouted").length || 0;

  return (
    <div className="glass-panel w-full h-[580px] relative overflow-hidden rounded-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/30 rounded-t-2xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Wind size={14} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Global Route Map</h2>
            <p className="text-xs text-gray-500">Click any vessel for live details</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{onTime} On Time
          </span>
          <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-400" />{atRisk} At Risk
          </span>
          <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400" />{rerouted} Rerouted
          </span>
        </div>
      </div>

      {/* Map SVG */}
      <div className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg, #060e1f 0%, #04091a 100%)" }}>

        {/* Latitude/longitude grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="mapCenter" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="600" height="300" fill="url(#mapCenter)" />
          {/* Lat lines every 30° */}
          {[30,60,90,120,150,180,210,240].map(y => (
            <line key={y} x1="0" y1={y} x2="600" y2={y}
              stroke="rgba(59,130,246,0.08)" strokeWidth="0.4" />
          ))}
          {/* Lng lines every 30° */}
          {[0,60,120,180,240,300,360,420,480,540,600].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="300"
              stroke="rgba(59,130,246,0.08)" strokeWidth="0.4" />
          ))}
          {/* Equator */}
          <line x1="0" y1="150" x2="600" y2="150"
            stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" strokeDasharray="5,4" />
          {/* Prime meridian */}
          <line x1="300" y1="0" x2="300" y2="300"
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        </svg>

        {/* Continents + features */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice">

          {/* Land masses */}
          {Object.entries(LAND).map(([name, d]) => (
            <path key={name} d={d}
              fill="rgba(25,45,80,0.75)"
              stroke="rgba(100,149,237,0.35)"
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
          ))}

          {/* Weather zones */}
          {state.weather?.map((w: any) => {
            const pos = project(w.lat, w.lng);
            const r = Math.max(10, (w.radius_km || 300) / 20);
            return (
              <g key={w.id}>
                <circle cx={pos.x} cy={pos.y} r={r * 2.8} fill="rgba(239,68,68,0.03)" />
                <circle cx={pos.x} cy={pos.y} r={r * 1.6} fill="rgba(239,68,68,0.07)" />
                <circle cx={pos.x} cy={pos.y} r={r}
                  fill="rgba(239,68,68,0.13)" stroke="rgba(239,68,68,0.55)"
                  strokeWidth="0.8" strokeDasharray="3,2" />
                <text x={pos.x} y={pos.y - r - 5} textAnchor="middle"
                  fill="rgba(252,165,165,0.9)" fontSize="7.5" fontWeight="700">
                  ⚠ {(w.type || "STORM").toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Ship route lines */}
          {state.ships?.map((s: any) => {
            const from = project(s.lat, s.lng);
            const dest = state.ports?.find((p: any) => p.id === s.destination);
            if (!dest) return null;
            const to = project(dest.lat, dest.lng);
            const col = STATUS_COLORS[s.status]?.bg || "#fff";
            return (
              <line key={`r-${s.id}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={col} strokeWidth="0.9" strokeDasharray="5,4" opacity="0.3" />
            );
          })}

          {/* Ports */}
          {state.ports?.map((p: any) => {
            const pos = project(p.lat, p.lng);
            const pc = PORT_COLORS[p.status] || PORT_COLORS["Clear"];
            return (
              <g key={p.id} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPort(p)}
                onMouseLeave={() => setHoveredPort(null)}>
                <circle cx={pos.x} cy={pos.y} r={9}  fill={pc.ring} />
                <circle cx={pos.x} cy={pos.y} r={5.5} fill={pc.bg} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
                <text x={pos.x} y={pos.y + 15} textAnchor="middle"
                  fill="rgba(255,255,255,0.75)" fontSize="6" fontWeight="700">
                  {p.name.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Ships */}
          {state.ships?.map((s: any) => {
            const pos = project(s.lat, s.lng);
            const sc  = STATUS_COLORS[s.status] || STATUS_COLORS["on-time"];
            const isSelected = selectedShip?.id === s.id;
            return (
              <g key={s.id} style={{ cursor: "pointer" }}
                onClick={() => setSelectedShip(isSelected ? null : s)}>
                {/* Glow */}
                <circle cx={pos.x} cy={pos.y} r={isSelected ? 16 : 11} fill={sc.glow} />
                {/* Pulse ring for at-risk */}
                {s.status === "at-risk" && (
                  <circle cx={pos.x} cy={pos.y} r="10" fill="none" stroke={sc.bg} strokeWidth="0.8" opacity="0.5">
                    <animate attributeName="r" values="7;16;7" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Ship body */}
                <circle cx={pos.x} cy={pos.y} r={isSelected ? 8 : 6}
                  fill={sc.bg} stroke="white" strokeWidth={isSelected ? 2 : 1.2} />
                {/* Ship arrow */}
                <path d={`M ${pos.x} ${pos.y - 3.5} L ${pos.x + 2.5} ${pos.y + 2.5} L ${pos.x - 2.5} ${pos.y + 2.5} Z`}
                  fill="white" opacity="0.85" />
                {/* Ship ID */}
                <text x={pos.x} y={pos.y - 11} textAnchor="middle"
                  fill={sc.bg} fontSize="6.5" fontWeight="800">
                  {s.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected ship detail card */}
        <AnimatePresence>
          {selectedShip && (() => {
            const dest = state.ports?.find((p: any) => p.id === selectedShip.destination);
            const sc = STATUS_COLORS[selectedShip.status] || STATUS_COLORS["on-time"];
            return (
              <motion.div
                key="ship-detail"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-3 right-3 w-64 rounded-xl border z-20 overflow-hidden"
                style={{ background: "rgba(4,6,15,0.96)", borderColor: sc.bg + "40",
                  boxShadow: `0 0 24px ${sc.glow}` }}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8"
                  style={{ background: sc.bg + "15" }}>
                  <div className="flex items-center gap-2">
                    <Ship size={13} style={{ color: sc.bg }} />
                    <span className="text-sm font-bold text-white">{selectedShip.name}</span>
                  </div>
                  <button onClick={() => setSelectedShip(null)} className="text-gray-600 hover:text-white transition-colors">
                    <X size={13} />
                  </button>
                </div>

                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    ["Status",   <span key="s" className="font-bold" style={{ color: sc.bg }}>{sc.label}</span>],
                    ["Risk",     <span key="r" className={`font-bold ${selectedShip.risk_score > 70 ? "text-red-400" : selectedShip.risk_score > 40 ? "text-orange-400" : "text-emerald-400"}`}>{selectedShip.risk_score}/100</span>],
                    ["Cargo",    selectedShip.cargo],
                    ["Value",    `$${((selectedShip.cargo_value_usd || 0) / 1e6).toFixed(1)}M`],
                    ["Speed",    `${selectedShip.speed_knots} kn`],
                    ["ETA",      selectedShip.eta || "—"],
                    ["Origin",   selectedShip.origin],
                    ["Dest.",    dest?.name?.split(" ")[0] || selectedShip.destination],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wide">{k}</p>
                      <div className="text-xs text-gray-200 font-semibold mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Mini route viz */}
                <div className="px-3 pb-3">
                  <div className="rounded-lg overflow-hidden border border-white/8" style={{ background: "#060e1f" }}>
                    <div className="flex items-center justify-between px-2 py-1.5 text-[9px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.bg }} />
                        {selectedShip.lat?.toFixed(2)}°, {selectedShip.lng?.toFixed(2)}°
                      </span>
                      <span className="flex items-center gap-1">
                        <Anchor size={8} className="text-blue-400" />
                        {dest?.name || selectedShip.destination}
                      </span>
                    </div>
                    {/* Progress bar toward destination */}
                    <div className="px-2 pb-2">
                      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(5, 100 - (selectedShip.risk_score || 50))}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ background: `linear-gradient(90deg, ${sc.bg}, ${sc.bg}88)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-gray-700 mt-0.5">
                        <span>{selectedShip.origin}</span>
                        <span>{dest?.name?.split(" ")[0] || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Port hover tooltip */}
        <AnimatePresence>
          {hoveredPort && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 left-4 glass-bright p-3 rounded-xl text-xs z-20 min-w-[160px] pointer-events-none"
            >
              <p className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <span>⚓</span>{hoveredPort.name}
              </p>
              <div className="space-y-1 text-gray-300">
                <p>Status: <span className={`font-bold ${hoveredPort.status === "Congested" ? "text-red-400" : hoveredPort.status === "Moderate" ? "text-yellow-400" : "text-emerald-400"}`}>{hoveredPort.status}</span></p>
                <p>Load: <span className="text-blue-300">{hoveredPort.current_load}/{hoveredPort.capacity}</span></p>
                <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (hoveredPort.current_load / hoveredPort.capacity) * 100)}%`,
                      background: hoveredPort.status === "Congested" ? "#ef4444" : hoveredPort.status === "Moderate" ? "#f59e0b" : "#10b981",
                    }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass-bright px-3 py-2 rounded-xl flex items-center gap-3 text-[10px] z-10">
          {Object.entries(STATUS_COLORS).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: cfg.bg }} />
              <span className="text-gray-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-700 z-10">
          Click vessel to inspect
        </div>
      </div>
    </div>
  );
}
