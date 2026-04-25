"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Ship, BarChart3, Activity, Globe2, Zap, X, ArrowRight } from "lucide-react";

const COMMANDS = [
  { label: "Dashboard",    icon: Activity, href: "/",             shortcut: "D" },
  { label: "Fleet",        icon: Ship,     href: "/fleet",        shortcut: "F" },
  { label: "Analytics",   icon: BarChart3, href: "/analytics",   shortcut: "A" },
  { label: "Architecture",icon: Globe2,    href: "/architecture", shortcut: "R" },
  { label: "Toggle Auto-Pilot", icon: Zap, href: null,            shortcut: "P", action: "autopilot" },
];

export default function CommandPalette({ onAutoPilot }: { onAutoPilot?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
        setQuery("");
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const execute = (cmd: typeof COMMANDS[0]) => {
    setOpen(false);
    if (cmd.action === "autopilot") { onAutoPilot?.(); return; }
    if (cmd.href) router.push(cmd.href);
  };

  return (
    <>
      {/* Trigger hint in NavBar (keyboard shortcut hint) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-all text-xs"
      >
        <Search size={12} />
        <span>Search</span>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => setOpen(false)}
            />
            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 22, stiffness: 350 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[201] w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "rgba(7,10,26,0.98)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 0 60px rgba(59,130,246,0.2), 0 25px 50px rgba(0,0,0,0.8)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
                <Search size={16} className="text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search commands, pages..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, filtered.length - 1));
                    if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
                    if (e.key === "Enter" && filtered[selected]) execute(filtered[selected]);
                  }}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600"
                />
                <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white"><X size={14} /></button>
              </div>

              {/* Results */}
              <div className="p-2 max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-8">No results</p>
                ) : (
                  filtered.map((cmd, idx) => (
                    <button
                      key={cmd.label}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${idx === selected ? "bg-blue-500/15 text-white" : "text-gray-400 hover:bg-white/5"}`}
                    >
                      <cmd.icon size={15} className={idx === selected ? "text-blue-400" : "text-gray-600"} />
                      <span className="flex-1 text-left font-medium">{cmd.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-500">{cmd.shortcut}</kbd>
                      <ArrowRight size={12} className={`${idx === selected ? "text-blue-400 opacity-100" : "opacity-0"}`} />
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-white/8 flex gap-4 text-[10px] text-gray-700">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> select</span>
                <span><kbd className="font-mono">Esc</kbd> close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
