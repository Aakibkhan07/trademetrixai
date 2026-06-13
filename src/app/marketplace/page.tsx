"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  ShieldAlert,
  Award,
  Play,
  Activity,
  Lock,
  Shield,
  Sparkles,
  BarChart4,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { useDemo } from "@/components/providers/DemoContext";
import { strategies } from "@/lib/dummy-data";
import { getRiskColor, formatCurrency } from "@/lib/utils";

type CategoryType =
  | "ALL"
  | "HNI"
  | "SCALPING"
  | "TREND_FOLLOWING"
  | "BREAKOUT"
  | "MOMENTUM"
  | "VOLUME"
  | "SMART_MONEY"
  | "MEAN_REVERSION"
  | "OPTIONS";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

export default function StrategyMarketplacePage() {
  const { capital, injectNotification, updateSettings, role, openLeadModal } = useDemo();
  const [activeCategory, setActiveCategory] = useState<CategoryType>("ALL");
  const [activeStrategiesState, setActiveStrategiesState] = useState<Record<string, boolean>>({
    "strat-001": true,
    "strat-003": true,
  });

  const categories = [
    { id: "ALL", label: "All" },
    { id: "HNI", label: "HNI Elite (₹50L+)" },
    { id: "SCALPING", label: "Scalping" },
    { id: "TREND_FOLLOWING", label: "Trend Following" },
    { id: "BREAKOUT", label: "Breakout" },
    { id: "MOMENTUM", label: "Momentum" },
    { id: "VOLUME", label: "Volume" },
    { id: "SMART_MONEY", label: "Smart Money" },
    { id: "MEAN_REVERSION", label: "Mean Reversion" },
    { id: "OPTIONS", label: "Options" },
  ];

  const filteredStrategies = strategies.filter((strat) => {
    if (activeCategory === "HNI") return !!strat.isHniOnly;
    if (activeCategory === "ALL") return true;
    const catString = activeCategory.replace("_", " ").toLowerCase();
    return strat.category.toLowerCase() === catString;
  });

  const toggleStrategyActive = (id: string) => {
    const strat = strategies.find(s => s.id === id);
    if (role === "user") {
      openLeadModal(strat ? strat.name : "Pre-built Strategy");
      return;
    }
    setActiveStrategiesState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBoostCapital = (targetCap: number = 6000000) => {
    updateSettings({ capital: targetCap });
    injectNotification(
      "HNI Portfolio Unlocked",
      `Investment capital allocated to ₹${targetCap.toLocaleString()}. Institutional planner activated!`,
      "success"
    );
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Strategy Marketplace" subtitle="Pre-built algorithmic trading strategies" />

      <div className="p-6 space-y-6">
        
        {/* HNI Institutional Asset & Allocation Planner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {capital >= 5000000 ? (
            <GlassCard className="border border-neon-purple/20 bg-neon-purple/5 p-6 relative overflow-hidden" glow="purple">
              {/* Background gradient blur decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[80px] pointer-events-none rounded-full" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-neon-purple animate-pulse w-4 h-4" />
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-neon-purple bg-neon-purple/10 px-2.5 py-0.5 rounded-full border border-neon-purple/20">
                      HNI Wealth Suite Active
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight font-display">
                    HNI Institutional Portfolio & Allocation Planner
                  </h2>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Welcome to the Elite planning suite. With your current investment of <strong className="text-neon-green">{formatCurrency(capital)}</strong>, you qualify for automated institutional copy-routing, multi-broker split-clearing, and tax-shielded options strategies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <NeonButton
                    variant="outline"
                    className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 text-[10px] uppercase font-bold"
                    onClick={() => {
                      updateSettings({ capital: 2500000 });
                      injectNotification("Profile Shifted", "Switched back to Retail User capital limits.", "info");
                    }}
                  >
                    Apply Retail Profile (₹25L)
                  </NeonButton>
                </div>
              </div>

              {/* Dynamic Planning Tool Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-glass-border/30 pt-6 relative z-10">
                {/* Allocation Box */}
                <div className="space-y-3 bg-white/[0.02] border border-glass-border p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wide">
                    <BarChart4 size={14} className="text-neon-purple" />
                    <span>Risk Budget Allocation</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-text-secondary flex justify-between">
                      <span>Low Risk Arbitrage:</span>
                      <span className="font-bold text-text-primary">40% ({formatCurrency(capital * 0.4)})</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-neon-blue h-full" style={{ width: "40%" }} />
                    </div>
                    
                    <div className="text-[10px] text-text-secondary flex justify-between">
                      <span>Options Writing:</span>
                      <span className="font-bold text-text-primary">35% ({formatCurrency(capital * 0.35)})</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-neon-purple h-full" style={{ width: "35%" }} />
                    </div>

                    <div className="text-[10px] text-text-secondary flex justify-between">
                      <span>Smart Money Sweeps:</span>
                      <span className="font-bold text-text-primary">25% ({formatCurrency(capital * 0.25)})</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-neon-green h-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>

                {/* Copier Feeds */}
                <div className="space-y-3 bg-white/[0.02] border border-glass-border p-4 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wide">
                      <Shield size={14} className="text-neon-purple" />
                      <span>Demat Split Routing</span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Split large order block executions across Dhan (40%), Zerodha (30%), and Angel One (30%) to prevent slippage and market impact.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] text-text-muted mt-2">
                    <span className="bg-neon-green/10 text-neon-green px-2 py-0.5 rounded border border-neon-green/20 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Dhan Active
                    </span>
                    <span className="bg-neon-green/10 text-neon-green px-2 py-0.5 rounded border border-neon-green/20 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Zerodha Active
                    </span>
                  </div>
                </div>

                {/* Tax & STT Planner */}
                <div className="space-y-3 bg-white/[0.02] border border-glass-border p-4 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wide">
                      <DollarSign size={14} className="text-neon-purple" />
                      <span>Tax & STT Shield</span>
                    </div>
                    <p className="text-[10px] text-text-secondary leading-relaxed">
                      Estimated STT for options rollover is optimized dynamically. Multi-strike spreads are automatically routed as custom baskets to save up to 28% in transaction taxes.
                    </p>
                  </div>
                  <div className="text-[10px] text-neon-purple font-mono bg-neon-purple/5 border border-neon-purple/20 p-2 rounded-lg text-center font-bold">
                    Est. Monthly STT Savings: ₹28,450
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="border border-glass-border bg-white/[0.01] p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Lock className="text-text-muted w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    HNI Institutional Planner Locked
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight font-display">
                  Unlock Institutional Planning & Execution Suite
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Traders with investments exceeding <strong>₹50 Lakhs</strong> gain access to custom multi-broker order-splitting, risk allocation planners, and tax-shielded options writing strategies.
                </p>
              </div>
              <div className="shrink-0">
                <NeonButton
                  variant="purple"
                  glow
                  className="font-bold uppercase tracking-wider"
                  onClick={() => handleBoostCapital(6000000)}
                >
                  Apply HNI Profile (₹60L)
                </NeonButton>
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 border-b border-glass-border pb-3 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryType)}
              className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? "text-neon-blue bg-neon-blue/10 border border-neon-blue/20"
                  : "text-text-secondary hover:text-text-primary border border-transparent hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Strategies Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredStrategies.map((strat, idx) => {
              const isActive = !!activeStrategiesState[strat.id];
              const isHniLocked = !!strat.isHniOnly && capital < (strat.minInvestment || 5000000);
              
              return (
                <motion.div
                  key={strat.id || idx}
                  variants={cardVariants}
                  layout
                  className="flex flex-col relative group"
                >
                  <GlassCard
                    className={`border border-glass-border hover:border-neon-blue/30 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                      isActive && !isHniLocked ? "ring-1 ring-neon-green/30 shadow-[0_0_20px_rgba(0,255,136,0.05)]" : ""
                    }`}
                    hover={!isHniLocked}
                  >
                    {/* Locked Strategy Overlay */}
                    {isHniLocked && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
                        <Lock className="text-neon-purple w-7 h-7 mb-2 animate-bounce" />
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">HNI Exclusive</h4>
                        <p className="text-[10px] text-text-secondary mt-1 max-w-[160px] leading-relaxed">
                          Requires minimum investment capital of <strong>₹{(strat.minInvestment || 5000000).toLocaleString()}</strong>.
                        </p>
                        <button
                          onClick={() => {
                            if (role === "user") {
                              openLeadModal(strat.name);
                            } else {
                              handleBoostCapital(strat.minInvestment || 6000000);
                            }
                          }}
                          className="mt-4 px-3 py-1.5 rounded-lg bg-neon-purple/20 border border-neon-purple/40 hover:bg-neon-purple/35 text-neon-purple font-semibold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Unlock Strategy
                        </button>
                      </div>
                    )}

                    <div className={isHniLocked ? "opacity-35 select-none pointer-events-none filter blur-[0.5px]" : ""}>
                      {/* Top badging */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {strat.category}
                        </span>
                        {strat.isPremium && (
                          <div className="flex items-center gap-1 bg-neon-amber/15 px-2 py-0.5 rounded-lg border border-neon-amber/30 text-[9px] font-mono text-neon-amber uppercase tracking-wider">
                            <Award size={10} />
                            PRO
                          </div>
                        )}
                      </div>

                      <div>
                        {/* Name & Desc */}
                        <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">
                          {strat.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                          {strat.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {strat.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="text-[9px] text-text-muted border border-glass-border/60 bg-white/[0.01] px-1.5 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] bg-glass-border/40 my-4" />

                        {/* Performance Row */}
                        <div className="grid grid-cols-3 gap-2 py-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-text-secondary uppercase mb-0.5">Win Rate</span>
                            <span className="text-xs font-bold text-text-primary">{strat.winRate}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-text-secondary uppercase mb-0.5">Monthly</span>
                            <span className="text-xs font-bold text-neon-green">+{strat.monthlyReturn}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] text-text-secondary uppercase mb-0.5">Risk</span>
                            <span className={`text-xs font-bold ${getRiskColor(strat.riskRating)}`}>
                              {strat.riskRating}/5
                            </span>
                          </div>
                        </div>

                        {/* Stats details */}
                        <div className="grid grid-cols-2 gap-2 text-xs mt-4 py-2 px-3 rounded-lg bg-white/[0.01] border border-glass-border/30 font-mono">
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans uppercase">Max Drawdown</span>
                            <span className="text-neon-red font-semibold">-{strat.maxDrawdown}%</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans uppercase">Sharpe Ratio</span>
                            <span className="text-neon-blue font-semibold">{strat.sharpeRatio}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active toggle & buttons */}
                    <div className="mt-6 space-y-4">
                      {/* Active Status bar */}
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-text-secondary font-medium">Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isActive && !isHniLocked ? "text-neon-green" : "text-text-muted"}`}>
                            {isActive && !isHniLocked ? "ACTIVE" : "INACTIVE"}
                          </span>
                          <div
                            onClick={() => !isHniLocked && toggleStrategyActive(strat.id)}
                            className={`toggle-switch ${isActive && !isHniLocked ? "active" : ""} ${isHniLocked ? "opacity-30 pointer-events-none" : ""}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <NeonButton
                          variant="outline"
                          size="sm"
                          fullWidth
                          disabled={isHniLocked}
                          onClick={() => {
                            if (role === "user") {
                              openLeadModal(strat.name + " (Backtest)");
                            } else {
                              window.location.href = `/backtesting?strategy=${strat.id}`;
                            }
                          }}
                          className="flex items-center justify-center gap-1"
                        >
                          <Activity size={13} />
                          Backtest
                        </NeonButton>
                        <NeonButton
                          variant={isActive ? "red" : "green"}
                          size="sm"
                          fullWidth
                          disabled={isHniLocked}
                          onClick={() => {
                            if (role === "user") {
                              openLeadModal(strat.name);
                            } else {
                              toggleStrategyActive(strat.id);
                            }
                          }}
                          className="flex items-center justify-center gap-1"
                        >
                          <Play size={13} />
                          {isActive ? "Pause" : "Deploy"}
                        </NeonButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
