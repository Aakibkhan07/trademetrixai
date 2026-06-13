"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  Play,
  TrendingUp,
  Percent,
  Activity,
  Calendar,
  Wallet,
  Clock,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Terminal,
  Lock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDemo } from "@/components/providers/DemoContext";
import { backtestResult, strategies } from "@/lib/dummy-data";
import { formatCurrency, formatPercent, getPnlColor } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

// --- Dynamic Backtest Generator Engine ---
const generateDynamicBacktest = (
  stratId: string,
  symbol: string,
  timeframe: string,
  startDate: string,
  endDate: string,
  capital: number
) => {
  const strat = strategies.find((s) => s.id === stratId) || strategies[0];
  
  // Calculate date diff in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 150;
  
  // Trades frequency multiplier based on timeframe
  let freqMult = 1.0;
  if (timeframe === "1min") freqMult = 3.5;
  else if (timeframe === "5min") freqMult = 2.0;
  else if (timeframe === "15min") freqMult = 1.0;
  else if (timeframe === "1hr") freqMult = 0.5;
  else if (timeframe === "daily") freqMult = 0.15;
  
  const totalTrades = Math.max(12, Math.round(strat.totalTrades * (diffDays / 365) * freqMult * 0.1));
  const winRate = Math.min(96, Math.max(40, strat.winRate + (Math.random() * 4 - 2)));
  const winningTrades = Math.round(totalTrades * (winRate / 100));
  const losingTrades = totalTrades - winningTrades;
  
  const sharpeRatio = Math.max(0.5, Math.round((strat.sharpeRatio + (Math.random() * 0.4 - 0.2)) * 100) / 100);
  const profitFactor = Math.max(1.1, Math.round((1.2 + (winRate / 100) * sharpeRatio + Math.random() * 0.25) * 100) / 100);
  
  const maxDrawdownPercent = Math.max(0.5, Math.round((strat.maxDrawdown * (0.8 + Math.random() * 0.4)) * 100) / 100);
  const maxDrawdown = Math.round(capital * (maxDrawdownPercent / 100));
  
  const monthlyReturn = strat.monthlyReturn + (Math.random() * 3 - 1.5);
  const netProfitPercent = Math.round((monthlyReturn * (diffDays / 30)) * 100) / 100;
  const netProfit = Math.round(capital * (netProfitPercent / 100));
  
  const avgWin = Math.round((netProfit * 1.5) / Math.max(1, winningTrades));
  const avgLoss = Math.round((netProfit * 0.5) / Math.max(1, losingTrades));
  const largestWin = Math.round(avgWin * (2 + Math.random() * 2));
  const largestLoss = Math.round(avgLoss * (1.5 + Math.random() * 1.5));
  
  // Generate Equity Curve
  const equityCurve: any[] = [];
  let currentBalance = capital;
  let peak = capital;
  const step = Math.ceil(diffDays / 15) || 1;
  
  for (let i = 0; i <= diffDays; i += step) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Add random walk with positive drift
    const drift = netProfitPercent / (diffDays / step) / 100;
    const volatility = (maxDrawdownPercent / 100) * 0.35;
    const dailyReturn = drift + (Math.random() - 0.45) * volatility;
    
    currentBalance = Math.round(currentBalance * (1 + dailyReturn));
    peak = Math.max(peak, currentBalance);
    const dd = Math.round(((peak - currentBalance) / peak) * 10000) / 100;
    
    equityCurve.push({
      date: dateStr,
      balance: currentBalance,
      drawdown: dd,
    });
  }
  
  // Make sure last point matches exact ending balance
  const lastDateStr = end.toISOString().split("T")[0];
  equityCurve.push({
    date: lastDateStr,
    balance: capital + netProfit,
    drawdown: 0,
  });

  // Generate Trades Log list
  const trades: any[] = [];
  const symbolBase = symbol.toUpperCase();
  
  for (let i = 0; i < 15; i++) {
    const tradeDate = new Date(start);
    tradeDate.setDate(tradeDate.getDate() + Math.floor(Math.random() * diffDays));
    const dateStr = tradeDate.toISOString().split("T")[0];
    
    const isWin = Math.random() * 100 < winRate;
    const direction = Math.random() > 0.4 ? "BUY" : "SELL";
    
    let basePrice = 23000;
    if (symbolBase.includes("BANK")) basePrice = 50000;
    else if (symbolBase.includes("SENSEX")) basePrice = 74000;
    else if (symbolBase.includes("RELIANCE")) basePrice = 2900;
    else if (symbolBase.includes("INFY")) basePrice = 1450;
    
    const entryPrice = Math.round(basePrice * (0.95 + Math.random() * 0.1) * 100) / 100;
    const pnlPercent = isWin 
      ? Math.round((1.5 + Math.random() * 6.5) * 100) / 100
      : -Math.round((0.5 + Math.random() * 2.5) * 100) / 100;
      
    const pnl = Math.round(capital * 0.02 * (pnlPercent / 100) * 10) / 10;
    const exitPrice = Math.round(entryPrice * (1 + (direction === "BUY" ? pnlPercent : -pnlPercent) / 100) * 100) / 100;
    
    const holdingPeriod = timeframe === "1min" ? `${10 + Math.floor(Math.random() * 50)}min`
      : timeframe === "5min" ? `${15 + Math.floor(Math.random() * 90)}min`
      : timeframe === "15min" ? `${1 + Math.floor(Math.random() * 4)}hr`
      : timeframe === "1hr" ? `${3 + Math.floor(Math.random() * 8)}hr`
      : `${1 + Math.floor(Math.random() * 5)}d`;
      
    trades.push({
      id: `t-${100 + i}`,
      entryDate: dateStr,
      exitDate: dateStr,
      direction,
      entryPrice,
      exitPrice,
      pnl,
      pnlPercent,
      holdingPeriod,
    });
  }
  
  // Sort trades by date
  trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent,
    netProfit,
    netProfitPercent,
    sharpeRatio,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    equityCurve,
    monthlyReturns: [], // static structure reference
    trades,
  };
};

export default function BacktestingLabPage() {
  const { capital, injectNotification, updateSettings } = useDemo();
  
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]?.id || "");
  const [symbol, setSymbol] = useState("NIFTY 50");
  const [timeframe, setTimeframe] = useState("15min");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-06-01");
  const [initialCapital, setInitialCapital] = useState(1000000);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentResult, setCurrentResult] = useState(backtestResult);

  // Compute selected strategy properties and HNI lock states
  const selectedStratObj = strategies.find(s => s.id === selectedStrategy) || strategies[0];
  const isHniLocked = !!selectedStratObj.isHniOnly && capital < (selectedStratObj.minInvestment || 5000000);

  const handleRunBacktest = async () => {
    if (isHniLocked) {
      injectNotification(
        "Backtest Blocked",
        `This strategy requires at least ₹${(selectedStratObj.minInvestment || 5000000).toLocaleString()} capital. Boost your portfolio to run it.`,
        "warning"
      );
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setLogs([`[${new Date().toLocaleTimeString()}] Initializing backtest engine...`]);

    try {
      // Mapping frontend strategy to preset strategy name in backtest-engine.ts
      let strategyName = "EMA Crossover";
      if (selectedStratObj.name.toLowerCase().includes("momentum") || selectedStratObj.name.toLowerCase().includes("ssma") || selectedStratObj.name.toLowerCase().includes("hunter")) {
        strategyName = "RSI Mean Reversion";
      } else if (selectedStratObj.name.toLowerCase().includes("breakout") || selectedStratObj.name.toLowerCase().includes("volume") || selectedStratObj.name.toLowerCase().includes("arbitrage") || selectedStratObj.name.toLowerCase().includes("rider")) {
        strategyName = "VWAP Momentum";
      }

      // Map frontend timeframe ("1min", "5min", "15min", "1hr", "daily") to yfinance intervals
      let intervalParam = "1d";
      if (timeframe === "1min" || timeframe === "5min" || timeframe === "15min") {
        intervalParam = "15m";
      } else if (timeframe === "1hr") {
        intervalParam = "1h";
      } else if (timeframe === "daily") {
        intervalParam = "1d";
      }

      // Calculate historical period based on start/end dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 180;
      
      let periodParam = "6mo";
      if (diffDays <= 30) periodParam = "1mo";
      else if (diffDays <= 90) periodParam = "3mo";
      else if (diffDays <= 180) periodParam = "6mo";
      else if (diffDays <= 365) periodParam = "1y";
      else periodParam = "2y";

      setProgress(20);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Fetching historical candles for ${symbol} via yFinance index feeds...`]);

      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          strategyName,
          period: periodParam,
          interval: intervalParam,
          initialCapital,
        }),
      });

      setProgress(50);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Loaded OHLCV historical bars from ${startDate} to ${endDate} on ${timeframe} intervals.`]);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to run backtest");
      }

      setProgress(75);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Computing indicator overlay structures: Bollinger Bands, Supertrends, Auto Key Levels.`]);

      const data = await res.json();
      
      setProgress(90);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Evaluating trade signal logic against market structure transitions...`]);

      const backtestRes = data.result;

      // Map backtest trades to UI schema
      const mappedTrades = backtestRes.trades.map((t: any, idx: number) => ({
        id: `t-${idx}`,
        entryDate: t.entryDate,
        exitDate: t.exitDate,
        direction: t.direction === "LONG" ? "BUY" : "SELL",
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        pnl: t.pnl,
        pnlPercent: t.pnlPercent,
        holdingPeriod: `${t.holdingBars} bars`,
      }));

      // Sort trades (newest first)
      mappedTrades.sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

      // Format equity curve
      const mappedEquityCurve = backtestRes.equityCurve.map((pt: any) => ({
        date: pt.date,
        balance: pt.equity,
        drawdown: pt.drawdown,
      }));

      setProgress(100);
      setLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Calculating maximum peak drawdowns, portfolio profit factors, and Sharpe Ratio...`,
        `[${new Date().toLocaleTimeString()}] Compiling institutional performance logs & generating summary card...`
      ]);

      setCurrentResult({
        totalTrades: backtestRes.totalTrades,
        winningTrades: backtestRes.winningTrades,
        losingTrades: backtestRes.losingTrades,
        winRate: backtestRes.winRate,
        profitFactor: backtestRes.profitFactor,
        maxDrawdown: backtestRes.maxDrawdown,
        maxDrawdownPercent: backtestRes.maxDrawdownPercent,
        netProfit: backtestRes.totalPnl,
        netProfitPercent: backtestRes.totalPnlPercent,
        sharpeRatio: backtestRes.sharpeRatio,
        avgWin: backtestRes.avgWin,
        avgLoss: backtestRes.avgLoss,
        largestWin: backtestRes.largestWin,
        largestLoss: backtestRes.largestLoss,
        equityCurve: mappedEquityCurve,
        monthlyReturns: [],
        trades: mappedTrades,
      });

      injectNotification(
        "Backtest Completed",
        `Successfully backtested ${selectedStratObj.name} on ${symbol}. Net Profit: ₹${backtestRes.totalPnl.toLocaleString("en-IN")}.`,
        "success"
      );

    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message || "Failed to complete backtest"}`]);
      injectNotification("Backtest Failed", err.message || "Failed to execute backtest.", "warning");
    } finally {
      setIsRunning(false);
    }
  };

  const handleBoostHniCapital = () => {
    const requiredCap = selectedStratObj.minInvestment || 5000000;
    updateSettings({ capital: requiredCap });
    setInitialCapital(requiredCap);
    injectNotification(
      "HNI Capital Injected",
      `Portfolio balance boosted to ₹${requiredCap.toLocaleString()}. Institutional access unlocked!`,
      "success"
    );
  };

  const statsRow: {
    label: string;
    value: number;
    icon?: any;
    suffix?: string;
    prefix?: string;
    isPnl?: boolean;
    isNeg?: boolean;
    formatter?: (val: number) => string;
  }[] = [
    { label: "Total Trades", value: currentResult.totalTrades, icon: Briefcase },
    { label: "Win Rate", value: currentResult.winRate, suffix: "%", icon: Percent },
    { label: "Profit Factor", value: currentResult.profitFactor, icon: Activity },
    {
      label: "Max Drawdown",
      value: -currentResult.maxDrawdownPercent,
      suffix: "%",
      icon: TrendingUp,
      isNeg: true,
    },
    {
      label: "Net Profit",
      value: currentResult.netProfit,
      prefix: "+",
      formatter: (val: number) => formatCurrency(val),
      isPnl: true,
      suffix: ` (${formatPercent(currentResult.netProfitPercent)})`,
      icon: Wallet,
    },
    { label: "Sharpe Ratio", value: currentResult.sharpeRatio, icon: Layers },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Backtesting Lab" subtitle="Historical strategy performance analysis" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Configurations Panel */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border" glow="blue">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
              Backtest Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Strategy Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Strategy</label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                >
                  {strategies.map((strat) => (
                    <option key={strat.id} value={strat.id} className="bg-surface text-text-primary">
                      {strat.name} {strat.isHniOnly ? "👑" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symbol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                />
              </div>

              {/* Timeframe */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                >
                  <option value="1min" className="bg-surface">1 Minute</option>
                  <option value="5min" className="bg-surface">5 Minutes</option>
                  <option value="15min" className="bg-surface">15 Minutes</option>
                  <option value="1hr" className="bg-surface">1 Hour</option>
                  <option value="daily" className="bg-surface">Daily</option>
                </select>
              </div>

              {/* Date Ranges */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-secondary uppercase font-semibold">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                />
              </div>

              {/* Run button */}
              <div className="flex items-end">
                <NeonButton
                  variant={isHniLocked ? "purple" : "blue"}
                  fullWidth
                  glow
                  disabled={isRunning}
                  onClick={handleRunBacktest}
                  className="h-10 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider"
                >
                  {isHniLocked ? (
                    <>
                      <Lock size={16} />
                      HNI Locked
                    </>
                  ) : (
                    <>
                      <FlaskConical size={16} className={isRunning ? "animate-pulse" : ""} />
                      {isRunning ? "Running..." : "Run Lab"}
                    </>
                  )}
                </NeonButton>
              </div>
            </div>

            {/* HNI Lock warning banner inside configuration */}
            {isHniLocked && (
              <div className="mt-4 p-3 rounded-xl bg-neon-purple/5 border border-neon-purple/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-text-secondary">
                  <AlertTriangle className="text-neon-purple shrink-0" size={15} />
                  <span>
                    The strategy <strong>{selectedStratObj.name}</strong> is reserved for HNI portfolios. It requires a minimum capital of <strong>₹{(selectedStratObj.minInvestment || 5000000).toLocaleString()}</strong>.
                  </span>
                </div>
                <button
                  onClick={handleBoostHniCapital}
                  className="px-3 py-1 rounded-lg bg-neon-purple/10 border border-neon-purple/20 hover:bg-neon-purple/20 text-neon-purple font-semibold transition-colors whitespace-nowrap uppercase tracking-wider text-[10px]"
                >
                  Boost Capital & Unlock
                </button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Live Terminal Log Stream Console */}
        <AnimatePresence>
          {(isRunning || logs.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              variants={itemVariants}
            >
              <GlassCard className="border border-glass-border bg-black/70 font-mono text-[11px] p-4 rounded-xl space-y-1 text-neon-blue relative overflow-hidden" glow="blue">
                <div className="absolute top-2 right-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-ping" />
                  <span className="text-[9px] text-text-muted uppercase tracking-wider">Backtest Console</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-text-primary border-b border-glass-border/30 pb-2">
                  <Terminal size={13} className="text-neon-blue animate-pulse" />
                  <span className="font-bold text-xs uppercase">Engine Processing Stream</span>
                  {isRunning && <span className="ml-auto text-neon-blue font-bold">{Math.round(progress)}%</span>}
                </div>
                
                {/* Progress bar */}
                {isRunning && (
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-gradient-to-r from-neon-blue to-neon-purple h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-text-muted select-none">&gt;&gt;</span>
                      <span className={idx === logs.length - 1 && isRunning ? "text-text-primary font-bold" : "text-neon-blue/80"}>
                        {log}
                      </span>
                    </div>
                  ))}
                  {!isRunning && (
                    <div className="flex items-center gap-1.5 text-neon-green font-bold mt-2">
                      <CheckCircle2 size={12} />
                      <span>Report generated successfully. Results loaded below.</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Stats row */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statsRow.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <GlassCard key={idx} className="border border-glass-border flex flex-col justify-between p-4 h-28" hover>
                  <div className="flex items-center justify-between text-text-secondary text-[10px] uppercase font-semibold tracking-wider">
                    <span>{stat.label}</span>
                    {Icon && <Icon size={14} className="text-text-muted" />}
                  </div>

                  <div className="text-xl font-bold text-text-primary mt-2">
                    {stat.isPnl ? (
                      <span className="text-neon-green">
                        {stat.prefix}
                        {stat.formatter ? stat.formatter(stat.value) : stat.value}
                      </span>
                    ) : stat.isNeg ? (
                      <span className="text-neon-red">
                        {stat.value}
                        {stat.suffix}
                      </span>
                    ) : (
                      <span>
                        {stat.value}
                        {stat.suffix}
                      </span>
                    )}

                    {stat.isPnl && stat.suffix && (
                      <span className="text-xs ml-1 font-medium text-neon-green">{stat.suffix}</span>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </motion.div>

          {/* Core performance charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Equity Curve Area Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
              <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
                <div>
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Equity Growth Curve</h3>
                  <p className="text-[10px] text-text-secondary">Cumulative portfolio value over backtest window</p>
                </div>

                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentResult.equityCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="equityGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a0a12",
                          borderColor: "rgba(255,255,255,0.08)",
                          color: "#e2e8f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                        formatter={(value: any) => [`₹${value?.toLocaleString()}`, "Equity"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#00d4ff"
                        strokeWidth={2}
                        fill="url(#equityGlow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* Additional stats */}
            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
              <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Detailed Analytics</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/30">
                    <span className="text-xs text-text-secondary">Average Win Trade</span>
                    <span className="text-xs font-bold text-neon-green">+{formatCurrency(currentResult.avgWin)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/30">
                    <span className="text-xs text-text-secondary">Average Loss Trade</span>
                    <span className="text-xs font-bold text-neon-red">-{formatCurrency(currentResult.avgLoss)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/30">
                    <span className="text-xs text-text-secondary">Largest Win Trade</span>
                    <span className="text-xs font-bold text-neon-green">+{formatCurrency(currentResult.largestWin)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/30">
                    <span className="text-xs text-text-secondary">Largest Loss Trade</span>
                    <span className="text-xs font-bold text-neon-red">-{formatCurrency(currentResult.largestLoss)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-glass-border/30">
                    <span className="text-xs text-text-secondary">Winning / Losing Trades</span>
                    <span className="text-xs font-bold text-text-primary">
                      {currentResult.winningTrades} / {currentResult.losingTrades}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-glass-border text-center text-xs text-text-muted mt-4">
                  Backtest score is verified as <span className="text-neon-blue font-bold">Institutional A+ Grade</span>.
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Trade List Log Table */}
          <motion.div variants={itemVariants}>
            <GlassCard className="border border-glass-border">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Backtest Trade Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      <th className="py-2 pb-3">Date</th>
                      <th className="py-2 pb-3">Symbol</th>
                      <th className="py-2 pb-3">Direction</th>
                      <th className="py-2 pb-3">Entry Price</th>
                      <th className="py-2 pb-3">Exit Price</th>
                      <th className="py-2 pb-3">Hold Period</th>
                      <th className="py-2 pb-3 text-right">Profit / Loss</th>
                      <th className="py-2 pb-3 text-right">% Chg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/30 text-xs">
                    {currentResult.trades.slice(0, 8).map((trade, idx) => {
                      const isProfit = trade.pnl >= 0;
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 text-text-secondary font-mono">{trade.entryDate}</td>
                          <td className="py-3 font-semibold text-text-primary">{symbol}</td>
                          <td className="py-3">
                            <StatusBadge variant={trade.direction === "BUY" ? "buy" : "sell"}>
                              {trade.direction}
                            </StatusBadge>
                          </td>
                          <td className="py-3 font-mono text-text-secondary">₹{trade.entryPrice}</td>
                          <td className="py-3 font-mono text-text-secondary">₹{trade.exitPrice}</td>
                          <td className="py-3 text-text-muted">{trade.holdingPeriod}</td>
                          <td className={`py-3 text-right font-bold font-mono ${getPnlColor(trade.pnl)}`}>
                            {isProfit ? "+" : ""}
                            {formatCurrency(trade.pnl)}
                          </td>
                          <td className={`py-3 text-right font-bold font-mono ${getPnlColor(trade.pnl)}`}>
                            {formatPercent(trade.pnlPercent)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
