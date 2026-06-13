"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Rocket, X, ArrowRight } from "lucide-react";
import { useDemo } from "@/components/providers/DemoContext";

export function FloatingCTA() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { openLeadModal } = useDemo();

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-3 glass-card p-5 w-72 border border-glass-border"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-3 right-3 p-1 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                <Rocket size={16} className="text-neon-blue" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">
                Get Institutional Access
              </h3>
            </div>

            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Unlock AI-powered signals, advanced backtesting, and automated trading with our premium plan.
            </p>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  openLeadModal("Start Free Trial");
                  setExpanded(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Free Trial
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => {
                  openLeadModal("Institutional Account Setup");
                  setExpanded(false);
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors border border-glass-border cursor-pointer"
              >
                Request Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="relative p-4 rounded-2xl bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/20 hover:shadow-neon-blue/30 transition-shadow"
        animate={{
          boxShadow: [
            "0 0 20px rgba(0,212,255,0.2)",
            "0 0 40px rgba(0,212,255,0.3)",
            "0 0 20px rgba(0,212,255,0.2)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Rocket size={22} />
      </motion.button>
    </div>
  );
}
