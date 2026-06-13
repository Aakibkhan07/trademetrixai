"use client";

import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  BarChart3,
  Percent,
  Flame,
  Target,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getTrades } from "@/lib/trade-store";
import { useAuth } from "@/components/providers/AuthContext";

// ─── Animation Variants ───────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } as const },
};

// ─── Static Data ──────────────────────────────────────────────
const riskMetrics = [
  {
    label: "Sharpe Ratio",
    value: "2.31",
    trend: +0.12,
    icon: ShieldCheck,
    color: "neon-blue",
  },
  {
    label: "Sortino Ratio",
    value: "3.12",
    trend: +0.24,
    icon: Target,
    color: "neon-green",
  },
  {
    label: "Max Drawdown",
    value: "-4.25%",
    trend: -0.35,
    icon: TrendingDown,
    color: "neon-red",
  },
  {
    label: "Avg Daily Return",
    value: "+0.38%",
    trend: +0.05,
    icon: TrendingUp,
    color: "neon-green",
  },
  {
    label: "Volatility",
    value: "8.2%",
    trend: -0.8,
    icon: Activity,
    color: "neon-amber",
  },
  {
    label: "Calmar Ratio",
    value: "6.76",
    trend: +0.41,
    icon: Flame,
    color: "neon-purple",
  },
];

const winLossData = [
  { name: "Wins", value: 136, color: "#00ff88" },
  { name: "Losses", value: 50, color: "#ff3366" },
];


// ─── Custom Tooltip ───────────────────────────────────────────
function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm space-y-1">
      <p className="text-text-secondary text-xs">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user, firebaseReady } = useAuth();
  const userId = firebaseReady && user ? user.uid : "demo-user";
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrades() {
      const data = await getTrades(userId);
      setTrades(data);
    }
    loadTrades();
  }, [userId]);

  // 1. Capital setup
  let initialCapital = 500000;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("tm_demo_capital");
    if (stored) {
      const totalNetPnl = trades.reduce((sum, t) => sum + (t.netPnl ?? (t.pnl - (t.fees || 0))), 0);
      initialCapital = Math.max(10000, parseFloat(stored) - totalNetPnl);
    }
  }

  const startCapital = initialCapital;

  // 2. Metrics calculation
  const totalTradesCount = trades.length;
  const wins = trades.filter((t) => (t.netPnl ?? (t.pnl - (t.fees || 0))) >= 0);
  const losses = trades.filter((t) => (t.netPnl ?? (t.pnl - (t.fees || 0))) < 0);
  const winRate = totalTradesCount > 0 ? (wins.length / totalTradesCount) * 100 : 0;

  // Sorted trades (oldest first)
  const sortedTrades = [...trades].sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime());

  // Equity Curve
  let currentEquity = startCapital;
  const equityCurve = [{ date: "Initial", equity: currentEquity }];
  sortedTrades.forEach((t) => {
    currentEquity += (t.netPnl ?? (t.pnl - (t.fees || 0)));
    equityCurve.push({
      date: t.date,
      equity: Number(currentEquity.toFixed(2)),
    });
  });

  // Max Drawdown
  let maxEquity = startCapital;
  let maxDrawdown = 0;
  let currentDrawdownEquity = startCapital;
  sortedTrades.forEach((t) => {
    currentDrawdownEquity += (t.netPnl ?? (t.pnl - (t.fees || 0)));
    if (currentDrawdownEquity > maxEquity) {
      maxEquity = currentDrawdownEquity;
    }
    const drawdown = maxEquity > 0 ? ((currentDrawdownEquity - maxEquity) / maxEquity) * 100 : 0;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Sharpe/Sortino
  const tradeReturns = trades.map((t) => {
    const entryVal = t.entryPrice * t.quantity;
    const netPnl = t.netPnl ?? (t.pnl - (t.fees || 0));
    return entryVal > 0 ? (netPnl / entryVal) * 100 : 0;
  });
  const avgReturn = tradeReturns.length > 0 ? tradeReturns.reduce((sum, r) => sum + r, 0) / tradeReturns.length : 0;
  const devSum = tradeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0);
  const stdDev = tradeReturns.length > 1 ? Math.sqrt(devSum / (tradeReturns.length - 1)) : 0;
  const sharpeRatioVal = stdDev > 0 ? Math.min(5.0, Math.max(-5.0, (avgReturn / stdDev) * 1.5)) : 0;

  const negativeReturns = tradeReturns.filter((r) => r < 0);
  const downsideDevSum = negativeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0);
  const downsideStdDev = negativeReturns.length > 1 ? Math.sqrt(downsideDevSum / (negativeReturns.length - 1)) : 0.01;
  const sortinoRatioVal = downsideStdDev > 0 ? Math.min(7.0, Math.max(-5.0, (avgReturn / downsideStdDev) * 1.8)) : 0;

  const volatilityVal = stdDev;
  const calmarRatioVal = Math.abs(maxDrawdown) > 0 ? (avgReturn * 10) / Math.abs(maxDrawdown) : 0;

  const dynamicRiskMetrics = [
    {
      label: "Sharpe Ratio",
      value: sharpeRatioVal.toFixed(2),
      trend: sharpeRatioVal >= 2 ? 0.12 : -0.05,
      icon: ShieldCheck,
      color: "neon-blue",
    },
    {
      label: "Sortino Ratio",
      value: sortinoRatioVal.toFixed(2),
      trend: sortinoRatioVal >= 2.5 ? 0.24 : -0.02,
      icon: Target,
      color: "neon-green",
    },
    {
      label: "Max Drawdown",
      value: `${maxDrawdown.toFixed(2)}%`,
      trend: maxDrawdown > -5 ? 0.35 : -0.15,
      icon: TrendingDown,
      color: "neon-red",
    },
    {
      label: "Avg Return / Trade",
      value: `${avgReturn.toFixed(2)}%`,
      trend: avgReturn >= 0 ? 0.05 : -0.08,
      icon: TrendingUp,
      color: "neon-green",
    },
    {
      label: "Volatility",
      value: `${volatilityVal.toFixed(2)}%`,
      trend: volatilityVal < 5 ? 0.8 : -0.2,
      icon: Activity,
      color: "neon-amber",
    },
    {
      label: "Calmar Ratio",
      value: calmarRatioVal.toFixed(2),
      trend: calmarRatioVal > 4 ? 0.41 : -0.1,
      icon: Flame,
      color: "neon-purple",
    },
  ];

  // Win/Loss Donut
  const chartWinLossData = wins.length === 0 && losses.length === 0
    ? [{ name: "No Trades", value: 1, color: "#475569" }]
    : [
        { name: "Wins", value: wins.length, color: "#00ff88" },
        { name: "Losses", value: losses.length, color: "#ff3366" },
      ];

  // Monthly Returns & Profit Factor
  const monthlyDataMap: { [key: string]: { profit: number; loss: number; netPnl: number; count: number } } = {};
  trades.forEach((t) => {
    const d = new Date(t.date);
    const monthName = d.toLocaleString("default", { month: "short" });
    if (!monthlyDataMap[monthName]) {
      monthlyDataMap[monthName] = { profit: 0, loss: 0, netPnl: 0, count: 0 };
    }
    const netPnl = t.netPnl ?? (t.pnl - (t.fees || 0));
    monthlyDataMap[monthName].netPnl += netPnl;
    monthlyDataMap[monthName].count += 1;
    if (netPnl >= 0) {
      monthlyDataMap[monthName].profit += netPnl;
    } else {
      monthlyDataMap[monthName].loss += Math.abs(netPnl);
    }
  });

  const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedMonths = Object.keys(monthlyDataMap).sort((a, b) => monthsOrder.indexOf(a) - monthsOrder.indexOf(b));

  const monthlyReturns = sortedMonths.map((m) => {
    const returnPercent = (monthlyDataMap[m].netPnl / startCapital) * 100;
    return {
      month: m,
      returnPercent: Number(returnPercent.toFixed(2)),
    };
  });

  const profitFactorMonthlyVal = sortedMonths.map((m) => {
    const data = monthlyDataMap[m];
    const pf = data.loss === 0 ? (data.profit > 0 ? 9.9 : 0) : data.profit / data.loss;
    return {
      month: m,
      pf: Number(pf.toFixed(2)),
    };
  });

  // Strategy Performance
  const strategyDataMap: { [key: string]: { wins: number; total: number; netPnl: number; grossProfit: number; grossLoss: number } } = {};
  trades.forEach((t) => {
    const strat = t.strategy || "Manual";
    if (!strategyDataMap[strat]) {
      strategyDataMap[strat] = { wins: 0, total: 0, netPnl: 0, grossProfit: 0, grossLoss: 0 };
    }
    const netPnl = t.netPnl ?? (t.pnl - (t.fees || 0));
    strategyDataMap[strat].total += 1;
    strategyDataMap[strat].netPnl += netPnl;
    if (netPnl >= 0) {
      strategyDataMap[strat].wins += 1;
      strategyDataMap[strat].grossProfit += netPnl;
    } else {
      strategyDataMap[strat].grossLoss += Math.abs(netPnl);
    }
  });

  const strategyPerformance = Object.keys(strategyDataMap).map((name) => {
    const data = strategyDataMap[name];
    const winRate = (data.wins / data.total) * 100;
    const avgPnl = data.netPnl / data.total;
    const profitFactor = data.grossLoss === 0 ? (data.grossProfit > 0 ? 9.9 : 0) : data.grossProfit / data.grossLoss;
    return {
      name,
      winRate: Number(winRate.toFixed(1)),
      totalReturn: Number(data.netPnl.toFixed(2)),
      trades: data.total,
      avgPnl: Number(avgPnl.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
    };
  }).sort((a, b) => b.totalReturn - a.totalReturn);

  const bestStrategy = strategyPerformance.length > 0 
    ? strategyPerformance[0] 
    : { name: "N/A", winRate: 0, totalReturn: 0, trades: 0, avgPnl: 0, profitFactor: 0 };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4 md:p-6 lg:p-8 space-y-8"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neon-blue/10 border border-neon-blue/20">
            <BarChart3 className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Analytics
            </h1>
            <p className="text-text-secondary text-sm">
              Institutional-grade performance metrics
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Risk Metrics Cards ──────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {dynamicRiskMetrics.map((metric) => {
          const Icon = metric.icon;
          const isPositiveTrend = metric.trend >= 0;
          return (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              className="glass-card glass-card-hover stat-card-glow p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", `bg-${metric.color}/10`)}>
                  <Icon className={cn("w-4 h-4", `text-${metric.color}`)} />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-mono",
                    isPositiveTrend ? "text-neon-green" : "text-neon-red"
                  )}
                >
                  {isPositiveTrend ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(metric.trend).toFixed(2)}
                </div>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wider">
                  {metric.label}
                </p>
                <p className="text-xl font-bold font-mono text-text-primary mt-0.5">
                  {metric.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Equity Curve ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Equity Curve</h2>
            <p className="text-text-muted text-xs">Portfolio equity over time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Current:</span>
            <span className="text-neon-green font-mono font-bold text-sm">
              {formatCurrency(equityCurve[equityCurve.length - 1]?.equity ?? 0)}
            </span>
          </div>
        </div>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                interval={Math.max(1, Math.floor(equityCurve.length / 6))}
                tickFormatter={(v: string) => {
                  if (v === "Initial") return "Start";
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return v;
                  return `${d.toLocaleString("default", { month: "short" })} '${String(d.getFullYear()).slice(2)}`;
                }}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`}
                width={60}
              />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#equityGradient)"
                dot={false}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Win/Loss Donut + Profit Factor ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Donut */}
        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Win / Loss Ratio</h2>
            <p className="text-text-muted text-xs">Overall trade outcome distribution</p>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartWinLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={1200}
                  stroke="none"
                >
                  {chartWinLossData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold font-mono text-text-primary">{winRate.toFixed(1)}%</span>
              <span className="text-text-muted text-xs">Win Rate</span>
            </div>
          </div>
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-neon-green" />
              <span className="text-text-secondary text-sm">Wins: {wins.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-neon-red" />
              <span className="text-text-secondary text-sm">Losses: {losses.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Profit Factor Bar */}
        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Profit Factor</h2>
            <p className="text-text-muted text-xs">Monthly profit factor (gross profit / gross loss)</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitFactorMonthlyVal} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "auto"]}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="pf" name="Profit Factor" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {profitFactorMonthlyVal.map((entry, i) => (
                    <Cell key={i} fill={entry.pf >= 1 ? "#00d4ff" : "#ff3366"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Monthly Returns ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Monthly Returns</h2>
            <p className="text-text-muted text-xs">P&L breakdown by month</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neon-green" />
              <span className="text-text-secondary">Profit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-neon-red" />
              <span className="text-text-secondary">Loss</span>
            </span>
          </div>
        </div>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyReturns} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#475569", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip content={<GlassTooltip />} />
              <Bar
                dataKey="returnPercent"
                name="Return %"
                radius={[4, 4, 0, 0]}
                animationDuration={1200}
              >
                {monthlyReturns.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.returnPercent >= 0 ? "#00ff88" : "#ff3366"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Strategy Performance Table ──────────────────────── */}
      <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Strategy Performance</h2>
            <p className="text-text-muted text-xs">Comparative analysis of active strategies</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neon-amber">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Best: {bestStrategy.name}</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-glass-border">
                {["Strategy Name", "Win Rate", "Total Return", "Trades", "Avg PnL", "Profit Factor"].map(
                  (col) => (
                    <th
                      key={col}
                      className="text-left text-text-muted text-xs uppercase tracking-wider py-3 px-4 font-medium"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {strategyPerformance.map((s) => {
                const isBest = s.name === bestStrategy.name;
                return (
                  <tr
                    key={s.name}
                    className={cn(
                      "border-b border-glass-border/50 transition-colors hover:bg-glass-hover",
                      isBest && "bg-neon-amber/5"
                    )}
                  >
                    <td className="py-3.5 px-4 font-medium text-text-primary flex items-center gap-2">
                      {isBest && <Trophy className="w-3.5 h-3.5 text-neon-amber" />}
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-semibold",
                          s.winRate >= 72
                            ? "bg-neon-green/10 text-neon-green"
                            : s.winRate >= 68
                            ? "bg-neon-blue/10 text-neon-blue"
                            : "bg-neon-amber/10 text-neon-amber"
                        )}
                      >
                        {s.winRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-neon-green">
                      {formatCurrency(s.totalReturn)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary">{s.trades}</td>
                    <td className="py-3.5 px-4 font-mono text-text-primary">
                      {formatCurrency(s.avgPnl)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={cn(
                          s.profitFactor >= 2.0 ? "text-neon-green" : "text-neon-amber"
                        )}
                      >
                        {s.profitFactor.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
