"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";

type TooltipProps = {
  content: string;
  title?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

export default function InfoTooltip({ content, title, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div ref={ref} className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children ?? <HelpCircle size={12} className="text-gray-600 hover:text-gray-400 cursor-help transition-colors" />}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            className={`absolute z-[200] w-56 pointer-events-none ${positions[side]}`}>
            <div className="rounded-xl border border-white/15 p-3 shadow-2xl text-left"
              style={{ background: "rgba(6,8,24,0.98)", backdropFilter: "blur(20px)" }}>
              {title && <p className="text-[10px] font-black text-white mb-1 uppercase tracking-wider">{title}</p>}
              <p className="text-[11px] text-gray-400 leading-relaxed">{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
