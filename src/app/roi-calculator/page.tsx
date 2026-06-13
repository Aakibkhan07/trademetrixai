"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Calculator, 
  TrendingUp, 
  Wallet, 
  Target, 
  Percent, 
  Sparkles, 
  Info, 
  ArrowUpRight, 
  ShieldCheck, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { strategies } from "@/lib/dummy-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useDemo } from "@/components/providers/DemoContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

// Stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const }
};

export default function RoiCalculatorPage() {
  const { capital, openLeadModal, updateSettings } = useDemo();
  
  // Projection Inputs
  const [selectedCapital, setSelectedCapital] = useState(capital || 1000000);
  const [selectedStrategyId, setSelectedStrategyId] = useState(strategies[0]?.id || "strat-001");
  const [timelineMonths, setTimelineMonths] = useState(12);

  // Retrieve strategy details
  const currentStrategy = useMemo(() => {
    return strategies.find(s => s.id === selectedStrategyId) || strategies[0];
  }, [selectedStrategyId]);

  // Calculations
  const monthlyRate = currentStrategy.monthlyReturn / 100;
  
  // Calculate projected compounding path
  const projectionData = useMemo(() => {
    const data = [];
    let algoValue = selectedCapital;
    let indexValue = selectedCapital;
    let fdValue = selectedCapital;

    // Monthly rates
    const niftyMonthlyRate = 0.12 / 12; // 12% annual CAGR
    const fdMonthlyRate = 0.065 / 12; // 6.5% annual CAGR

    data.push({
      month: "Start",
      "TradeMetrix Algo": Math.round(algoValue),
      "Nifty Mutual Fund": Math.round(indexValue),
      "Fixed Deposit": Math.round(fdValue)
    });

    for (let m = 1; m <= timelineMonths; m++) {
      // compound monthly
      algoValue = algoValue * (1 + monthlyRate);
      indexValue = indexValue * (1 + niftyMonthlyRate);
      fdValue = fdValue * (1 + fdMonthlyRate);

      data.push({
        month: `Month ${m}`,
        "TradeMetrix Algo": Math.round(algoValue),
        "Nifty Mutual Fund": Math.round(indexValue),
        "Fixed Deposit": Math.round(fdValue)
      });
    }

    return data;
  }, [selectedCapital, monthlyRate, timelineMonths]);

  // Summary Metrics
  const endingAlgoValue = projectionData[projectionData.length - 1]["TradeMetrix Algo"];
  const totalProfit = endingAlgoValue - selectedCapital;
  const totalRoiPercent = (totalProfit / selectedCapital) * 100;
  
  // Estimated STT savings (mock STT Shield advantage of algos)
  const sttSavings = useMemo(() => {
    const tradeVolume = selectedCapital * (currentStrategy.category === "Options" ? 8 : 2);
    // Dynamic STT savings factor
    return Math.round(tradeVolume * 0.00045 * (timelineMonths / 12));
  }, [selectedCapital, currentStrategy, timelineMonths]);

  const handleUpdatePlatformCapital = () => {
    updateSettings({ capital: selectedCapital });
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="ROI Calculator" subtitle="Model your return projections dynamically" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Pitch Banner */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-neon-blue/20 bg-neon-blue/5 p-6 relative overflow-hidden" glow="blue">
            <div className="absolute top-0 right-0 w-80 h-80 bg-neon-blue/10 blur-[90px] pointer-events-none rounded-full" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-neon-blue animate-pulse w-4 h-4" />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-neon-blue bg-neon-blue/10 px-2.5 py-0.5 rounded-full border border-neon-blue/20">
                    Precision Estimator
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight font-display">
                  Compound Interest & Multi-Asset Performance Projector
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Model your financial projections using our verified strategy configurations. See exactly how algorithmic clearing-house optimizations and automated risk control outperform traditional equity funds over time.
                </p>
              </div>
              <div className="shrink-0">
                <NeonButton 
                  variant="blue" 
                  glow 
                  onClick={() => openLeadModal(currentStrategy.name)}
                  className="font-bold uppercase tracking-wider text-xs"
                >
                  Deploy Real Funds
                  <ArrowRight size={13} className="ml-1" />
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Setup Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border p-5 flex flex-col justify-between" glow="none">
              <div className="space-y-5">
                <div className="border-b border-glass-border/40 pb-3">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                    <Calculator size={14} className="text-neon-blue" />
                    Projection Parameters
                  </h3>
                </div>

                {/* Capital Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary font-semibold">Allocation Capital</span>
                    <span className="font-mono text-neon-green font-bold">{formatCurrency(selectedCapital)}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={10000000}
                    step={50000}
                    value={selectedCapital}
                    onChange={(e) => setSelectedCapital(parseInt(e.target.value))}
                    className="w-full accent-neon-blue bg-white/5 h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-text-muted font-mono">
                    <span>₹50K</span>
                    <span>₹50L</span>
                    <span>₹1Cr</span>
                  </div>
                </div>

                {/* Strategy Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Select Algorithm Strategy</label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                  >
                    {strategies.map((strat) => (
                      <option key={strat.id} value={strat.id} className="bg-surface text-text-primary">
                        {strat.name} ({strat.category}) • {strat.monthlyReturn}% p.m.
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenure Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary font-semibold">Investment Duration</span>
                    <span className="font-mono text-neon-blue font-bold">{timelineMonths} Months</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={timelineMonths}
                    onChange={(e) => setTimelineMonths(parseInt(e.target.value))}
                    className="w-full accent-neon-blue bg-white/5 h-1 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-text-muted font-mono">
                    <span>1 Month</span>
                    <span>12 Months</span>
                    <span>24 Months</span>
                  </div>
                </div>
              </div>

              {/* Set capital helper */}
              <div className="pt-4 border-t border-glass-border/40 mt-5 flex flex-col gap-2.5">
                <div className="flex items-start gap-1.5 text-[10px] text-text-muted bg-white/[0.01] border border-glass-border/30 p-2.5 rounded-lg">
                  <Info size={12} className="text-neon-blue shrink-0 mt-0.5" />
                  <p className="leading-normal">
                    Clicking "Apply to Active Portfolio" sets this capital globally in your active session environment.
                  </p>
                </div>
                <NeonButton 
                  variant="outline" 
                  size="sm" 
                  fullWidth 
                  onClick={handleUpdatePlatformCapital}
                >
                  Apply to Active Portfolio
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Results Grid */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="border border-glass-border p-4 h-24 flex flex-col justify-between" hover>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Starting Capital</span>
                <span className="text-sm font-bold font-mono text-text-primary">{formatCurrency(selectedCapital)}</span>
              </GlassCard>

              <GlassCard className="border border-glass-border p-4 h-24 flex flex-col justify-between" hover>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Projected Net PnL</span>
                <span className="text-sm font-bold font-mono text-neon-green">+{formatCurrency(totalProfit)}</span>
              </GlassCard>

              <GlassCard className="border border-glass-border p-4 h-24 flex flex-col justify-between" hover glow="green">
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Estimated ROI</span>
                <span className="text-sm font-extrabold font-mono text-neon-green">
                  {totalRoiPercent.toFixed(1)}%
                  <span className="text-[9px] font-sans font-medium text-text-secondary block mt-0.5">
                    +{currentStrategy.monthlyReturn}% Monthly Avg
                  </span>
                </span>
              </GlassCard>

              <GlassCard className="border border-glass-border p-4 h-24 flex flex-col justify-between" hover>
                <span className="text-[10px] text-text-secondary uppercase font-semibold">Tax Shield Savings</span>
                <span className="text-sm font-bold font-mono text-neon-blue">
                  {formatCurrency(sttSavings)}
                  <span className="text-[9px] font-sans font-medium text-text-secondary block mt-0.5">
                    STT & Slippage Optimization
                  </span>
                </span>
              </GlassCard>
            </div>

            {/* Projection Chart */}
            <GlassCard className="border border-glass-border flex-1 flex flex-col justify-between min-h-[340px]" glow="none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Growth Projection Comparison</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">Compounded growth model comparison over selected tenure</p>
                </div>
                <div className="text-[10px] font-mono font-bold text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded border border-neon-blue/20">
                  Compounding Active
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAlgo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#475569" 
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a12",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        color: "#e2e8f0",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontFamily: "monospace"
                      }}
                      formatter={(value: any) => [formatCurrency(value), ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="TradeMetrix Algo" 
                      stroke="#00d4ff" 
                      fillOpacity={1} 
                      fill="url(#colorAlgo)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Nifty Mutual Fund" 
                      stroke="#a855f7" 
                      fillOpacity={1} 
                      fill="url(#colorNifty)" 
                      strokeWidth={1.5}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Fixed Deposit" 
                      stroke="#64748b" 
                      fillOpacity={0}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Comparative Advantage */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border p-5">
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Why Algorithmic Services Outperform</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] text-neon-blue font-bold uppercase tracking-wider block">1. Dynamic Order Splitting</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  For capital allocations above ₹25 Lakhs, large orders are broken up and routed dynamically across up to 15 broker endpoints to reduce slippage and capture optimal premium spreads.
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-neon-purple font-bold uppercase tracking-wider block">2. Tax Shield (STT Savings)</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Weekly index option rolls generate massive Securities Transaction Tax (STT) loads. Our proprietary option basket routing algorithms save up to 28% in transaction taxes relative to manual trading.
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-neon-green font-bold uppercase tracking-wider block">3. Systemic Risk Controls</span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Every deployable strategy utilizes tight, automated risk limits. Max daily drawdown triggers and dynamic option hedging safeguard capital during flash swings and macro liquidity shocks.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
