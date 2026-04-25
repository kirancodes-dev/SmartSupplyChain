"use client";
import { motion } from "framer-motion";
import { Ship, Anchor, CloudLightning } from "lucide-react";

export default function DashboardMap({ state }: { state: any }) {
  if (!state) return <div className="glass-panel w-full h-[600px] animate-pulse" />;

  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { top: `${y}%`, left: `${x}%` };
  };

  return (
    <div className="glass-panel w-full h-[600px] relative overflow-hidden bg-[#0a192f]">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
      
      {state.weather?.map((w: any) => (
        <motion.div
          key={w.id}
          className="absolute rounded-full bg-red-500/20 blur-xl flex items-center justify-center"
          style={{
            ...project(w.lat, w.lng),
            width: `${w.radius_km / 2}px`,
            height: `${w.radius_km / 2}px`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      ))}

      {state.ports?.map((p: any) => (
        <div key={p.id} className="absolute flex flex-col items-center" style={{ ...project(p.lat, p.lng), transform: 'translate(-50%, -50%)' }}>
          <div className={`p-2 rounded-full shadow-lg ${p.status === 'Congested' ? 'bg-red-500 shadow-red-500/50' : p.status === 'Moderate' ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}>
            <Anchor size={16} className="text-white" />
          </div>
          <span className="text-[10px] mt-1 font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">{p.name}</span>
        </div>
      ))}

      {state.ships?.map((s: any) => (
        <motion.div
          key={s.id}
          className="absolute flex flex-col items-center z-10"
          style={{ transform: 'translate(-50%, -50%)' }}
          initial={false}
          animate={{ top: project(s.lat, s.lng).top, left: project(s.lat, s.lng).left }}
          transition={{ duration: 5, ease: "linear" }}
        >
          <div className={`p-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] ${s.status === 'at-risk' ? 'bg-orange-500 shadow-orange-500/50' : s.status === 'rerouted' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-white'}`}>
            <Ship size={14} className={s.status === 'on-time' ? 'text-black' : 'text-white'} />
          </div>
          <span className="text-[10px] mt-1 font-medium text-blue-100 bg-black/40 px-1 rounded">{s.id}</span>
        </motion.div>
      ))}
    </div>
  );
}
