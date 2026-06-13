"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  marketSentiment,
  sectorStrengthData,
  smartMoneyActivity,
  volatilityData,
  marketBreadth,
} from "@/lib/dummy-data";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { useMarketData } from "@/components/providers/MarketDataContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const oiData = [
  { strike: 23200, callOI: 12.5, putOI: 45.8 },
  { strike: 23250, callOI: 8.2, putOI: 30.5 },
  { strike: 23300, callOI: 18.4, putOI: 58.2 },
  { strike: 23350, callOI: 14.1, putOI: 22.4 },
  { strike: 23400, callOI: 35.8, putOI: 62.1 },
  { strike: 23450, callOI: 42.6, putOI: 38.5 },
  { strike: 23500, callOI: 85.2, putOI: 24.1 },
  { strike: 23550, callOI: 30.8, putOI: 8.4 },
  { strike: 23600, callOI: 72.4, putOI: 12.1 },
];

const liquidityPools = [
  { symbol: "NIFTY 50", type: "SSL", level: 23290.5, strength: 3, status: "SWEPT (MSS DISPLACEMENT)", desc: "Asia Session Low swept clean, displacement confirmed on 5m" },
  { symbol: "BANKNIFTY", type: "BSL", level: 50280.0, strength: 3, status: "APPROACHING ZONE", desc: "Equal highs sitting above current price. Prime draw on liquidity." },
  { symbol: "RELIANCE", type: "SSL", level: 2895.0, strength: 2, status: "MITIGATED", desc: "4h Bullish Order Block mitigated, liquidity swept." },
  { symbol: "HDFCBANK", type: "BSL", level: 1622.0, strength: 2, status: "SWEPT (REJECTION)", desc: "Daily swing high swept, bearish breaker mitigation on 15m." },
  { symbol: "SBIN", type: "SSL", level: 825.0, strength: 1, status: "MITIGATED", desc: "Weekly low sweep. Double bottom liquidity cleared." }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

export default function MarketIntelligencePage() {
  const { tickers } = useMarketData();
  const vixTick = tickers["INDIA VIX"];
  const vixChangeIsNegative = vixTick ? vixTick.changePercent <= 0 : volatilityData.vixChange <= 0;

  // Breadth calculations
  const totalStocks = marketBreadth.advancing + marketBreadth.declining + marketBreadth.unchanged;
  const advancingPercent = (marketBreadth.advancing / totalStocks) * 100;
  const decliningPercent = (marketBreadth.declining / totalStocks) * 100;
  const unchangedPercent = (marketBreadth.unchanged / totalStocks) * 100;

  // Sentiment calculations
  const sentimentRadius = 100;
  const sentimentCircumference = Math.PI * sentimentRadius;
  const sentimentVal = marketSentiment.overall; // 65
  const sentimentPct = ((sentimentVal + 100) / 200) * 100;
  const sentimentDashoffset = sentimentCircumference - (sentimentPct / 100) * sentimentCircumference;

  const getSmartMoneyIcon = (type: string) => {
    switch (type) {
      case "accumulation":
        return <TrendingUp size={14} className="text-neon-green" />;
      case "distribution":
        return <TrendingDown size={14} className="text-neon-red" />;
      case "block_deal":
        return <Layers size={14} className="text-neon-blue" />;
      default:
        return <Zap size={14} className="text-neon-purple" />;
    }
  };

  const getSmartMoneyColor = (type: string) => {
    switch (type) {
      case "accumulation":
        return "border-neon-green/20 bg-neon-green/5";
      case "distribution":
        return "border-neon-red/20 bg-neon-red/5";
      case "block_deal":
        return "border-neon-blue/20 bg-neon-blue/5";
      default:
        return "border-neon-purple/20 bg-neon-purple/5";
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Market Intelligence" subtitle="Real-time market analysis and smart money tracking" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Top Split Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Semicircular Sentiment Gauge */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="blue">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Market Sentiment Gauge
                </h2>
                <p className="text-[10px] text-text-secondary">Composite index representing current market mood</p>
              </div>

              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-56 h-28 flex items-end justify-center overflow-hidden">
                  <svg width="220" height="110" className="absolute top-0">
                    <defs>
                      <linearGradient id="intelSentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff3366" />
                        <stop offset="30%" stopColor="#ffaa00" />
                        <stop offset="70%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#00ff88" />
                      </linearGradient>
                    </defs>
                    {/* Background Arc */}
                    <circle
                      cx="110"
                      cy="110"
                      r={sentimentRadius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeWidth="14"
                      strokeDasharray={sentimentCircumference}
                      strokeLinecap="round"
                    />
                    {/* Foreground Arc */}
                    <circle
                      cx="110"
                      cy="110"
                      r={sentimentRadius}
                      fill="none"
                      stroke="url(#intelSentimentGradient)"
                      strokeWidth="14"
                      strokeDasharray={sentimentCircumference}
                      strokeDashoffset={sentimentDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  <div className="flex flex-col items-center mb-1">
                    <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                      {sentimentVal > 0 ? "+" : ""}
                      {sentimentVal}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-neon-green mt-0.5">
                      {marketSentiment.label}
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-text-secondary mt-6 px-4">
                  <div className="flex flex-col items-center">
                    <span className="text-neon-red font-bold font-mono">{marketSentiment.bearishProbability}%</span>
                    <span className="text-[10px] text-text-muted">Bearish</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-neon-green font-bold font-mono">{marketSentiment.bullishProbability}%</span>
                    <span className="text-[10px] text-text-muted">Bullish</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-glass-border/50 flex items-center justify-center gap-1 text-[10px] text-text-muted">
                <Compass size={11} />
                Calculated zone: <span className="text-neon-green font-semibold uppercase">{marketSentiment.label}</span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Volatility Index & Breadth Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-6">
            {/* Volatility Index Card */}
            <GlassCard className="border border-glass-border flex flex-col justify-between" glow="none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                    Volatility Index (India VIX)
                  </h2>
                  <p className="text-[10px] text-text-secondary">Expected 30-day market volatility gauge</p>
                </div>
                <StatusBadge variant={vixChangeIsNegative ? "buy" : "sell"}>
                  {vixChangeIsNegative ? "VIX Falling" : "VIX Rising"}
                </StatusBadge>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-1">
                <div>
                  <span className="text-4xl font-extrabold text-text-primary tracking-tight font-mono">
                    {vixTick ? vixTick.price : volatilityData.indiaVix}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {vixChangeIsNegative ? (
                      <TrendingDown size={14} className="text-neon-green" />
                    ) : (
                      <TrendingUp size={14} className="text-neon-red" />
                    )}
                    <span className={cn("text-xs font-bold font-mono", vixChangeIsNegative ? "text-neon-green" : "text-neon-red")}>
                      {vixTick ? vixTick.changePercent : volatilityData.vixChange}%
                    </span>
                    <span className="text-[10px] text-text-muted">Today's change</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Historical Average</span>
                    <span className="font-semibold text-text-primary font-mono">{volatilityData.historicalAvg}</span>
                  </div>
                  {/* Visual comparison bar */}
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-neon-blue rounded-full"
                      style={{ width: `${(volatilityData.indiaVix / 25) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-text-muted font-semibold uppercase">
                    <span>Low Volatility (10)</span>
                    <span>High Volatility (25)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Market Breadth Card */}
            <GlassCard className="border border-glass-border flex flex-col justify-between" glow="none">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Market Breadth (Advances/Declines)
                </h2>
                <p className="text-[10px] text-text-secondary">Ratio of advancing stocks to declining stocks</p>
              </div>

              <div className="space-y-4 my-2">
                {/* Horizontal Stacked Bar */}
                <div className="w-full h-4 rounded-xl overflow-hidden flex">
                  <div
                    className="h-full bg-neon-green transition-all duration-500"
                    style={{ width: `${advancingPercent}%` }}
                  />
                  <div
                    className="h-full bg-white/10 transition-all duration-500"
                    style={{ width: `${unchangedPercent}%` }}
                  />
                  <div
                    className="h-full bg-neon-red transition-all duration-500"
                    style={{ width: `${decliningPercent}%` }}
                  />
                </div>

                {/* Legend Row */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="flex flex-col">
                    <span className="text-neon-green font-bold font-mono">{marketBreadth.advancing}</span>
                    <span className="text-[10px] text-text-secondary uppercase">Advances</span>
                  </div>
                  <div className="flex flex-col border-x border-glass-border/30">
                    <span className="text-text-muted font-bold font-mono">{marketBreadth.unchanged}</span>
                    <span className="text-[10px] text-text-secondary uppercase">Unchanged</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neon-red font-bold font-mono">{marketBreadth.declining}</span>
                    <span className="text-[10px] text-text-secondary uppercase">Declines</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Center Grid: Sector Strength & Smart Money Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sector Strength Panel */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border" glow="none">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                Sector Strength Index
              </h2>

              <div className="space-y-3.5">
                {sectorStrengthData.map((sector, idx) => {
                  const isPositive = sector.strength >= 0;
                  // Map strength from -100..100 to 0..100 for bar width
                  const barPct = ((sector.strength + 100) / 200) * 100;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary">{sector.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className={isPositive ? "text-neon-green" : "text-neon-red"}>
                            {sector.strength > 0 ? "+" : ""}
                            {sector.strength}
                          </span>
                          <span className="text-[10px] text-text-muted">Vol: {sector.volume}</span>
                        </div>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full ${isPositive ? "bg-neon-green" : "bg-neon-red"}`}
                          style={{ width: `${Math.abs(sector.strength)}%`, marginLeft: isPositive ? "50%" : "auto", marginRight: isPositive ? "auto" : "50%" }}
                        />
                        {/* Center line indicator */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-glass-border" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>

          {/* Smart Money Activity Timeline Feed */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Smart Money Tracking Feed
                </h2>
                <p className="text-[10px] text-text-secondary">Real-time institutional trade accumulation blocks</p>
              </div>

              <div className="space-y-3.5 mt-4">
                {smartMoneyActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex gap-3.5 p-3 rounded-xl border ${getSmartMoneyColor(activity.type)}`}
                  >
                    <div className="mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-surface border border-glass-border/40">
                      {getSmartMoneyIcon(activity.type)}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-primary">{activity.symbol}</span>
                        <span className="text-[9px] text-text-muted font-mono">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">{activity.description}</p>
                      <div className="text-[9px] text-text-muted uppercase font-semibold font-mono tracking-wider pt-0.5">
                        BLOCK SIZE: ₹{(activity.value / 10000000).toFixed(2)}Cr
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Phase 3: Liquidity Sweeps Panel */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border" glow="blue">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Institutional Liquidity Pools & Sweeps (SMC/ICT)
                </h2>
                <p className="text-[10px] text-text-secondary">Track institutional buy-side (BSL) and sell-side (SSL) liquidity sweeps in real-time</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neon-green" />
                  <span className="text-text-secondary">Bullish SSL Swept</span>
                </span>
                <span className="flex items-center gap-1.5 ml-3">
                  <span className="w-2 h-2 rounded-full bg-neon-red" />
                  <span className="text-text-secondary">Bearish BSL Swept</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-2 pb-3">Symbol</th>
                    <th className="py-2 pb-3">Type</th>
                    <th className="py-2 pb-3 font-mono text-center">Sweep Level</th>
                    <th className="py-2 pb-3 font-mono text-center">Live Quote</th>
                    <th className="py-2 pb-3 text-center">Institutional Strength</th>
                    <th className="py-2 pb-3 text-right">Liquidity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/30 text-xs">
                  {liquidityPools.map((pool, idx) => {
                    const tick = tickers[pool.symbol];
                    const currentPrice = tick ? tick.price : pool.level * 1.01;
                    
                    // Dynamic status calculation
                    let status = pool.status;
                    let badgeVariant: "buy" | "sell" | "warning" | "info" = "info";
                    
                    if (pool.type === "SSL") {
                      if (currentPrice <= pool.level) {
                        status = "SWEPT (LIQUIDITY SHIFT)";
                        badgeVariant = "buy";
                      } else if (currentPrice <= pool.level * 1.005) {
                        status = "SWEEP IN PROGRESS";
                        badgeVariant = "warning";
                      } else {
                        status = "ACTIVE DRAW (SSL)";
                        badgeVariant = "info";
                      }
                    } else { // BSL
                      if (currentPrice >= pool.level) {
                        status = "SWEPT (DISTRIBUTION)";
                        badgeVariant = "sell";
                      } else if (currentPrice >= pool.level * 0.995) {
                        status = "SWEEP IN PROGRESS";
                        badgeVariant = "warning";
                      } else {
                        status = "ACTIVE DRAW (BSL)";
                        badgeVariant = "info";
                      }
                    }

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{pool.symbol}</span>
                            <span className="text-[10px] text-text-secondary font-medium">{pool.desc}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            pool.type === "SSL" ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-neon-red/10 text-neon-red border border-neon-red/20"
                          )}>
                            {pool.type}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-center text-text-secondary font-semibold">
                          ₹{pool.level.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 font-mono text-center">
                          {tick ? (
                            <span className={cn("font-bold", tick.changePercent >= 0 ? "text-neon-green" : "text-neon-red")}>
                              ₹{tick.price.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1.5 h-3.5 rounded-sm transition-all duration-300",
                                  i < pool.strength 
                                    ? pool.type === "SSL" ? "bg-neon-green shadow-[0_0_5px_#00ff88]" : "bg-neon-red shadow-[0_0_5px_#ff3366]"
                                    : "bg-white/10"
                                )}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <StatusBadge variant={badgeVariant} pulse={status.includes("PROGRESS")}>
                            {status}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Option Chain Open Interest (OI) Profile */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border" glow="blue">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Options Open Interest (OI) Profile
                </h2>
                <p className="text-[10px] text-text-secondary">
                  Strike-wise Call vs Put open contracts distribution (in Lakhs) for current NIFTY weekly expiry
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-neon-green rounded-sm" />
                  <span className="text-text-secondary">Put OI (Support)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-neon-red rounded-sm" />
                  <span className="text-text-secondary">Call OI (Resistance)</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-white/5 border border-glass-border font-mono text-[10px] text-neon-blue">
                  PCR: 0.94 (Bullish-Neutral)
                </div>
              </div>
            </div>

            <div className="h-80 w-full font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={oiData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                  <XAxis 
                    dataKey="strike" 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <YAxis 
                    stroke="rgba(255, 255, 255, 0.3)" 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 10, 0.95)",
                      borderColor: "rgba(0, 212, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#f5f5f5",
                    }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                    formatter={(value: any, name: any) => [
                      `${value}L Contracts`,
                      name === "callOI" ? "Call OI" : "Put OI"
                    ]}
                  />
                  <Bar dataKey="putOI" fill="#00ff88" radius={[4, 4, 0, 0]} maxBarSize={30} name="Put Open Interest" />
                  <Bar dataKey="callOI" fill="#ff3366" radius={[4, 4, 0, 0]} maxBarSize={30} name="Call Open Interest" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 pt-3 border-t border-glass-border/30 flex justify-between items-center text-[10px] text-text-muted">
              <span>Max Pain Strike: <strong className="text-text-primary">23,450</strong></span>
              <span>Spot Price: <strong className="text-neon-blue font-mono">₹{tickers["NIFTY 50"]?.price || "23,450.50"}</strong></span>
              <span>Updated: Real-time (NFO Feed)</span>
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </div>
  );
}
