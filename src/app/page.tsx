"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Activity,
  TrendingUp,
  Wallet,
  Target,
  LineChart,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlowingPulse } from "@/components/ui/GlowingPulse";
import {
  dashboardStats,
  heatmapData,
  institutionalFlowData,
  signals,
  tradeEntries,
  marketSentiment,
} from "@/lib/dummy-data";
import { cn, formatCurrency, formatPercent, getPnlColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

import { useMarketData } from "@/components/providers/MarketDataContext";
import { useDemo } from "@/components/providers/DemoContext";
import { getTrades } from "@/lib/trade-store";
import { useAuth } from "@/components/providers/AuthContext";

const LOG_TEMPLATES = [
  { strategy: "EMA 9/15 Scalper", broker: "Dhan", msg: "Trailing stop-loss adjusted to profit protect (+₹1,240)." },
  { strategy: "Smart Money Concept", broker: "Zerodha", msg: "Order filled: BUY BANKNIFTY 50100 CE at ₹280.50." },
  { strategy: "ICT Silver Bullet", broker: "Upstox", msg: "Scanning FVG mitigation zones on Nifty spot..." },
  { strategy: "Option Scalper", broker: "Shoonya", msg: "Closed: SENSEX 74200 CE scalp exited at ₹310.50." },
  { strategy: "CPR Pivot Bounce", broker: "Angel One", msg: "Tapped daily pivot support. Placing BUY order limits..." },
  { strategy: "HNI Multi-Asset Basket", broker: "Zerodha", msg: "Split block routing triggered: 40% Dhan, 30% Kite, 30% Fyers." },
  { strategy: "Delta Hedging Options", broker: "Groww", msg: "Delta neutrality verified. Rebalancing options spread legs..." },
  { strategy: "Volume Expansion", broker: "Fyers", msg: "Spike detected in RELIANCE volume feed. Relaying BUY hooks..." },
  { strategy: "VWAP Reversal", broker: "Dhan", msg: "Closed position INFY 1460 CE: profit target achieved (+₹29,800)." },
  { strategy: "System Router", broker: "Clearing Node", msg: "Pinging VPS gateway. Latency optimized at 3.4ms." },
];

export default function DashboardPage() {
  const { portfolioPnL, portfolioPnLPercent, session, sessionName, tickers } = useMarketData();
  const { capital, activeStrategiesCount } = useDemo();
  const { user, firebaseReady } = useAuth();
  const userId = firebaseReady && user ? user.uid : "demo-user";
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrades() {
      const data = await getTrades(userId);
      setTrades(data);
    }
    loadTrades();

    // Refresh on local changes
    const handleStorage = () => {
      loadTrades();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);

  // Calculate stats from trades
  const totalTrades = trades.length;
  const wins = trades.filter((t) => (t.netPnl ?? (t.pnl - (t.fees || 0))) >= 0).length;
  const calculatedWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  // Live ticking console logs
  const [liveLogs, setLiveLogs] = useState<{ id: string; time: string; strategy: string; broker: string; msg: string }[]>([
    { id: "log-1", time: "09:15:02", strategy: "System Router", broker: "Clearing Node", msg: "VPS link established via Mumbai central router." },
    { id: "log-2", time: "09:15:24", strategy: "EMA 9/15 Scalper", broker: "Dhan", msg: "Position filled: BUY NIFTY 23400 CE at ₹145.50." },
    { id: "log-3", time: "09:16:10", strategy: "Smart Money Concept", broker: "Zerodha", msg: "Liquidity pool swept on BankNifty. Trailing stop active." }
  ]);

  // Handle live ticking log updater
  useEffect(() => {
    const interval = setInterval(() => {
      const randomTemplate = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0];

      const newLog = {
        id: `log-${Date.now()}`,
        time: timeString,
        ...randomTemplate
      };

      setLiveLogs((prev) => [newLog, ...prev].slice(0, 10)); // Keep last 10 logs
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const topStats: {
    label: string;
    value: number;
    isCustom?: boolean;
    customNode?: React.ReactNode;
    prefix?: string;
    suffix?: string;
    isPnl?: boolean;
    formatter?: (val: number) => string;
    icon: any;
    color: string;
  }[] = [
    {
      label: "AI Engine Status",
      value: 0,
      isCustom: true,
      customNode: (
        <div className="flex items-center gap-2 mt-2">
          <GlowingPulse color="green" size="md" />
          <span className="text-xl font-bold text-neon-green">Active</span>
        </div>
      ),
      icon: Activity,
      color: "border-neon-green/20",
    },
    {
      label: "Market Status",
      value: 0,
      isCustom: true,
      customNode: (
        <div className="flex items-center gap-2 mt-2">
          <GlowingPulse color={session === "LIVE" ? "green" : "blue"} size="md" />
          <span className={`text-xl font-bold ${session === "LIVE" ? "text-neon-green" : "text-neon-blue"}`}>
            {session === "LIVE" ? "NSE LIVE" : "GIFT NIFTY"}
          </span>
        </div>
      ),
      icon: LineChart,
      color: session === "LIVE" ? "border-neon-green/20" : "border-neon-blue/20",
    },
    {
      label: "Capital Allocated",
      value: capital,
      prefix: "₹",
      formatter: (val: number) => formatCurrency(val),
      icon: Wallet,
      color: "border-neon-blue/20",
    },
    {
      label: "Today's PnL",
      value: portfolioPnL,
      suffix: ` (${formatPercent(portfolioPnLPercent)})`,
      isPnl: true,
      formatter: (val: number) => formatCurrency(val),
      icon: TrendingUp,
      color: portfolioPnL >= 0 ? "border-neon-green/20" : "border-neon-red/20",
    },
    {
      label: "Total Trades",
      value: totalTrades,
      icon: Target,
      color: "border-neon-purple/20",
    },
    {
      label: "Win Rate",
      value: Number(calculatedWinRate.toFixed(1)),
      suffix: "%",
      icon: Percent,
      color: "border-neon-blue/20",
    },
  ];

  // Sentiment calculations for semicircular gauge
  const sentimentOffset = tickers["NIFTY 50"] ? tickers["NIFTY 50"].changePercent * 10 : 0;
  const sentimentValue = Math.min(100, Math.max(-100, Math.round(marketSentiment.overall + sentimentOffset)));
  // Maps sentiment from -100 (extreme fear) to +100 (extreme greed) into a percentage (0 to 100)
  const sentimentPercentage = ((sentimentValue + 100) / 200) * 100;
  // Semicircular gauge calculations (stroke-dasharray/offset)
  const radius = 80;
  const circumference = Math.PI * radius; // Half-circle circumference
  const strokeDashoffset = circumference - (sentimentPercentage / 100) * circumference;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" subtitle={sessionName} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Top Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <GlassCard
                key={idx}
                className={`stat-card-glow border ${stat.color} relative overflow-hidden flex flex-col justify-between h-32`}
                hover
              >
                <div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                    <Icon size={16} className="text-text-muted" />
                  </div>
                  {stat.isCustom ? (
                    stat.customNode
                  ) : (
                    <div className="mt-2 text-2xl font-bold text-text-primary tracking-tight">
                      {stat.isPnl ? (
                        <span className={getPnlColor(stat.value)}>
                          {stat.value >= 0 ? "+" : ""}
                          <AnimatedCounter
                            value={stat.value}
                            formatter={stat.formatter}
                          />
                        </span>
                      ) : (
                        <AnimatedCounter
                          value={stat.value}
                          formatter={stat.formatter}
                        />
                      )}
                      {stat.suffix && (
                        <span className={`text-sm ml-1 font-medium ${stat.isPnl ? getPnlColor(stat.value) : "text-text-secondary"}`}>
                          {stat.suffix}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Subtle bottom indicator line */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </GlassCard>
            );
          })}
        </motion.div>

        {/* Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sentiment Gauge & Info */}
          <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="blue">
              <div>
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-2">Live Market Sentiment</h2>
                <p className="text-xs text-text-secondary">Composite AI-calculated real-time sentiment index</p>
              </div>

              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
                  <svg width="180" height="90" className="absolute top-0">
                    <defs>
                      <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff3366" />
                        <stop offset="50%" stopColor="#ffaa00" />
                        <stop offset="100%" stopColor="#00ff88" />
                      </linearGradient>
                    </defs>
                    {/* Background Arc */}
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeLinecap="round"
                    />
                    {/* Foreground Arc */}
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="none"
                      stroke="url(#sentimentGradient)"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="flex flex-col items-center mb-1">
                    <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                      {sentimentValue > 0 ? "+" : ""}
                      {sentimentValue}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neon-green mt-0.5">
                      {marketSentiment.label}
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-text-secondary mt-4 px-4">
                  <span className="text-neon-red font-medium">Bearish {marketSentiment.bearishProbability}%</span>
                  <span className="text-neon-green font-medium">Bullish {marketSentiment.bullishProbability}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-glass-border/50 text-center text-xs text-text-muted">
                Market Index: <span className="text-text-secondary font-mono">Greed Zone (NSE)</span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Institutional Flows (FII/DII) */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Institutional Flow</h2>
                  <p className="text-xs text-text-secondary">Weekly FII & DII net flows in Cr (INR)</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-neon-blue" />
                    <span className="text-text-secondary">FII Net</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-neon-purple" />
                    <span className="text-text-secondary">DII Net</span>
                  </div>
                </div>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={institutionalFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0a0a12",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        color: "#e2e8f0",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(value: any) => [`₹${value} Cr`, ""]}
                    />
                    <Bar dataKey="fiiNet" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="diiNet" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Heatmap Grid */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Market Heatmap</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {heatmapData.map((stock, idx) => {
                const tick = tickers[stock.symbol];
                const change = tick ? tick.changePercent : stock.change;
                const isPositive = change >= 0;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300",
                      isPositive
                        ? "bg-neon-green/5 border-neon-green/20 hover:border-neon-green/45 hover:shadow-[0_0_15px_rgba(0,255,136,0.06)]"
                        : "bg-neon-red/5 border-neon-red/20 hover:border-neon-red/45 hover:shadow-[0_0_15px_rgba(255,51,102,0.06)]"
                    )}
                  >
                    <span className="text-xs text-text-secondary font-mono">{stock.sector}</span>
                    <div className="flex flex-col mt-1">
                      <span className="text-sm font-bold text-text-primary">{stock.symbol}</span>
                      <span className="text-[10px] font-mono text-text-muted mt-0.5">
                        ₹{tick ? tick.price.toLocaleString("en-IN") : stock.symbol === "RELIANCE" ? "2,942.35" : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {isPositive ? (
                        <ArrowUpRight size={14} className="text-neon-green" />
                      ) : (
                        <ArrowDownRight size={14} className="text-neon-red" />
                      )}
                      <span className={cn("text-xs font-bold font-mono", isPositive ? "text-neon-green" : "text-neon-red")}>
                        {formatPercent(change)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Bottom Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Signals */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Recent Signals</h2>
                <a href="/ai-signals" className="text-xs font-medium text-neon-blue hover:underline">
                  View Engine
                </a>
              </div>

              <div className="space-y-3">
                {signals.slice(0, 3).map((sig, idx) => {
                  const tick = tickers[sig.symbol];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{sig.symbol}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-text-muted">{sig.timeframe} • Conf {sig.confidenceScore}%</span>
                          {tick && (
                            <>
                              <span className="text-text-muted text-[10px]">•</span>
                              <span className={cn("text-[10px] font-mono font-bold", tick.changePercent >= 0 ? "text-neon-green" : "text-neon-red")}>
                                ₹{tick.price}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge variant={sig.direction === "BUY" ? "buy" : "sell"}>
                          {sig.direction}
                        </StatusBadge>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-text-primary block">Entry</span>
                          <span className="text-xs font-bold font-mono text-neon-blue">₹{sig.entry}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>

          {/* Recent Trades Table */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Recent Activity</h2>
                <a href="/trade-journal" className="text-xs font-medium text-neon-blue hover:underline">
                  View Journal
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      <th className="py-2 pb-3">Symbol</th>
                      <th className="py-2 pb-3">Direction</th>
                      <th className="py-2 pb-3">Entry</th>
                      <th className="py-2 pb-3">Exit</th>
                      <th className="py-2 pb-3 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/30 text-xs">
                    {tradeEntries.slice(0, 5).map((entry, idx) => {
                      const isProfit = entry.pnl >= 0;
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-semibold text-text-primary">{entry.symbol}</td>
                          <td className="py-3">
                            <StatusBadge variant={entry.direction === "BUY" ? "buy" : "sell"}>
                              {entry.direction}
                            </StatusBadge>
                          </td>
                          <td className="py-3 font-mono text-text-secondary">₹{entry.entryPrice}</td>
                          <td className="py-3 font-mono text-text-secondary">
                            {entry.exitPrice ? `₹${entry.exitPrice}` : "—"}
                          </td>
                          <td className={`py-3 text-right font-bold font-mono ${getPnlColor(entry.pnl)}`}>
                            {isProfit ? "+" : ""}
                            {formatCurrency(entry.pnl)}
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

        {/* Live Terminal Router Console */}
        <motion.div variants={itemVariants} className="w-full">
          <GlassCard className="border border-neon-blue/20 bg-black/85 p-5 flex flex-col gap-4" glow="blue">
            <div className="flex items-center justify-between border-b border-glass-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono">
                  Live Algorithmic Execution Router Feed (VPS-Mumbai-1)
                </h2>
              </div>
              <span className="text-[9px] font-mono text-text-muted">
                Gateway Nodes: Dhan 🟢, Zerodha 🟢, Upstox 🟢, Fyers 🟢
              </span>
            </div>

            {/* Console Log Feed */}
            <div className="font-mono text-[9px] space-y-2.5 h-36 overflow-y-auto leading-relaxed scrollbar-thin text-left">
              {liveLogs.map((log) => (
                <div key={log.id} className="flex gap-2.5 items-start">
                  <span className="text-text-muted shrink-0">[{log.time}]</span>
                  <span className="text-neon-blue font-bold shrink-0">{`[${log.strategy}]`}</span>
                  <span className="text-neon-purple font-semibold shrink-0">{`[${log.broker}]`}</span>
                  <span className="text-text-secondary">{log.msg}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
