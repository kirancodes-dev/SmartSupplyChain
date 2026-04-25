"use client";
import { useState } from "react";
import { CloudLightning, Plus, Trash2, AlertTriangle, Wind, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "./ToastProvider";

const PRESETS = [
  { label: "Pacific Typhoon",  type: "Typhoon",       lat: 22,   lng: 138,  radius: 450, severity: "High",   wind: 145, color: "#ef4444" },
  { label: "Indian Ocean Cyclone", type: "Cyclone",   lat: -12,  lng: 72,   radius: 380, severity: "High",   wind: 130, color: "#f97316" },
  { label: "North Sea Storm",  type: "Storm",          lat: 56,   lng: 3,    radius: 300, severity: "Medium", wind: 90,  color: "#f59e0b" },
  { label: "Gulf of Mexico Fog", type: "Dense Fog",   lat: 26,   lng: -90,  radius: 200, severity: "Medium", wind: 20,  color: "#6366f1" },
  { label: "Suez Sand Storm",  type: "Sand Storm",    lat: 30.5, lng: 32.5, radius: 250, severity: "High",   wind: 80,  color: "#f97316" },
];

export default function WeatherControl({ onWeatherChange }: { onWeatherChange: () => void }) {
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [customLat, setCustomLat] = useState("25");
  const [customLng, setCustomLng] = useState("60");
  const [customType, setCustomType] = useState("Typhoon");
  const [customRadius, setCustomRadius] = useState("400");
  const [loading, setLoading] = useState(false);

  const inject = async (params: any) => {
    setLoading(true);
    try {
      const res = await apiFetch("/weather/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const event = { ...params, id: res.id, ts: new Date().toLocaleTimeString() };
      setActiveEvents(prev => [event, ...prev]);
      showToast({ type: "warning", title: `${params.type} Injected`, message: `${params.name} at ${params.lat}°, ${params.lng}° — severity: ${params.severity}` });
      onWeatherChange();
    } catch {
      showToast({ type: "error", title: "Failed", message: "Could not inject weather event. Backend may be restarting." });
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/weather/${id}`, { method: "DELETE" });
      setActiveEvents(prev => prev.filter(e => e.id !== id));
      showToast({ type: "success", title: "Event Cleared", message: "Weather event removed from simulation." });
      onWeatherChange();
    } catch {}
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-orange-500/15">
      <div className="px-5 py-3 border-b border-white/8 bg-gradient-to-r from-orange-500/8 to-red-500/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CloudLightning size={14} className="text-orange-400" /> Weather Simulation Lab
          </h3>
          <p className="text-[11px] text-gray-500">Inject live weather events — watch AI respond in real-time</p>
        </div>
        <div className="badge badge-orange text-[10px]">
          {activeEvents.length} active events
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Presets */}
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => inject({ type: preset.type, name: preset.label, lat: preset.lat, lng: preset.lng, radius_km: preset.radius, severity: preset.severity, wind_speed_knots: preset.wind })}
                disabled={loading}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/8 text-orange-300 hover:bg-orange-500/15 transition-all disabled:opacity-50"
              >
                <AlertTriangle size={10} style={{ color: preset.color }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom event */}
        <div className="glass-bright rounded-xl p-4">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Custom Event</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-gray-600 mb-1 block">Type</label>
              <select value={customType} onChange={e => setCustomType(e.target.value)}
                className="chat-input text-xs py-1.5 rounded-lg w-full">
                {["Typhoon","Cyclone","Storm","Dense Fog","Sand Storm","Hurricane"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-600 mb-1 block">Latitude</label>
              <input type="number" value={customLat} onChange={e => setCustomLat(e.target.value)} className="chat-input text-xs py-1.5 rounded-lg w-full" placeholder="-90 to 90" />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 mb-1 block">Longitude</label>
              <input type="number" value={customLng} onChange={e => setCustomLng(e.target.value)} className="chat-input text-xs py-1.5 rounded-lg w-full" placeholder="-180 to 180" />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 mb-1 block">Radius (km)</label>
              <input type="number" value={customRadius} onChange={e => setCustomRadius(e.target.value)} className="chat-input text-xs py-1.5 rounded-lg w-full" placeholder="100–800" />
            </div>
          </div>
          <button
            onClick={() => inject({ type: customType, name: `Custom ${customType}`, lat: parseFloat(customLat), lng: parseFloat(customLng), radius_km: parseFloat(customRadius), severity: "High", wind_speed_knots: 120 })}
            disabled={loading}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2 w-full justify-center disabled:opacity-50"
          >
            {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={13} />}
            Inject Custom Event
          </button>
        </div>

        {/* Active events */}
        <AnimatePresence>
          {activeEvents.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Active Events</p>
              <div className="flex flex-col gap-1.5">
                {activeEvents.map(e => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20"
                  >
                    <Wind size={12} className="text-red-400 shrink-0" />
                    <span className="text-xs font-semibold text-red-300 flex-1">{e.name}</span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1"><MapPin size={9}/>{e.lat?.toFixed(1)}°, {e.lng?.toFixed(1)}°</span>
                    <span className="text-[10px] text-gray-700">{e.ts}</span>
                    <button onClick={() => remove(e.id)} className="p-1 rounded-md hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all">
                      <Trash2 size={11} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
