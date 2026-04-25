"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Play, Mic, Zap, FileText, Globe2, Trophy, Bot, Calculator } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIONS = [
  { icon: Globe2,      label: "Dashboard",    href: "/dashboard",   color: "#3b82f6" },
  { icon: Zap,         label: "Scenarios",    href: "/scenarios",   color: "#ef4444" },
  { icon: Bot,         label: "AI Briefing",  href: "/briefing",    color: "#a855f7" },
  { icon: Trophy,      label: "Leaderboard",  href: "/leaderboard", color: "#f59e0b" },
  { icon: Calculator,  label: "Calculator",   href: "/calculator",  color: "#10b981" },
  { icon: FileText,    label: "Report",       href: "/report",      color: "#6366f1" },
];

export default function FloatingDock() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Show dock after scrolling down a bit, hide on landing
  useEffect(() => {
    if (pathname === "/home") { setVisible(false); return; }
    setVisible(true);
    const onScroll = () => setVisible(window.scrollY > 40 || pathname !== "/home");
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action buttons */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-end gap-2 mb-1">
            {ACTIONS.map((action, i) => (
              <motion.div key={action.href} initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }} transition={{ delay: i * 0.04 }}>
                <Link href={action.href} onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-2xl border border-white/10 shadow-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: `rgba(6,8,24,0.95)`, backdropFilter: "blur(20px)" }}>
                  <span className="text-xs text-gray-400">{action.label}</span>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: action.color + "25" }}>
                    <action.icon size={14} style={{ color: action.color }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl text-white relative"
        style={{ background: open ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: `0 8px 40px ${open ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)"}` }}>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          {open ? <X size={22} /> : <Plus size={22} />}
        </motion.div>
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-30" />
        )}
      </motion.button>
    </div>
  );
}
