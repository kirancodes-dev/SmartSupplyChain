"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Ship, Anchor, CloudLightning, Info, Wind, Thermometer } from "lucide-react";
import { useState } from "react";

// World map SVG paths (simplified continents)
const CONTINENTS_PATH = `
  M 130,60 L 160,55 L 175,65 L 170,80 L 155,90 L 140,85 L 125,75 Z
  M 160,95 L 175,90 L 185,100 L 180,120 L 165,125 L 155,115 L 150,100 Z
  M 195,58 L 260,50 L 275,60 L 280,90 L 260,110 L 230,115 L 200,100 L 190,80 L 195,58 Z
  M 250,120 L 270,115 L 275,130 L 265,155 L 250,160 L 235,145 L 240,125 Z
  M 290,50 L 395,42 L 420,60 L 430,90 L 410,120 L 380,130 L 340,125 L 300,115 L 280,90 L 290,50 Z
  M 320,130 L 360,125 L 370,145 L 355,170 L 330,172 L 315,155 Z
  M 415,70 L 475,65 L 490,80 L 480,110 L 450,120 L 420,110 L 410,90 Z
  M 440,120 L 470,115 L 480,135 L 470,165 L 445,170 L 430,150 Z
`;

export default function DashboardMap({ state }: { state: any }) {
  const [hoveredShip, setHoveredShip] = useState<any>(null);
  const [hoveredPort, setHoveredPort] = useState<any>(null);

  if (!state) return (
    <div className="glass-panel w-full h-[580px] shimmer rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-blue-300/60 text-sm font-medium">Loading global telemetry...</p>
      </div>
    </div>
  );

  // Map lat/lng to SVG viewBox (0-600 x 0-300)
  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 600;
    const y = ((90 - lat) / 180) * 300;
    return { x, y };
  };

  const shipColors: Record<string, { bg: string; glow: string; label: string }> = {
    'on-time': { bg: '#10b981', glow: '#10b98170', label: 'On Time' },
    'at-risk': { bg: '#f97316', glow: '#f9731670', label: 'At Risk' },
    'rerouted': { bg: '#3b82f6', glow: '#3b82f670', label: 'Rerouted' },
    'delayed': { bg: '#ef4444', glow: '#ef444470', label: 'Delayed' },
  };

  const portColors: Record<string, { bg: string; ring: string }> = {
    'Clear': { bg: '#10b981', ring: '#10b98140' },
    'Moderate': { bg: '#f59e0b', ring: '#f59e0b40' },
    'Congested': { bg: '#ef4444', ring: '#ef444440' },
  };

  const atRisk = state.ships?.filter((s: any) => s.status === 'at-risk').length || 0;
  const onTime = state.ships?.filter((s: any) => s.status === 'on-time').length || 0;
  const rerouted = state.ships?.filter((s: any) => s.status === 'rerouted').length || 0;

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
            <p className="text-[11px] text-gray-500">Real-time vessel tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>{onTime} On Time</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>{atRisk} At Risk</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>{rerouted} Rerouted</span>
        </div>
      </div>

      {/* Map SVG */}
      <div className="relative flex-1 bg-[#060e1f] overflow-hidden">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="30" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 30" fill="none" stroke="rgba(100,149,237,0.3)" strokeWidth="0.5"/>
            </pattern>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#mapGlow)" />
        </svg>

        {/* Ocean texture lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" preserveAspectRatio="none">
          {[30,60,90,120,150,180,210,240,270].map(y => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="4,8"/>
          ))}
          {[0,60,120,180,240,300,360,420,480,540,600].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="4,8"/>
          ))}
        </svg>

        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 300" 
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Continents */}
          <path d={CONTINENTS_PATH} fill="rgba(30,50,90,0.7)" stroke="rgba(100,149,237,0.4)" strokeWidth="0.8"/>
          
          {/* Equator line */}
          <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="6,4"/>
          
          {/* Weather Zones */}
          {state.weather?.map((w: any) => {
            const pos = project(w.lat, w.lng);
            const r = Math.max(12, w.radius_km / 18);
            return (
              <g key={w.id}>
                <circle cx={pos.x} cy={pos.y} r={r * 2.5} fill="rgba(239,68,68,0.04)" />
                <circle cx={pos.x} cy={pos.y} r={r * 1.5} fill="rgba(239,68,68,0.08)" />
                <circle cx={pos.x} cy={pos.y} r={r} fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" strokeDasharray="3,2"/>
                <text x={pos.x} y={pos.y - r - 4} textAnchor="middle" fill="rgba(239,68,68,0.9)" fontSize="7" fontWeight="700">
                  ⚠ {w.type || 'STORM'}
                </text>
              </g>
            );
          })}

          {/* Ship route lines (dashed) */}
          {state.ships?.map((s: any) => {
            const from = project(s.lat, s.lng);
            const destPort = state.ports?.find((p: any) => p.id === s.destination);
            if (!destPort) return null;
            const to = project(destPort.lat, destPort.lng);
            const color = shipColors[s.status]?.bg || '#fff';
            return (
              <line key={`route-${s.id}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={color} strokeWidth="0.8" strokeDasharray="5,4" opacity="0.35"
              />
            );
          })}

          {/* Ports */}
          {state.ports?.map((p: any) => {
            const pos = project(p.lat, p.lng);
            const pc = portColors[p.status] || portColors['Clear'];
            return (
              <g key={p.id} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPort(p)} onMouseLeave={() => setHoveredPort(null)}>
                <circle cx={pos.x} cy={pos.y} r={10} fill={pc.ring} />
                <circle cx={pos.x} cy={pos.y} r={6} fill={pc.bg} stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <text x={pos.x} y={pos.y + 16} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="6.5" fontWeight="700">{p.name.split(' ')[0]}</text>
              </g>
            );
          })}

          {/* Ships */}
          {state.ships?.map((s: any) => {
            const pos = project(s.lat, s.lng);
            const sc = shipColors[s.status] || shipColors['on-time'];
            return (
              <g key={s.id} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredShip(s)} onMouseLeave={() => setHoveredShip(null)}>
                <circle cx={pos.x} cy={pos.y} r={12} fill={sc.glow} />
                <circle cx={pos.x} cy={pos.y} r={7} fill={sc.bg} stroke="white" strokeWidth="1.5"/>
                {/* Ship icon: simple triangle */}
                <path d={`M ${pos.x} ${pos.y - 4} L ${pos.x + 3} ${pos.y + 3} L ${pos.x - 3} ${pos.y + 3} Z`} fill="white" opacity="0.9"/>
                <text x={pos.x} y={pos.y - 14} textAnchor="middle" fill={sc.bg} fontSize="7" fontWeight="800">{s.id}</text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip for ships */}
        <AnimatePresence>
          {hoveredShip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 left-4 glass-bright p-4 rounded-xl text-xs z-30 min-w-[180px] pointer-events-none"
            >
              <p className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <span className="text-lg">🚢</span> {hoveredShip.name}
              </p>
              <div className="space-y-1 text-gray-300">
                <p>Status: <span className={`font-bold ${hoveredShip.status === 'at-risk' ? 'text-orange-400' : hoveredShip.status === 'rerouted' ? 'text-blue-400' : 'text-emerald-400'}`}>{shipColors[hoveredShip.status]?.label}</span></p>
                <p>Position: {hoveredShip.lat?.toFixed(2)}°, {hoveredShip.lng?.toFixed(2)}°</p>
                <p>Cargo: <span className="text-blue-300">{hoveredShip.cargo || 'Mixed Goods'}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover tooltip for ports */}
        <AnimatePresence>
          {hoveredPort && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 right-4 glass-bright p-4 rounded-xl text-xs z-30 min-w-[180px] pointer-events-none"
            >
              <p className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <span className="text-lg">⚓</span> {hoveredPort.name}
              </p>
              <div className="space-y-1 text-gray-300">
                <p>Status: <span className={`font-bold ${hoveredPort.status === 'Congested' ? 'text-red-400' : hoveredPort.status === 'Moderate' ? 'text-yellow-400' : 'text-emerald-400'}`}>{hoveredPort.status}</span></p>
                <p>Load: <span className="text-blue-300">{hoveredPort.current_load}/{hoveredPort.capacity}</span></p>
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${hoveredPort.status === 'Congested' ? 'bg-red-500' : hoveredPort.status === 'Moderate' ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (hoveredPort.current_load / hoveredPort.capacity) * 100)}%` }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass-bright px-3 py-2 rounded-xl flex items-center gap-4 text-[10px] z-10">
          {Object.entries(shipColors).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.bg }}></span>
              <span className="text-gray-400 capitalize">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
