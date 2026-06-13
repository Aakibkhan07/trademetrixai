"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Play, Square, Settings, Calculator, Activity, ArrowRight, Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDemo } from "@/components/providers/DemoContext";
import { brokerConfigs } from "@/lib/dummy-data";
import { formatCurrency, getPnlColor } from "@/lib/utils";
import { useMarketData } from "@/components/providers/MarketDataContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } as const },
};

export default function AutoTradingPage() {
  const { brokerCapitalAllocations } = useMarketData();
  const { role, injectNotification } = useDemo();
  
  const isAdmin = role === "admin";
  const [isAutoActive, setIsAutoActive] = useState(true);
  const [brokers, setBrokers] = useState(brokerConfigs);
  const [emergencyStopped, setEmergencyStopped] = useState(false);

  // Risk parameters state
  const [riskPerTrade, setRiskPerTrade] = useState(1.5);
  const [maxDailyLoss, setMaxDailyLoss] = useState(25000);
  const [maxOpenPositions, setMaxOpenPositions] = useState(5);

  // Position size calculator state
  const [calcCapital, setCalcCapital] = useState(500000);
  const [calcRiskPercent, setCalcRiskPercent] = useState(1.5);
  const [calcStopLossPoints, setCalcStopLossPoints] = useState(50);
  const [calcResult, setCalcResult] = useState<{ size: number; riskAmount: number } | null>(null);

  const calculatePositionSize = () => {
    const riskAmount = (calcCapital * calcRiskPercent) / 100;
    const size = Math.round(riskAmount / calcStopLossPoints);
    setCalcResult({ size, riskAmount });
  };

  const toggleBrokerConnection = (id: string) => {
    if (!isAdmin) {
      injectNotification(
        "Permission Denied",
        "Admin permissions required to connect/disconnect live brokers.",
        "warning"
      );
      return;
    }
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: b.status === "connected" ? "disconnected" : "connected",
            }
          : b
      )
    );
  };

  const handleEmergencyStop = () => {
    if (!isAdmin) {
      injectNotification(
        "Permission Denied",
        "Admin permissions required to execute emergency stop.",
        "warning"
      );
      return;
    }
    setEmergencyStopped(true);
    setIsAutoActive(false);
    setBrokers((prev) => prev.map((b) => ({ ...b, status: "disconnected" })));
    injectNotification("EMERGENCY STOP TRIGGERED", "All automated routing offline. Broker feeds disconnected.", "warning");
  };

  const handleRiskChange = (val: number, setter: (v: any) => void) => {
    if (!isAdmin) {
      injectNotification("Controls Locked", "Risk modifications require Administrator privileges.", "warning");
      return;
    }
    setter(val);
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Auto Trading" subtitle="Automated strategy execution" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* User/Admin Role warning banner */}
        {!isAdmin && (
          <GlassCard className="border border-neon-purple/20 bg-neon-purple/5 p-4 flex items-center gap-3 text-xs">
            <Lock className="text-neon-purple shrink-0 animate-pulse font-bold" size={16} />
            <span className="text-text-secondary leading-relaxed">
              <strong>Administrative Clearance Required:</strong> Standard clients are set to read-only access. Toggling execution routes, triggering emergency overrides, or modifying institutional risk parameters requires Prop Desk Administrator credentials.
            </span>
          </GlassCard>
        )}

        {/* Master Control and Emergency Stop Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Master Toggle */}
          <GlassCard className="md:col-span-6 border border-glass-border flex flex-col justify-between p-5" glow="none">
            <div>
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                Auto Trading Engine
              </h2>
              <p className="text-[10px] text-text-secondary">
                Turn on the routing engine to auto-execute marketplace strategies directly to connected brokers.
              </p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isAutoActive && !emergencyStopped ? "bg-neon-green animate-pulse" : "bg-text-muted"
                  }`}
                />
                <span className="text-sm font-bold text-text-primary">
                  {emergencyStopped ? "Engine Offline (Emergency Stop)" : isAutoActive ? "Engine Routing Active" : "Engine Suspended"}
                </span>
              </div>

              <div
                onClick={() => {
                  if (!isAdmin) {
                    injectNotification("Permission Denied", "Admin permissions required to toggle algorithms.", "warning");
                    return;
                  }
                  if (!emergencyStopped) setIsAutoActive(!isAutoActive);
                }}
                className={`toggle-switch ${isAutoActive && !emergencyStopped ? "active" : ""} ${
                  emergencyStopped || !isAdmin ? "opacity-40 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </GlassCard>

          {/* Emergency Stop Button */}
          <GlassCard
            className={`md:col-span-6 border border-glass-border flex items-center justify-center p-5 relative overflow-hidden transition-all duration-300 ${
              emergencyStopped ? "bg-neon-red/10 border-neon-red/30 shadow-[0_0_20px_rgba(255,51,102,0.1)]" : ""
            }`}
          >
            <button
              onClick={handleEmergencyStop}
              disabled={emergencyStopped || !isAdmin}
              className={`w-full py-6 rounded-xl font-extrabold text-base tracking-widest flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                emergencyStopped || !isAdmin
                  ? "bg-neon-red/15 text-neon-red border border-neon-red/30 cursor-not-allowed opacity-50"
                  : "bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.1)] active:scale-98 animate-pulse-glow"
              }`}
            >
              <ShieldAlert size={20} />
              EMERGENCY STOP (KILL ALL)
            </button>
          </GlassCard>
        </motion.div>

        {/* Broker Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Connected Broker Accounts ({brokers.length} total)
            </h2>
            <StatusBadge variant={isAutoActive ? "active" : "inactive"}>
              {isAutoActive ? "ROUTING LIVE" : "ROUTING PAUSED"}
            </StatusBadge>
          </div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {brokers.map((broker) => {
              const isConnected = broker.status === "connected";
              const liveAllocation = brokerCapitalAllocations[broker.id];
              const todayPnl = isConnected && liveAllocation ? liveAllocation.todayPnl : broker.todayPnl;
              const tradesExecuted = isConnected && liveAllocation ? liveAllocation.trades : broker.tradesExecuted;
              return (
                <GlassCard
                  key={broker.id}
                  className={`border border-glass-border flex flex-col justify-between p-5 h-56 transition-all duration-300 ${
                    isConnected ? "hover:border-neon-blue/30" : "opacity-75"
                  }`}
                  hover
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{broker.logo}</span>
                      <span className="text-sm font-bold text-text-primary">{broker.name}</span>
                    </div>
                    <StatusBadge
                      variant={
                        broker.status === "connected"
                          ? "success"
                          : broker.status === "error"
                          ? "danger"
                          : "inactive"
                      }
                      pulse={isConnected}
                    >
                      {broker.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="space-y-2.5 my-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Capital Allocated</span>
                      <span className="font-semibold text-text-primary font-mono">
                        {formatCurrency(broker.capitalAllocated)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Today's PnL</span>
                      <span className={`font-bold font-mono ${getPnlColor(todayPnl)}`}>
                        {todayPnl >= 0 ? "+" : ""}
                        {formatCurrency(todayPnl)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary">Trades Executed</span>
                      <span className="font-semibold text-text-primary font-mono">{tradesExecuted}</span>
                    </div>
                  </div>

                  <NeonButton
                    variant={isConnected ? "red" : "green"}
                    size="sm"
                    fullWidth
                    disabled={!isAdmin}
                    onClick={() => toggleBrokerConnection(broker.id)}
                    className="mt-1"
                  >
                    {isConnected ? "Disconnect" : "Connect Account"}
                  </NeonButton>
                </GlassCard>
              );
            })}
          </motion.div>
        </div>

        {/* Risk Management & Position Size Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Risk panel */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col">
            <GlassCard className={`flex-1 border border-glass-border flex flex-col justify-between relative ${!isAdmin ? "opacity-75" : ""}`} glow="none">
              {/* Lock overlay for User */}
              {!isAdmin && (
                <div className="absolute top-2 right-4 flex items-center gap-1 text-[9px] font-mono text-neon-purple uppercase">
                  <Lock size={10} /> Locked
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Engine Risk Controls
                </h2>
                <Settings size={14} className="text-text-secondary" />
              </div>

              <div className="space-y-4">
                {/* Risk per trade */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Risk Per Trade</span>
                    <span className="font-bold text-neon-blue font-mono">{riskPerTrade}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={riskPerTrade}
                    disabled={!isAdmin}
                    onChange={(e) => handleRiskChange(parseFloat(e.target.value), setRiskPerTrade)}
                    className="w-full accent-neon-blue cursor-pointer bg-white/5 h-1.5 rounded-lg disabled:opacity-50"
                  />
                  <p className="text-[9px] text-text-muted">Max percentage of broker capital risked per transaction</p>
                </div>

                {/* Daily drawdown limit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Daily Drawdown limit</span>
                    <span className="font-bold text-neon-red font-mono">₹{maxDailyLoss.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="5000"
                    value={maxDailyLoss}
                    disabled={!isAdmin}
                    onChange={(e) => handleRiskChange(parseInt(e.target.value), setMaxDailyLoss)}
                    className="w-full accent-neon-red cursor-pointer bg-white/5 h-1.5 rounded-lg disabled:opacity-50"
                  />
                  <p className="text-[9px] text-text-muted">Triggers emergency block if net daily PnL drops past threshold</p>
                </div>

                {/* Max open positions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Max Open Positions</span>
                    <span className="font-bold text-neon-purple font-mono">{maxOpenPositions}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={maxOpenPositions}
                    disabled={!isAdmin}
                    onChange={(e) => handleRiskChange(parseInt(e.target.value), setMaxOpenPositions)}
                    className="w-full accent-neon-purple cursor-pointer bg-white/5 h-1.5 rounded-lg disabled:opacity-50"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Calculator panel */}
          <motion.div variants={itemVariants} className="lg:col-span-6 flex flex-col">
            <GlassCard className="flex-1 border border-glass-border flex flex-col justify-between" glow="none">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Position Size Calculator
                </h2>
                <Calculator size={14} className="text-text-secondary" />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary uppercase">Capital (₹)</label>
                    <input
                      type="number"
                      value={calcCapital}
                      onChange={(e) => setCalcCapital(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary uppercase">Risk %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcRiskPercent}
                      onChange={(e) => setCalcRiskPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] text-text-secondary uppercase">SL Points</label>
                    <input
                      type="number"
                      value={calcStopLossPoints}
                      onChange={(e) => setCalcStopLossPoints(parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <NeonButton variant="outline" size="sm" onClick={calculatePositionSize} className="font-bold w-full mt-2">
                  Calculate Position Parameters
                </NeonButton>

                {calcResult && (
                  <div className="p-3 rounded-xl bg-white/[0.01] border border-glass-border/40 grid grid-cols-2 gap-4 mt-3 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-text-muted block font-sans">Risk Capital Amount</span>
                      <span className="text-neon-amber font-bold">₹{calcResult.riskAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block font-sans">Rec. Quantity (Lots)</span>
                      <span className="text-neon-blue font-bold">{calcResult.size} Lots</span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
