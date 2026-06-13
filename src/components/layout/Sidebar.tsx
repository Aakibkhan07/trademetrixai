"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Brain,
  LineChart,
  Store,
  Blocks,
  FlaskConical,
  Bot,
  BookOpen,
  BarChart3,
  Globe,
  Send,
  Link2,
  Settings,
  Menu,
  X,
  Zap,
  ChevronLeft,
  Shield,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowingPulse } from "@/components/ui/GlowingPulse";
import { useDemo } from "@/components/providers/DemoContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Signal Engine", href: "/ai-signals", icon: Brain, badge: "LIVE" },
  { label: "AI Chart Analyzer", href: "/chart-analyzer", icon: LineChart, badge: "NEW" },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "ROI Calculator", href: "/roi-calculator", icon: Calculator, badge: "ROI" },
  { label: "Strategy Builder", href: "/strategy-builder", icon: Blocks },
  { label: "Backtesting Lab", href: "/backtesting", icon: FlaskConical },
  { label: "Auto Trading", href: "/auto-trading", icon: Bot },
  { label: "Trade Journal", href: "/trade-journal", icon: BookOpen },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Market Intelligence", href: "/market-intelligence", icon: Globe },
  { label: "Telegram", href: "/telegram", icon: Send },
  { label: "Broker Connections", href: "/broker-connections", icon: Link2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, activeStrategiesCount } = useDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface-elevated/80 backdrop-blur-xl border border-glass-border text-text-primary hover:text-neon-blue transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(mobileOpen || true) && (
          <motion.aside
            className={cn(
              "fixed top-0 left-0 h-full z-50 glass-sidebar flex flex-col transition-all duration-300",
              collapsed ? "w-[72px]" : "w-[260px]",
              mobileOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            )}
          >
            {/* Logo */}
            <div className={cn(
              "flex items-center h-16 border-b border-glass-border",
              collapsed ? "px-4 justify-center" : "px-5 gap-3"
            )}>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden border border-neon-blue/20 bg-white/5 backdrop-blur-md p-1 group hover:border-neon-blue/40 transition-all">
                <img src="/logo-icon.png" alt="Trade Metrix" className="w-full h-full object-contain" />
              </div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col"
                >
                  <span className="text-sm font-bold tracking-wide text-text-primary">
                    TRADE METRIX
                  </span>
                  <span className="text-[10px] font-medium text-neon-blue tracking-[0.2em]">
                    AI TERMINAL
                  </span>
                </motion.div>
              )}

              {/* Mobile close */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden ml-auto p-1 text-text-secondary hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative border",
                      isActive
                        ? "bg-neon-blue/10 text-neon-blue border-neon-blue/25 shadow-[0_0_18px_rgba(0,212,255,0.18),0_0_4px_rgba(0,212,255,0.1)]"
                        : "text-text-secondary hover:text-neon-blue hover:bg-white/5 border-transparent hover:border-neon-blue/15 hover:shadow-[0_0_12px_rgba(0,212,255,0.05)]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-neon-blue rounded-r-full"
                        style={{
                          boxShadow: "0 0 12px rgba(0,212,255,0.6), 0 0 24px rgba(0,212,255,0.2)",
                        }}
                      />
                    )}
                    <Icon
                      size={19}
                      className={cn(
                        "shrink-0 transition-all duration-300",
                        isActive 
                          ? "text-neon-blue animate-sidebar-icon-glow" 
                          : "text-text-muted group-hover:text-neon-blue group-hover:filter group-hover:drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]"
                      )}
                      style={isActive ? { filter: "drop-shadow(0 0 6px rgba(0, 212, 255, 0.7)) drop-shadow(0 0 14px rgba(0, 212, 255, 0.3))" } : undefined}
                    />
                    {!collapsed && (
                      <>
                        <span className={cn("truncate", isActive && "text-shadow-[0_0_8px_rgba(0,212,255,0.3)]")}>{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            "ml-auto flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md border",
                            item.badge === "LIVE"
                              ? "bg-neon-green/15 text-neon-green border-neon-green/20 shadow-[0_0_8px_rgba(0,255,136,0.15)]"
                              : "bg-neon-green/15 text-neon-green border-neon-green/20"
                          )}>
                            <GlowingPulse color={item.badge === "LIVE" ? "green" : "green"} size="sm" />
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Collapse toggle — desktop only */}
            <div className="hidden lg:flex items-center justify-center p-3 border-t border-glass-border">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              >
                <ChevronLeft
                  size={16}
                  className={cn(
                    "transition-transform duration-300",
                    collapsed && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* Pro badge */}
            {!collapsed && (
              <div className={cn(
                "p-3 mx-3 mb-3 rounded-xl border transition-all duration-200",
                role === "admin" 
                  ? "bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 border-neon-purple/20" 
                  : "bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border-neon-blue/15"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {role === "admin" ? (
                    <Shield size={14} className="text-neon-purple" />
                  ) : (
                    <Zap size={14} className="text-neon-blue" />
                  )}
                  <span className="text-xs font-semibold text-text-primary">
                    {role === "admin" ? "Admin Terminal" : "Pro Plan"}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted">
                  {role === "admin" ? "System Controls Active" : "AI Engine Active"} • {activeStrategiesCount} {activeStrategiesCount === 1 ? "Strategy" : "Strategies"}
                </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
