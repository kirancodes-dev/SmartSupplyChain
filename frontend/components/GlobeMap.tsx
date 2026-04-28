"use client";
import dynamic from "next/dynamic";
import { useMemo, useState, useCallback } from "react";
import { Wind, CloudLightning, MousePointer2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { showToast } from "./ToastProvider";
import Link from "next/link";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  "on-time":  "#10b981",
  "at-risk":  "#f97316",
  "delayed":  "#ef4444",
  "rerouted": "#3b82f6",
};
const PORT_COLORS: Record<string, string> = {
  "Clear": "#10b981", "Moderate": "#f59e0b", "Congested": "#ef4444",
};

export default function GlobeMap({ state, onWeatherAdded }: { state: any; onWeatherAdded?: () => void }) {
  const ships = state?.ships || [];
  const ports = state?.ports || [];
  const weather = state?.weather || [];

  const [selectedShip, setSelectedShip] = useState<any>(null);
  const [selectedPort, setSelectedPort] = useState<any>(null);
  const [clickMode, setClickMode] = useState<"view" | "storm">("view");
  const [injecting, setInjecting] = useState(false);

  const arcs = useMemo(() => ships.map((s: any) => {
    const dest = ports.find((p: any) => p.id === s.destination);
    if (!dest) return null;
    return { startLat: s.lat, startLng: s.lng, endLat: dest.lat, endLng: dest.lng, color: STATUS_COLORS[s.status] || "#fff", label: `${s.name} → ${dest.name}` };
  }).filter(Boolean), [ships, ports]);

  const points = useMemo(() => [
    ...ships.map((s: any) => ({ lat: s.lat, lng: s.lng, size: 0.6, color: STATUS_COLORS[s.status] || "#fff", label: `🚢 ${s.name}\nStatus: ${s.status}\nCargo: ${s.cargo} ($${((s.cargo_value_usd||0)/1e6).toFixed(1)}M)\nRisk: ${s.risk_score||0}/100`, type: "ship", data: s })),
    ...ports.map((p: any) => ({ lat: p.lat, lng: p.lng, size: 0.45, color: PORT_COLORS[p.status] || "#3b82f6", label: `⚓ ${p.full_name||p.name}\nStatus: ${p.status}\nLoad: ${Math.round((p.current_load/p.capacity)*100)}%`, type: "port", data: p })),
    ...weather.map((w: any) => ({ lat: w.lat, lng: w.lng, size: 0.8, color: "#ff4444", label: `⚠ ${w.name}\nType: ${w.type}\nSeverity: ${w.severity}\nWind: ${w.wind_speed_knots} knots`, type: "weather", data: w })),
  ], [ships, ports, weather]);

  const handlePointClick = useCallback((point: any) => {
    if (point.type === "ship") {
      setSelectedShip(point.data);
      setSelectedPort(null);
    } else if (point.type === "port") {
      setSelectedPort(point.data);
      setSelectedShip(null);
    }
  }, []);

  const handleGlobeClick = useCallback(async ({ lat, lng }: { lat: number; lng: number }) => {
    if (clickMode !== "storm") return;
    setInjecting(true);
    try {
      await apiFetch("/weather/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Typhoon", name: `Custom Storm`, lat: parseFloat(lat.toFixed(2)), lng: parseFloat(lng.toFixed(2)), radius_km: 400, severity: "High", wind_speed_knots: 130 }),
      });
      showToast({ type: "warning", title: "Storm Injected!", message: `Typhoon dropped at ${lat.toFixed(1)}°, ${lng.toFixed(1)}°. AI analyzing nearby vessels...` });
      onWeatherAdded?.();
    } catch {
      showToast({ type: "error", title: "Failed", message: "Could not inject storm." });
    }
    setInjecting(false);
    setClickMode("view");
  }, [clickMode, onWeatherAdded]);

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
            <p className="text-[11px] text-gray-500">Click ships & ports for details · Drop storms anywhere</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><span className="pulse-dot pulse-dot-emerald"/>{onTime} On Time</span>
          <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-lg border border-orange-500/20"><span className="pulse-dot pulse-dot-orange"/>{atRisk} At Risk</span>
          <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20"><span className="pulse-dot pulse-dot-blue"/>{rerouted} Rerouted</span>
          <button
            onClick={() => setClickMode(m => m === "storm" ? "view" : "storm")}
            className={`ml-3 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${clickMode === "storm" ? "border-red-500/50 bg-red-500/20 text-red-300 animate-pulse glow-red" : "border-white/15 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
          >
            {clickMode === "storm" ? <><CloudLightning size={11}/> Drop Storm Mode</> : <><MousePointer2 size={11}/> Click Mode</>}
          </button>
        </div>
      </div>

      {/* Globe */}
      <div className="flex-1 relative bg-[#03060f]" style={{ cursor: clickMode === "storm" ? "crosshair" : "default" }}>
        {typeof window !== "undefined" && (
          <Globe
            width={undefined}
            height={undefined}
            backgroundColor="rgba(3,6,15,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            atmosphereColor="#3b82f6"
            atmosphereAltitude={0.15}
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointRadius="size"
            pointAltitude={0.01}
            pointLabel="label"
            onPointClick={handlePointClick}
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
            onGlobeClick={handleGlobeClick}
            enablePointerInteraction={true}
          />
        )}

        {/* Storm mode overlay hint */}
        {clickMode === "storm" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold backdrop-blur-sm z-10">
            <CloudLightning size={13}/> Click anywhere on the ocean to drop a storm
            <button onClick={() => setClickMode("view")} className="ml-2 text-red-400 hover:text-white"><X size={12}/></button>
          </div>
        )}

        {/* Selected ship popup */}
        {selectedShip && (
          <div className="absolute top-3 right-3 w-64 glass-bright rounded-xl p-4 border border-orange-500/20 z-20">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-white">🚢 {selectedShip.name}</h4>
              <button onClick={() => setSelectedShip(null)} className="text-gray-600 hover:text-white"><X size={13}/></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                ["Status", selectedShip.status],
                ["Risk", `${selectedShip.risk_score}/100`],
                ["Cargo", selectedShip.cargo],
                ["Value", `$${((selectedShip.cargo_value_usd||0)/1e6).toFixed(1)}M`],
                ["Origin", selectedShip.origin],
                ["Dest.", selectedShip.destination],
                ["Speed", `${selectedShip.speed_knots}kn`],
                ["ETA", selectedShip.eta],
              ].map(([k,v]) => (
                <div key={k}><p className="text-gray-600">{k}</p><p className="text-white font-semibold">{v}</p></div>
              ))}
            </div>
            <Link href={`/track/${selectedShip.id}`} className="mt-3 block text-center text-[11px] font-bold text-blue-400 hover:text-blue-300">
              View Full Tracking Page →
            </Link>
          </div>
        )}

        {/* Selected port popup */}
        {selectedPort && (
          <div className="absolute top-3 right-3 w-56 glass-bright rounded-xl p-4 border border-blue-500/20 z-20">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-white">⚓ {selectedPort.name}</h4>
              <button onClick={() => setSelectedPort(null)} className="text-gray-600 hover:text-white"><X size={13}/></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                ["Status", selectedPort.status],
                ["Country", selectedPort.country || "—"],
                ["Capacity", selectedPort.capacity],
                ["Current Load", selectedPort.current_load],
                ["Utilization", `${Math.round((selectedPort.current_load/selectedPort.capacity)*100)}%`],
                ["Region", selectedPort.region || "—"],
              ].map(([k,v]) => (
                <div key={k}><p className="text-gray-600">{k}</p><p className="text-white font-semibold">{v}</p></div>
              ))}
            </div>
            <div className="mt-2">
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((selectedPort.current_load/selectedPort.capacity)*100))}%`, background: selectedPort.status === "Congested" ? "#ef4444" : selectedPort.status === "Moderate" ? "#f59e0b" : "#10b981" }}/>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 glass-bright px-3 py-2 rounded-xl text-[10px] z-10 flex flex-col gap-1.5">
          {[["#10b981","On Time"],["#f97316","At Risk"],["#3b82f6","Rerouted"],["#ef4444","Delayed/Storm"],["#f59e0b","Port Moderate"]].map(([c,l])=>(
            <span key={l} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:c}}/><span className="text-gray-400">{l}</span></span>
          ))}
        </div>

        {injecting && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin mx-auto mb-2"/>
              <p className="text-red-300 text-sm font-bold">Injecting storm...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
