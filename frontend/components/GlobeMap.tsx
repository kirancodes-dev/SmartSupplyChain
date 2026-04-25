"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Wind } from "lucide-react";

// Must be dynamically imported — globe.gl uses WebGL (browser only)
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  "on-time":  "#10b981",
  "at-risk":  "#f97316",
  "delayed":  "#ef4444",
  "rerouted": "#3b82f6",
};

const PORT_COLORS: Record<string, string> = {
  "Clear":     "#10b981",
  "Moderate":  "#f59e0b",
  "Congested": "#ef4444",
};

export default function GlobeMap({ state }: { state: any }) {
  const ships = state?.ships || [];
  const ports = state?.ports || [];
  const weather = state?.weather || [];

  // Arc data: ship → destination port
  const arcs = useMemo(() => ships.map((s: any) => {
    const dest = ports.find((p: any) => p.id === s.destination);
    if (!dest) return null;
    return {
      startLat: s.lat, startLng: s.lng,
      endLat: dest.lat, endLng: dest.lng,
      color: STATUS_COLORS[s.status] || "#fff",
      label: `${s.name} → ${dest.name}`,
    };
  }).filter(Boolean), [ships, ports]);

  // All points: ships + ports
  const points = useMemo(() => [
    ...ships.map((s: any) => ({
      lat: s.lat, lng: s.lng,
      size: 0.6,
      color: STATUS_COLORS[s.status] || "#fff",
      label: `🚢 ${s.name}\nStatus: ${s.status}\nCargo: ${s.cargo} ($${((s.cargo_value_usd||0)/1e6).toFixed(1)}M)\nRisk: ${s.risk_score||0}/100`,
      type: "ship",
    })),
    ...ports.map((p: any) => ({
      lat: p.lat, lng: p.lng,
      size: 0.45,
      color: PORT_COLORS[p.status] || "#3b82f6",
      label: `⚓ ${p.full_name||p.name}\nStatus: ${p.status}\nLoad: ${Math.round((p.current_load/p.capacity)*100)}%`,
      type: "port",
    })),
    ...weather.map((w: any) => ({
      lat: w.lat, lng: w.lng,
      size: 0.8,
      color: "#ff4444",
      label: `⚠ ${w.name}\nType: ${w.type}\nSeverity: ${w.severity}\nWind: ${w.wind_speed_knots} knots`,
      type: "weather",
    })),
  ], [ships, ports, weather]);

  const onTime = ships.filter((s: any) => s.status === "on-time").length;
  const atRisk = ships.filter((s: any) => s.status === "at-risk").length;
  const rerouted = ships.filter((s: any) => s.status === "rerouted").length;

  return (
    <div className="glass-panel w-full h-[580px] relative overflow-hidden rounded-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 bg-black/40 rounded-t-2xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Wind size={14} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">3D Global Operations Map</h2>
            <p className="text-[11px] text-gray-500">Real-time vessel & port tracking · Hover for details</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"/>{onTime} On Time</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-400"/>{atRisk} At Risk</span>
          <span className="text-white/20">·</span>
          <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400"/>{rerouted} Rerouted</span>
        </div>
      </div>

      {/* Globe */}
      <div className="flex-1 relative bg-[#03060f]">
        {typeof window !== "undefined" && (
          <Globe
            width={undefined}
            height={undefined}
            backgroundColor="rgba(3,6,15,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            atmosphereColor="#1e3a8a"
            atmosphereAltitude={0.18}
            // Points
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            pointAltitude={0.01}
            pointLabel="label"
            // Arcs (ship routes)
            arcsData={arcs}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor="color"
            arcAltitude={0.15}
            arcStroke={0.5}
            arcDashLength={0.4}
            arcDashGap={0.3}
            arcDashAnimateTime={3000}
            // Controls
            enablePointerInteraction={true}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass-bright px-3 py-2 rounded-xl text-[10px] z-10 flex flex-col gap-1.5">
          {[["#10b981","Ship — On Time"],["#f97316","Ship — At Risk"],["#3b82f6","Ship — Rerouted"],["#ef4444","Ship — Delayed / Storm"],["#f59e0b","Port — Moderate"],].map(([c,l])=>(
            <span key={l} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:c}}/><span className="text-gray-400">{l}</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}
