"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, Zap } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info" | "ai";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  warning: <AlertTriangle size={16} className="text-orange-400" />,
  error:   <AlertTriangle size={16} className="text-red-400" />,
  info:    <Info size={16} className="text-blue-400" />,
  ai:      <Zap size={16} className="text-purple-400" />,
};

const BORDERS = {
  success: "border-emerald-500/30 bg-emerald-500/8",
  warning: "border-orange-500/30 bg-orange-500/8",
  error:   "border-red-500/30 bg-red-500/8",
  info:    "border-blue-500/30 bg-blue-500/8",
  ai:      "border-purple-500/30 bg-purple-500/8",
};

let _addToast: (t: Omit<Toast, "id">) => void = () => {};

export function showToast(t: Omit<Toast, "id">) {
  _addToast(t);
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    _addToast = (t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [{ ...t, id }, ...prev].slice(0, 5));
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
    };
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(x => x.id !== id));

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`pointer-events-auto rounded-xl border px-4 py-3 backdrop-blur-xl shadow-2xl ${BORDERS[toast.type]}`}
            style={{ background: "rgba(7,10,26,0.95)" }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{toast.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button onClick={() => dismiss(toast.id)} className="text-gray-600 hover:text-gray-300 shrink-0">
                <X size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
