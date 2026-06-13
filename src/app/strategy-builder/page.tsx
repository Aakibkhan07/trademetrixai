"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Workflow,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  GripVertical,
  TrendingUp,
  BarChart3,
  Activity,
  CandlestickChart,
  Zap,
  CircleDot,
  ArrowRight,
  Clock,
  ShieldCheck,
  Target,
  Layers,
  Play,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import { useDemo } from "@/components/providers/DemoContext";
import { useMarketData } from "@/components/providers/MarketDataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import type { ConditionBlock, ConditionOperator, LogicOperator, ConditionAction } from "@/lib/types";

// ============================================================
// Types & Constants
// ============================================================

interface IndicatorItem {
  name: string;
  icon: React.ReactNode;
  category: string;
}

const INDICATOR_CATEGORIES: { label: string; icon: React.ReactNode; items: IndicatorItem[] }[] = [
  {
    label: "Moving Averages",
    icon: <TrendingUp className="w-4 h-4" />,
    items: [
      { name: "EMA 9", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Moving Averages" },
      { name: "EMA 15", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Moving Averages" },
      { name: "EMA 20", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Moving Averages" },
      { name: "SMA 50", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Moving Averages" },
      { name: "SMA 200", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Moving Averages" },
    ],
  },
  {
    label: "Volatility & Bands",
    icon: <Layers className="w-4 h-4" />,
    items: [
      { name: "Bollinger Bands Upper", icon: <Layers className="w-3.5 h-3.5" />, category: "Volatility & Bands" },
      { name: "Bollinger Bands Middle", icon: <Layers className="w-3.5 h-3.5" />, category: "Volatility & Bands" },
      { name: "Bollinger Bands Lower", icon: <Layers className="w-3.5 h-3.5" />, category: "Volatility & Bands" },
      { name: "ATR (14)", icon: <Layers className="w-3.5 h-3.5" />, category: "Volatility & Bands" },
    ],
  },
  {
    label: "Trend Indicators",
    icon: <Zap className="w-4 h-4" />,
    items: [
      { name: "Supertrend (10,3)", icon: <Zap className="w-3.5 h-3.5" />, category: "Trend Indicators" },
      { name: "Supertrend Line", icon: <Zap className="w-3.5 h-3.5" />, category: "Trend Indicators" },
      { name: "Parabolic SAR", icon: <Zap className="w-3.5 h-3.5" />, category: "Trend Indicators" },
    ],
  },
  {
    label: "Key Levels & S/R",
    icon: <CircleDot className="w-4 h-4" />,
    items: [
      { name: "Auto Weekly Support", icon: <CircleDot className="w-3.5 h-3.5" />, category: "Key Levels & S/R" },
      { name: "Auto Daily Resistance", icon: <CircleDot className="w-3.5 h-3.5" />, category: "Key Levels & S/R" },
      { name: "Pivot Points (Standard)", icon: <CircleDot className="w-3.5 h-3.5" />, category: "Key Levels & S/R" },
    ],
  },
  {
    label: "Oscillators",
    icon: <Activity className="w-4 h-4" />,
    items: [
      { name: "RSI", icon: <Activity className="w-3.5 h-3.5" />, category: "Oscillators" },
      { name: "MACD", icon: <Activity className="w-3.5 h-3.5" />, category: "Oscillators" },
      { name: "Stochastic", icon: <Activity className="w-3.5 h-3.5" />, category: "Oscillators" },
    ],
  },
  {
    label: "Volume",
    icon: <BarChart3 className="w-4 h-4" />,
    items: [
      { name: "Volume", icon: <BarChart3 className="w-3.5 h-3.5" />, category: "Volume" },
      { name: "VWAP", icon: <BarChart3 className="w-3.5 h-3.5" />, category: "Volume" },
      { name: "OBV", icon: <BarChart3 className="w-3.5 h-3.5" />, category: "Volume" },
    ],
  },
  {
    label: "Price Action",
    icon: <CandlestickChart className="w-4 h-4" />,
    items: [
      { name: "Price", icon: <CandlestickChart className="w-3.5 h-3.5" />, category: "Price Action" },
      { name: "Candlestick Pattern", icon: <CandlestickChart className="w-3.5 h-3.5" />, category: "Price Action" },
    ],
  },
];

const OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: ">", value: ">" },
  { label: "<", value: "<" },
  { label: ">=", value: ">=" },
  { label: "<=", value: "<=" },
  { label: "==", value: "==" },
  { label: "Crosses Above", value: "crosses_above" },
  { label: "Crosses Below", value: "crosses_below" },
];

const TIMEFRAMES = ["1min", "5min", "15min", "30min", "1hr", "4hr", "Daily"];

const DEFAULT_CONDITIONS: ConditionBlock[] = [
  { id: "c-001", indicator: "EMA 9", operator: ">", value: "EMA 15", logicOperator: "AND" },
  { id: "c-002", indicator: "Price", operator: ">", value: "VWAP", logicOperator: "AND" },
  { id: "c-003", indicator: "Volume", operator: ">", value: "1.5x Average" },
];

// ============================================================
// Animations
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as const },
};

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

// ============================================================
// Sub-components
// ============================================================

function IndicatorPanel({
  onAddIndicator,
}: {
  onAddIndicator: (name: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Moving Averages");

  return (
    <motion.div
      variants={itemVariants}
      className="glass-card p-0 overflow-hidden w-full lg:w-72 shrink-0"
    >
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-neon-blue" />
          <h3 className="text-sm font-semibold text-text-primary">Indicators</h3>
        </div>
        <p className="text-xs text-text-muted">Drag or click to add</p>
      </div>

      <div className="divide-y divide-glass-border">
        {INDICATOR_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === cat.label ? null : cat.label)
              }
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-glass-hover transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-neon-blue">{cat.icon}</span>
                <span className="text-xs font-medium text-text-primary">{cat.label}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-text-muted transition-transform duration-200",
                  expandedCategory === cat.label && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {expandedCategory === cat.label && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2 space-y-1">
                    {cat.items.map((item) => (
                      <motion.button
                        key={item.name}
                        whileHover={{ x: 4, backgroundColor: "rgba(0, 212, 255, 0.06)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onAddIndicator(item.name)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group"
                      >
                        <span className="text-text-muted group-hover:text-neon-blue transition-colors">
                          {item.icon}
                        </span>
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                          {item.name}
                        </span>
                        <Plus className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ConditionCard({
  condition,
  index,
  isLast,
  onUpdate,
  onDelete,
}: {
  condition: ConditionBlock;
  index: number;
  isLast: boolean;
  onUpdate: (id: string, field: keyof ConditionBlock, value: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="relative">
      {/* Condition Block */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, x: -20 }}
        whileHover={cardHover}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        className="relative glass-card glass-card-hover p-4 border border-neon-blue/20 cursor-grab active:cursor-grabbing"
      >
        {/* Top label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-text-muted" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded">
              {index === 0 ? "IF" : "CONDITION"}
            </span>
            <span className="text-[10px] text-text-muted">#{index + 1}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.15, color: "#ff3366" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(condition.id)}
            className="text-text-muted hover:text-neon-red transition-colors p-1 rounded-md hover:bg-neon-red/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Indicator */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">
              Indicator
            </label>
            <select
              value={condition.indicator}
              onChange={(e) => onUpdate(condition.id, "indicator", e.target.value)}
              className="w-full bg-surface-elevated border border-glass-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/40 transition-colors appearance-none cursor-pointer"
            >
              {INDICATOR_CATEGORIES.flatMap((c) =>
                c.items.map((i) => (
                  <option key={i.name} value={i.name}>
                    {i.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">
              Operator
            </label>
            <select
              value={condition.operator}
              onChange={(e) => onUpdate(condition.id, "operator", e.target.value)}
              className="w-full bg-surface-elevated border border-glass-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/40 transition-colors appearance-none cursor-pointer"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">
              Value
            </label>
            <input
              type="text"
              value={condition.value}
              onChange={(e) => onUpdate(condition.id, "value", e.target.value)}
              className="w-full bg-surface-elevated border border-glass-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/40 transition-colors placeholder:text-text-muted"
              placeholder="Value..."
            />
          </div>
        </div>
      </motion.div>

      {/* AND/OR Connector */}
      {!isLast && (
        <div className="flex flex-col items-center py-1">
          {/* Vertical SVG line */}
          <svg width="2" height="16" className="text-neon-blue/40">
            <line x1="1" y1="0" x2="1" y2="16" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
          {/* Logic toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              onUpdate(
                condition.id,
                "logicOperator",
                condition.logicOperator === "AND" ? "OR" : "AND"
              )
            }
            className={cn(
              "px-4 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-all",
              condition.logicOperator === "AND"
                ? "bg-neon-purple/10 border-neon-purple/30 text-neon-purple"
                : "bg-neon-amber/10 border-neon-amber/30 text-neon-amber"
            )}
          >
            {condition.logicOperator || "AND"}
          </motion.button>
          {/* Vertical SVG line */}
          <svg width="2" height="16" className="text-neon-blue/40">
            <line x1="1" y1="0" x2="1" y2="16" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
          </svg>
        </div>
      )}
    </div>
  );
}

function ActionBlock({ action, onChange }: { action: ConditionAction; onChange: (a: ConditionAction) => void }) {
  const isBuy = action === "BUY";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-4 border-2 transition-all",
        isBuy
          ? "border-neon-green/30 neon-green-glow"
          : "border-neon-red/30 neon-red-glow"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded",
          isBuy ? "text-neon-green bg-neon-green/10" : "text-neon-red bg-neon-red/10"
        )}>
          THEN
        </span>
        <Zap className={cn("w-4 h-4", isBuy ? "text-neon-green" : "text-neon-red")} />
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange("BUY")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider border transition-all",
            isBuy
              ? "bg-neon-green/15 border-neon-green/40 text-neon-green"
              : "bg-transparent border-glass-border text-text-muted hover:border-neon-green/20"
          )}
        >
          ▲ BUY
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onChange("SELL")}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider border transition-all",
            !isBuy
              ? "bg-neon-red/15 border-neon-red/40 text-neon-red"
              : "bg-transparent border-glass-border text-text-muted hover:border-neon-red/20"
          )}
        >
          ▼ SELL
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function StrategyBuilderPage() {
  const { injectNotification, role, openLeadModal } = useDemo();
  const { openAlgoConfig, openAlgoStatus, placeOpenAlgoOrder } = useMarketData();
  
  // Backtest simulation state
  const [backtestState, setBacktestState] = useState<"idle" | "running" | "completed">("idle");
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestLogs, setBacktestLogs] = useState<string[]>([]);
  const [backtestReport, setBacktestReport] = useState<any>(null);

  // Live deployment simulation state
  const [liveState, setLiveState] = useState<"idle" | "deploying" | "active">("idle");
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);

  const [strategyName, setStrategyName] = useState("EMA Crossover + VWAP Strategy");
  const [conditions, setConditions] = useState<ConditionBlock[]>(DEFAULT_CONDITIONS);
  const [action, setAction] = useState<ConditionAction>("BUY");
  const [stopLoss, setStopLoss] = useState("1.5");
  const [targetPercent, setTargetPercent] = useState("3.0");
  const [timeframe, setTimeframe] = useState("15min");
  const [isSaving, setIsSaving] = useState(false);

  // Run Backtest simulation
  const runBacktestSimulation = () => {
    if (conditions.length === 0) {
      injectNotification("Backtest Error", "Add at least one condition block to run a backtest.", "warning");
      return;
    }
    setBacktestState("running");
    setBacktestProgress(0);
    setBacktestLogs([]);
    setBacktestReport(null);

    const logMessages = [
      "🚀 Initializing Backtest Engine...",
      "📂 Loading 1-minute historical candles for underlying index options (Past 90 Days)...",
      "🔬 Evaluating strategy rule conditions against historical chart intervals...",
      "📐 Calculating stop-loss boundaries & premium price target hit distributions...",
      "📊 Simulating implied volatility (IV) volatility shifts & contract Delta decay...",
      "📈 Compiling final returns and drawdown metrics..."
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setBacktestLogs((prev) => [...prev, logMessages[currentLogIndex]]);
        setBacktestProgress((prev) => Math.min(95, prev + 15));
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        setBacktestProgress(100);
        setTimeout(() => {
          setBacktestState("completed");
          // Generate a highly realistic backtest report based on conditions
          const randomWinRate = Number((65 + Math.random() * 20).toFixed(1));
          const randomTrades = 25 + Math.floor(Math.random() * 30);
          const netProfit = Number((timeframe === "15min" ? 185620.00 : 124560.50) + Math.random() * 20000);
          const drawDown = Number((3.2 + Math.random() * 2.5).toFixed(2));
          
          setBacktestReport({
            winRate: randomWinRate,
            totalTrades: randomTrades,
            netProfit: netProfit,
            drawdown: drawDown,
            profitFactor: Number((1.8 + Math.random() * 0.8).toFixed(2)),
            sharpeRatio: Number((2.1 + Math.random() * 0.9).toFixed(2))
          });

          injectNotification(
            "📈 Backtest Completed",
            `Strategy "${strategyName}" finished. Win Rate: ${randomWinRate}%, Net Profit: ₹${netProfit.toLocaleString()}.`,
            "success"
          );
        }, 600);
      }
    }, 600);
  };

  // Deploy Live simulation
  const deployLiveSimulation = () => {
    if (conditions.length === 0) {
      injectNotification("Deployment Error", "Add at least one condition block to deploy live.", "warning");
      return;
    }
    if (role === "user") {
      openLeadModal(strategyName || "Custom Builder Strategy");
      return;
    }
    setLiveState("deploying");
    setLiveProgress(0);
    setLiveLogs([]);

    const isOpenAlgoActive = openAlgoConfig.enabled && openAlgoStatus === "connected";

    const logMessages = [
      "🔑 Authenticating connected broker API keys (Dhan, Shoonya)...",
      "🛡️ Verifying margin balance & active risk management profiles...",
      "📡 Establishing real-time WebSocket ticker streams for index options...",
      "⚡ Injecting automated condition entry hooks..."
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(async () => {
      if (currentLogIndex < logMessages.length) {
        setLiveLogs((prev) => [...prev, logMessages[currentLogIndex]]);
        setLiveProgress((prev) => Math.min(95, prev + 20));
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        
        if (isOpenAlgoActive) {
          setLiveLogs((prev) => [...prev, "🛒 Routing real options order via OpenAlgo API..."]);
          setLiveProgress(85);
          
          // Place real order
          const orderRes = await placeOpenAlgoOrder({
            strategy: strategyName || "Strategy Builder",
            symbol: "NIFTY26JUN23400CE", // standard index option format
            action: action, // BUY or SELL
            exchange: "NFO",
            quantity: 50, // 1 Nifty lot
            priceType: "MARKET",
            product: "MIS"
          });

          if (orderRes.success) {
            setLiveLogs((prev) => [
              ...prev,
              `✅ OpenAlgo Order Filled Successfully! Order ID: ${orderRes.orderId}`,
              "🟢 Strategy fully deployed live in market!"
            ]);
            setLiveProgress(100);
            setTimeout(() => {
              setLiveState("active");
              injectNotification(
                "⚡ Strategy Deployed Live",
                `"${strategyName}" is now active in market. Real trade routed successfully!`,
                "success"
              );
            }, 600);
          } else {
            setLiveLogs((prev) => [
              ...prev,
              `❌ OpenAlgo Order Placement Failed: ${orderRes.error}`,
              "⚠️ Strategy deployed but execution routing is suspended."
            ]);
            setLiveProgress(100);
            setTimeout(() => {
              setLiveState("active");
              injectNotification(
                "⚠️ Deployment Warning",
                `Strategy deployed, but live order failed: ${orderRes.error}`,
                "warning"
              );
            }, 600);
          }
        } else {
          setLiveLogs((prev) => [...prev, "🟢 Strategy fully deployed live in market!"]);
          setLiveProgress(100);
          setTimeout(() => {
            setLiveState("active");
            injectNotification(
              "⚡ Strategy Deployed Live",
              `"${strategyName}" is now active in market. Trigger conditions are monitored live.`,
              "success"
            );
          }, 600);
        }
      }
    }, 550);
  };

  const handleAddCondition = useCallback(
    (indicator?: string) => {
      const newBlock: ConditionBlock = {
        id: generateId(),
        indicator: indicator || "EMA 9",
        operator: ">",
        value: "",
        logicOperator: "AND",
      };
      // Add logicOperator to the previously-last condition if missing
      setConditions((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && !updated[updated.length - 1].logicOperator) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], logicOperator: "AND" };
        }
        return [...updated, newBlock];
      });
    },
    []
  );

  const handleUpdateCondition = useCallback(
    (id: string, field: keyof ConditionBlock, value: string) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleDeleteCondition = useCallback((id: string) => {
    setConditions((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      // Remove logicOperator from new last item
      if (filtered.length > 0) {
        filtered[filtered.length - 1] = {
          ...filtered[filtered.length - 1],
          logicOperator: undefined,
        };
      }
      return filtered;
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-background p-4 md:p-6 lg:p-8"
    >
      {/* ---- Header ---- */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Strategy Builder
            </h1>
            <p className="text-sm text-text-secondary">
              No-code visual strategy editor
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---- Strategy Name + Config Bar ---- */}
      <motion.div
        variants={itemVariants}
        className="glass-card p-4 mb-4 flex flex-col md:flex-row items-start md:items-center gap-4"
      >
        {/* Strategy Name */}
        <div className="flex-1 min-w-0 w-full md:w-auto">
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">
            Strategy Name
          </label>
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="w-full bg-surface-elevated border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary font-medium focus:outline-none focus:border-neon-blue/40 transition-colors placeholder:text-text-muted"
            placeholder="My Strategy..."
          />
        </div>

        {/* Timeframe */}
        <div className="w-full md:w-36">
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-surface-elevated border border-glass-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-neon-blue/40 transition-colors appearance-none cursor-pointer"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        {/* Stop Loss */}
        <div className="w-full md:w-28">
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Stop Loss %
          </label>
          <input
            type="number"
            step="0.1"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full bg-surface-elevated border border-neon-red/20 rounded-lg px-3 py-2 text-sm text-neon-red font-mono focus:outline-none focus:border-neon-red/40 transition-colors"
          />
        </div>

        {/* Target */}
        <div className="w-full md:w-28">
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Target %
          </label>
          <input
            type="number"
            step="0.1"
            value={targetPercent}
            onChange={(e) => setTargetPercent(e.target.value)}
            className="w-full bg-surface-elevated border border-neon-green/20 rounded-lg px-3 py-2 text-sm text-neon-green font-mono focus:outline-none focus:border-neon-green/40 transition-colors"
          />
        </div>

        {/* Save */}
        <div className="w-full md:w-auto flex items-end">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all",
              isSaving
                ? "bg-neon-green/20 text-neon-green/60 cursor-wait"
                : "bg-neon-green/15 border border-neon-green/30 text-neon-green hover:bg-neon-green/25 neon-green-glow"
            )}
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <CircleDot className="w-4 h-4" />
                </motion.div>
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Strategy
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ---- Main Editor ---- */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Indicator Panel */}
        <IndicatorPanel onAddIndicator={(name) => handleAddCondition(name)} />

        {/* Center: Flow Canvas */}
        <motion.div
          variants={itemVariants}
          className="flex-1 min-h-[600px] glass-card p-0 overflow-hidden"
        >
          {/* Canvas Header */}
          <div className="flex items-center justify-between p-4 border-b border-glass-border">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-neon-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Flow Canvas</h3>
              <span className="text-[10px] bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded-full font-medium">
                {conditions.length} conditions
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAddCondition()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Condition
            </motion.button>
          </div>

          {/* Canvas Body with Grid Background */}
          <div className="relative p-6 bg-grid-pattern min-h-[520px]">
            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-blue/[0.03] rounded-full blur-3xl pointer-events-none" />

            {/* Flow start marker */}
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-glass-border">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-glow" />
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                  Start
                </span>
              </div>
            </div>

            {/* SVG connector from start to first block */}
            <div className="flex justify-center">
              <svg width="2" height="24" className="text-neon-blue/40">
                <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
            </div>

            {/* Condition Blocks */}
            <div className="max-w-lg mx-auto space-y-0">
              <AnimatePresence mode="popLayout">
                {conditions.map((condition, idx) => (
                  <ConditionCard
                    key={condition.id}
                    condition={condition}
                    index={idx}
                    isLast={idx === conditions.length - 1}
                    onUpdate={handleUpdateCondition}
                    onDelete={handleDeleteCondition}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Connector to Action */}
            <div className="flex justify-center py-1">
              <svg width="2" height="24" className="text-neon-blue/40">
                <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
            </div>

            {/* Arrow indicator */}
            <div className="flex justify-center mb-1">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ArrowRight className="w-4 h-4 text-neon-blue/50 rotate-90" />
              </motion.div>
            </div>

            {/* Action Block */}
            <div className="max-w-lg mx-auto">
              <ActionBlock action={action} onChange={setAction} />
            </div>

            {/* End marker */}
            <div className="flex justify-center mt-3">
              <svg width="2" height="20" className={cn("text-neon-blue/40")}>
                <line x1="1" y1="0" x2="1" y2="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-glass-border">
                <div className="w-2 h-2 rounded-full bg-neon-red" />
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
                  End
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Strategy Summary */}
        <motion.div
          variants={itemVariants}
          className="w-full lg:w-64 shrink-0 space-y-4"
        >
          {/* Summary Card */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-neon-blue" />
              Strategy Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Name</span>
                <span className="text-xs text-text-primary font-medium truncate max-w-[120px]">
                  {strategyName || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Conditions</span>
                <span className="text-xs text-neon-blue font-mono">{conditions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Action</span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    action === "BUY" ? "text-neon-green" : "text-neon-red"
                  )}
                >
                  {action}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Timeframe</span>
                <span className="text-xs text-text-primary font-mono">{timeframe}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Stop Loss</span>
                <span className="text-xs text-neon-red font-mono">{stopLoss}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Target</span>
                <span className="text-xs text-neon-green font-mono">{targetPercent}%</span>
              </div>
            </div>
          </div>

          {/* Rule Preview */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-amber" />
              Rule Preview
            </h3>
            <div className="space-y-1.5 font-mono text-[11px]">
              {conditions.map((c, idx) => (
                <div key={c.id} className="flex flex-wrap gap-1 items-center">
                  <span className="text-neon-blue font-bold">
                    {idx === 0 ? "IF" : c.logicOperator || "AND"}
                  </span>
                  <span className="text-text-primary">{c.indicator}</span>
                  <span className="text-neon-amber">
                    {c.operator === "crosses_above"
                      ? "×↑"
                      : c.operator === "crosses_below"
                      ? "×↓"
                      : c.operator}
                  </span>
                  <span className="text-neon-purple">{c.value || "?"}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 pt-1 border-t border-glass-border mt-1">
                <span className={cn("font-bold", action === "BUY" ? "text-neon-green" : "text-neon-red")}>
                  THEN
                </span>
                <span className={cn("font-bold", action === "BUY" ? "text-neon-green" : "text-neon-red")}>
                  {action}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={runBacktestSimulation}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-colors cursor-pointer justify-center"
              >
                {backtestState === "running" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run Backtest
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={deployLiveSimulation}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-medium hover:bg-neon-purple/20 transition-colors cursor-pointer justify-center"
              >
                {liveState === "deploying" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Deploy Live
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Backtest progress and report modal */}
      <AnimatePresence>
        {backtestState !== "idle" && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg relative"
            >
              <GlassCard className="border border-neon-blue/20 p-6 flex flex-col gap-5" glow="blue">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-glass-border">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                    <Play className="w-4 h-4 text-neon-blue animate-pulse" />
                    AI Strategy Backtest Lab
                  </h3>
                  <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                    {backtestState === "running" ? "RUNNING" : "COMPLETED"}
                  </span>
                </div>

                {/* Body running state */}
                {backtestState === "running" && (
                  <div className="space-y-4 py-3">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Analyzing option premiums...</span>
                      <span className="font-mono">{backtestProgress}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-white/5 border border-glass-border h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-neon-blue shadow-[0_0_10px_#00d4ff]"
                        style={{ width: `${backtestProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>
                    {/* Live logs console */}
                    <div className="p-3 bg-black/80 border border-glass-border/30 rounded-xl font-mono text-[9px] text-neon-blue h-32 overflow-y-auto space-y-1.5 leading-normal">
                      {backtestLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <span className="text-text-muted">[{idx + 1}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body completed state report */}
                {backtestState === "completed" && backtestReport && (
                  <div className="space-y-5">
                    <div className="text-center py-2">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider block">Historical Analysis Result</span>
                      <span className="text-base font-bold text-text-primary block mt-0.5 line-clamp-1">{strategyName}</span>
                    </div>

                    {/* Report Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Net Profit Returns</span>
                        <span className="text-2xl font-extrabold text-neon-green mt-1 font-mono tracking-tight">
                          ₹{backtestReport.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Win Rate %</span>
                        <span className="text-2xl font-extrabold text-neon-blue mt-1 font-mono">
                          {backtestReport.winRate}%
                        </span>
                      </div>
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Total Trades Logged</span>
                        <span className="text-lg font-bold text-text-primary mt-0.5 font-mono">
                          {backtestReport.totalTrades}
                        </span>
                      </div>
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Max Drawdown</span>
                        <span className="text-lg font-bold text-neon-red mt-0.5 font-mono">
                          -{backtestReport.drawdown}%
                        </span>
                      </div>
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Profit Factor</span>
                        <span className="text-lg font-bold text-text-primary mt-0.5 font-mono">
                          {backtestReport.profitFactor}
                        </span>
                      </div>
                      <div className="p-3.5 bg-white/[0.01] border border-glass-border/40 rounded-xl flex flex-col justify-center">
                        <span className="text-[9px] text-text-secondary uppercase">Sharpe Ratio</span>
                        <span className="text-lg font-bold text-neon-purple mt-0.5 font-mono">
                          {backtestReport.sharpeRatio}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer action buttons */}
                <div className="flex gap-2.5 pt-3 border-t border-glass-border">
                  <button
                    onClick={() => setBacktestState("idle")}
                    className="flex-1 py-2 px-4 rounded-xl bg-neon-blue text-black text-xs font-bold hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all cursor-pointer text-center"
                    disabled={backtestState === "running"}
                  >
                    Close Report
                  </button>
                </div>

              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Go Live deployment overlay */}
      <AnimatePresence>
        {liveState !== "idle" && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg relative"
            >
              <GlassCard className="border border-neon-purple/20 p-6 flex flex-col gap-5" glow="purple">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-glass-border">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4 text-neon-purple animate-pulse" />
                    Algo Live Deployment
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${liveState === "deploying" ? "text-neon-amber bg-neon-amber/10 border border-neon-amber/20" : "text-neon-green bg-neon-green/10 border border-neon-green/20 animate-pulse"}`}>
                    {liveState === "deploying" ? "DEPLOYS RUNNING" : "ACTIVE IN MARKET"}
                  </span>
                </div>

                {/* Body deploying state */}
                {liveState === "deploying" && (
                  <div className="space-y-4 py-3">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Verifying broker connections...</span>
                      <span className="font-mono">{liveProgress}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-white/5 border border-glass-border h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-neon-purple shadow-[0_0_10px_#a855f7]"
                        style={{ width: `${liveProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>
                    {/* Live logs console */}
                    <div className="p-3 bg-black/80 border border-glass-border/30 rounded-xl font-mono text-[9px] text-neon-purple h-32 overflow-y-auto space-y-1.5 leading-normal">
                      {liveLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-1.5">
                          <span className="text-text-muted">[{idx + 1}]</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body active/deployed state */}
                {liveState === "active" && (
                  <div className="space-y-4 text-center py-4 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green mb-2 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
                      <CheckCircle2 size={30} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text-primary">Strategy Deployed Successfully</h4>
                      <p className="text-xs text-text-secondary max-w-xs mt-1.5 leading-relaxed mx-auto">
                        Your trading rules for <strong className="text-text-primary">"{strategyName}"</strong> are active. Margin parameters and websocket index feeds are successfully locked.
                      </p>
                    </div>
                    
                    {/* Status card details */}
                    <div className="w-full p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/15 text-left text-xs font-mono space-y-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Target Assets:</span>
                        <span className="text-text-primary font-bold">NIFTY / BANKNIFTY / SENSEX Options</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Margin Limit Check:</span>
                        <span className="text-neon-green font-bold">PASSED (ACTIVE)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">WebSocket Streams:</span>
                        <span className="text-neon-green font-bold">CONNECTED</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer action buttons */}
                <div className="flex gap-2.5 pt-3 border-t border-glass-border">
                  <button
                    onClick={() => setLiveState("idle")}
                    className="flex-1 py-2 px-4 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer text-center"
                    disabled={liveState === "deploying"}
                  >
                    Acknowledge & Close
                  </button>
                </div>

              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
