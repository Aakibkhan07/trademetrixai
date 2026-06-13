"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, AlertTriangle, Info, Bell } from "lucide-react";
import { useDemo, DemoNotification } from "@/components/providers/DemoContext";

export function DemoToastStack() {
  const { notifications, clearNotification } = useDemo();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {notifications.map((notif) => (
          <ToastItem 
            key={notif.id} 
            item={notif} 
            onClose={() => clearNotification(notif.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ item, onClose }: { item: DemoNotification; onClose: () => void }) {
  // Auto-dismiss after 6.5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 6500);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Color mappings
  const getColors = () => {
    switch (item.type) {
      case "success":
        return {
          border: "border-neon-green/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]",
          glow: "bg-neon-green/10 text-neon-green",
          icon: CheckCircle,
        };
      case "warning":
        return {
          border: "border-neon-red/30 shadow-[0_0_15px_rgba(255,51,102,0.1)]",
          glow: "bg-neon-red/10 text-neon-red",
          icon: AlertTriangle,
        };
      case "info":
      default:
        return {
          border: "border-neon-blue/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]",
          glow: "bg-neon-blue/10 text-neon-blue",
          icon: Info,
        };
    }
  };

  const colors = getColors();
  const Icon = colors.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-surface-elevated/95 backdrop-blur-xl border ${colors.border} text-text-primary`}
    >
      <div className={`w-7 h-7 rounded-lg ${colors.glow} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={14} />
      </div>

      <div className="flex-1 space-y-0.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-text-primary leading-tight">{item.title}</span>
          <span className="text-[8px] font-mono text-text-muted ml-2">{item.timestamp}</span>
        </div>
        <p className="text-[10px] text-text-secondary leading-relaxed">{item.message}</p>
      </div>

      <button
        onClick={onClose}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
