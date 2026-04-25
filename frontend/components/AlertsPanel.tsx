"use client";
import { useState } from "react";
import { requestOptimization } from "@/lib/api";
import { AlertCircle, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AlertsPanel({ alerts, onOptimized }: { alerts: any[], onOptimized: () => void }) {
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOptimize = async (shipId: string) => {
    try {
      setOptimizing(shipId);
      const res = await requestOptimization(shipId);
      if (res.status === 'success') {
        setSuccess(shipId);
        onOptimized();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOptimizing(null);
    }
  };

  return (
    <div className="glass-panel h-[600px] flex flex-col">
      <div className="p-5 border-b border-white/10 bg-black/20 rounded-t-xl">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="text-red-400" size={20} />
          Disruption Alerts
        </h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-3">
        <AnimatePresence>
          {alerts?.map((alert) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl border backdrop-blur-md ${alert.severity === 'High' ? 'border-red-500/30 bg-red-500/10' : 'border-orange-500/30 bg-orange-500/10'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-gray-200 uppercase tracking-wider">
                  {alert.type}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">{alert.message}</p>
              
              {alert.actionable && alert.ship_id && (
                <button
                  onClick={() => handleOptimize(alert.ship_id)}
                  disabled={optimizing === alert.ship_id || success === alert.ship_id}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    success === alert.ship_id 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                  }`}
                >
                  {success === alert.ship_id ? (
                    <><Check size={16} /> Route Optimized</>
                  ) : optimizing === alert.ship_id ? (
                    <span className="animate-pulse flex items-center gap-2">
                      <Zap size={16} /> Gemini AI Optimizing...
                    </span>
                  ) : (
                    <><Zap size={16} /> AI Reroute Recommendation</>
                  )}
                </button>
              )}
            </motion.div>
          ))}
          {(!alerts || alerts.length === 0) && (
            <div className="h-full flex items-center justify-center text-gray-500">
              No active disruptions monitored.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
