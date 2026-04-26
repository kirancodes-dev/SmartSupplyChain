import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; href: string };
  color?: string;
  size?: "sm" | "md" | "lg";
};

export default function EmptyState({
  icon: Icon, title, description, action, secondaryAction,
  color = "#3b82f6", size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: "py-8", icon: 28, iconBox: "w-12 h-12", title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-12", icon: 36, iconBox: "w-16 h-16", title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-20", icon: 48, iconBox: "w-20 h-20", title: "text-xl", desc: "text-base" },
  }[size];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center text-center ${sizes.wrapper} px-6 gap-4`}>
      {/* Icon with glow ring */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ background: color, transform: "scale(1.5)" }} />
        <div className={`${sizes.iconBox} rounded-2xl flex items-center justify-center border border-white/10 relative`}
          style={{ background: color + "18" }}>
          <Icon size={sizes.icon} style={{ color }} />
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className={`${sizes.title} font-black text-white`}>{title}</h3>
        <p className={`${sizes.desc} text-gray-500 leading-relaxed`}>{description}</p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
          {action && (
            <button onClick={action.onClick}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 6px 24px ${color}40` }}>
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <a href={secondaryAction.href}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
              {secondaryAction.label}
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
