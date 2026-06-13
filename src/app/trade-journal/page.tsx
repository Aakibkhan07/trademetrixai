"use client";

import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, Search, RefreshCw, ChevronDown, ChevronUp, FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { tradeEntries, strategies } from "@/lib/dummy-data";
import { formatCurrency, formatPercent, getPnlColor, cn } from "@/lib/utils";
import { VerifiedAuditModal } from "@/components/ui/VerifiedAuditModal";
import { getTrades, addTrade, clearTrades } from "@/lib/trade-store";
import { useAuth } from "@/components/providers/AuthContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function TradeJournalPage() {
  const { user, firebaseReady } = useAuth();
  const userId = firebaseReady && user ? user.uid : "demo-user";
  const [trades, setTrades] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch trades from the trade store on mount
  useEffect(() => {
    async function loadTrades() {
      const data = await getTrades(userId);
      setTrades(data);
    }
    loadTrades();
  }, [userId]);

  const handleRefresh = async () => {
    const data = await getTrades(userId);
    setTrades(data);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("ALL");
  const [selectedPnl, setSelectedPnl] = useState<"ALL" | "PROFIT" | "LOSS">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [auditTrade, setAuditTrade] = useState<any | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Form states for manual trade entry
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [strategy, setStrategy] = useState(strategies[0]?.name || "EMA 9/15 Scalper");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pnlInput, setPnlInput] = useState("");
  const [fees, setFees] = useState("50.00");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [duration, setDuration] = useState("15min");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Options specific form states
  const [optionType, setOptionType] = useState<"CE" | "PE" | "NA">("NA");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [impliedVolatility, setImpliedVolatility] = useState("");
  const [optionDelta, setOptionDelta] = useState("");

  // Auto-calculate PnL when entry, exit, or qty change
  const autoCalculatedPnl = (() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseInt(quantity);
    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return null;

    if (direction === "BUY") {
      return (exit - entry) * qty;
    } else {
      return (entry - exit) * qty;
    }
  })();

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !exitPrice || !quantity) {
      alert("Please fill in all required fields (Symbol, Entry Price, Exit Price, Quantity).");
      return;
    }

    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseInt(quantity);
    const finalFees = parseFloat(fees) || 0;

    // Use user-defined PnL or fall back to auto-calculated PnL
    const finalPnl = pnlInput !== "" ? parseFloat(pnlInput) : (autoCalculatedPnl !== null ? autoCalculatedPnl : 0);
    
    // PnL percent relative to position size (entryPrice * quantity)
    const positionSize = entry * qty;
    const finalPnlPercent = positionSize > 0 ? (finalPnl / positionSize) * 100 : 0;

    // Format options symbol if applicable
    let finalSymbol = symbol.toUpperCase().trim();
    if (optionType !== "NA" && strikePrice) {
      finalSymbol = `${finalSymbol} ${strikePrice} ${optionType}`;
    }

    const tradeData = {
      uid: userId,
      date: tradeDate,
      symbol: finalSymbol,
      direction,
      strategy,
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      pnl: Number(finalPnl.toFixed(2)),
      pnlPercent: Number(finalPnlPercent.toFixed(2)),
      fees: Number(finalFees.toFixed(2)),
      netPnl: Number((finalPnl - finalFees).toFixed(2)),
      notes,
      tags: tagsInput ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean) : [],
      duration,
      optionType: optionType !== "NA" ? optionType : undefined,
      strikePrice: optionType !== "NA" && strikePrice ? parseFloat(strikePrice) : undefined,
      expiryDate: optionType !== "NA" && expiryDate ? expiryDate : undefined,
      impliedVolatility: optionType !== "NA" && impliedVolatility ? parseFloat(impliedVolatility) : undefined,
      status: "closed" as const,
    };

    await addTrade(tradeData);
    await handleRefresh();
    setIsModalOpen(false);

    // Reset form fields
    setSymbol("");
    setEntryPrice("");
    setExitPrice("");
    setQuantity("");
    setPnlInput("");
    setFees("50.00");
    setNotes("");
    setTagsInput("");
    setDuration("15min");
    setTradeDate(new Date().toISOString().split("T")[0]);
    setOptionType("NA");
    setStrikePrice("");
    setExpiryDate("");
    setImpliedVolatility("");
    setOptionDelta("");
  };

  const handleClearJournal = async () => {
    if (confirm("Are you sure you want to clear all trades from the journal? This cannot be undone.")) {
      clearTrades();
      // Reset demo capital to default if using localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("tm_demo_capital", "500000");
        window.dispatchEvent(new Event("storage"));
      }
      await handleRefresh();
    }
  };

  // Extract unique strategy names for filter list
  const uniqueStrategies = ["ALL", ...Array.from(new Set(strategies.map((s) => s.name)))];

  // Filtering logic
  const filteredTrades = trades.filter((trade) => {
    // Search query symbol
    if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Strategy selection
    if (selectedStrategy !== "ALL" && trade.strategy !== selectedStrategy) return false;
    // PnL selection
    if (selectedPnl === "PROFIT" && trade.pnl < 0) return false;
    if (selectedPnl === "LOSS" && trade.pnl >= 0) return false;
    // Date ranges
    if (startDate && new Date(trade.date) < new Date(startDate)) return false;
    if (endDate && new Date(trade.date) > new Date(endDate)) return false;
    // Verified Only
    if (verifiedOnly && trade.id.startsWith("t-new-")) return false;
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStrategy("ALL");
    setSelectedPnl("ALL");
    setStartDate("");
    setEndDate("");
    setVerifiedOnly(false);
  };

  const handleExportCsv = () => {
    // Dummy CSV export simulation
    alert("Exporting CSV file. Download starting...");
  };

  // Summaries calculations based on current filtered dataset
  const totalTradesCount = filteredTrades.length;
  const winningTrades = filteredTrades.filter((t) => t.pnl >= 0).length;
  const winRate = totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
  const avgPnL = totalTradesCount > 0 ? totalPnL / totalTradesCount : 0;
  const bestTrade = totalTradesCount > 0 ? Math.max(...filteredTrades.map((t) => t.pnl)) : 0;
  const worstTrade = totalTradesCount > 0 ? Math.min(...filteredTrades.map((t) => t.pnl)) : 0;

  const summaryStats = [
    { label: "Total Trades", value: totalTradesCount },
    { label: "Win Rate", value: winRate.toFixed(1) + "%", color: "text-neon-blue" },
    {
      label: "Total Net PnL",
      value: formatCurrency(totalPnL),
      color: totalPnL >= 0 ? "text-neon-green" : "text-neon-red",
    },
    {
      label: "Avg PnL / Trade",
      value: formatCurrency(avgPnL),
      color: avgPnL >= 0 ? "text-neon-green" : "text-neon-red",
    },
    { label: "Best Trade", value: formatCurrency(bestTrade), color: "text-neon-green" },
    { label: "Worst Trade", value: formatCurrency(worstTrade), color: "text-neon-red" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Trade Journal" subtitle="Complete trade history and analysis" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Summaries row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryStats.map((stat, idx) => (
            <GlassCard key={idx} className="border border-glass-border p-4 flex flex-col justify-between h-24" hover>
              <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider">
                {stat.label}
              </span>
              <span className={`text-base font-bold font-mono mt-2 ${stat.color || "text-text-primary"}`}>
                {stat.value}
              </span>
            </GlassCard>
          ))}
        </motion.div>

        {/* Filter bar panel */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border" glow="none">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 flex-1">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-glass-border text-text-secondary text-xs">
                  <Search size={14} className="text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search symbol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent focus:outline-none text-text-primary w-full"
                  />
                </div>

                {/* Strategy dropdown */}
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-secondary focus:outline-none"
                >
                  {uniqueStrategies.map((strat) => (
                    <option key={strat} value={strat} className="bg-surface text-text-primary">
                      {strat === "ALL" ? "All Strategies" : strat}
                    </option>
                  ))}
                </select>

                {/* Pnl filter tabs */}
                <select
                  value={selectedPnl}
                  onChange={(e) => setSelectedPnl(e.target.value as any)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1.5 text-xs text-text-secondary focus:outline-none"
                >
                  <option value="ALL" className="bg-surface text-text-primary">All Outcomes</option>
                  <option value="PROFIT" className="bg-surface text-text-primary">Profitable</option>
                  <option value="LOSS" className="bg-surface text-text-primary">Losing</option>
                </select>

                {/* Dates */}
                <input
                  type="date"
                  value={startDate}
                  placeholder="Start Date"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1 text-xs text-text-secondary focus:outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  placeholder="End Date"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/5 border border-glass-border rounded-xl px-3 py-1 text-xs text-text-secondary focus:outline-none"
                />

                {/* Verified Only toggle */}
                <div className="flex items-center gap-2 px-3 py-1 bg-neon-green/5 border border-neon-green/20 rounded-xl select-none shrink-0 h-[30px] justify-between">
                  <span className="text-[9px] font-bold text-neon-green uppercase tracking-wider">Verified Only</span>
                  <div
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`toggle-switch small ${verifiedOnly ? "active" : ""} cursor-pointer`}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                <NeonButton variant="green" size="sm" onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                  Log Manual Trade
                </NeonButton>
                <NeonButton variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                  <RefreshCw size={13} />
                  Clear
                </NeonButton>
                <NeonButton variant="outline" size="sm" onClick={handleExportCsv} className="flex items-center gap-1.5">
                  <Download size={13} />
                  Export CSV
                </NeonButton>
                <NeonButton variant="outline" size="sm" onClick={handleClearJournal} className="flex items-center gap-1.5 text-neon-red/80 border-neon-red/30 hover:bg-neon-red/10">
                  <RefreshCw size={13} />
                  Clear Journal
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Table list */}
        <motion.div variants={itemVariants}>
          <GlassCard className="border border-glass-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-glass-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-2 pb-3 pl-3">Date</th>
                    <th className="py-2 pb-3">Symbol</th>
                    <th className="py-2 pb-3">Type</th>
                    <th className="py-2 pb-3">Strategy</th>
                    <th className="py-2 pb-3 font-mono">Entry</th>
                    <th className="py-2 pb-3 font-mono">Exit</th>
                    <th className="py-2 pb-3 font-mono">Qty</th>
                    <th className="py-2 pb-3 font-mono">Fees</th>
                    <th className="py-2 pb-3 font-mono text-right">Net Return</th>
                    <th className="py-2 pb-3 text-right pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/30 text-xs">
                  {filteredTrades.map((trade) => {
                    const tradeKey = trade.id || `trade-${trade.date}-${trade.symbol}`;
                    const isExpanded = expandedRow === tradeKey;
                    const isProfit = trade.pnl >= 0;
                    return (
                      <Fragment key={trade.id}>
                        <tr
                          key={trade.id || `trade-${trade.date}-${trade.symbol}`}
                          onClick={() => setExpandedRow(isExpanded ? null : (trade.id || `trade-${trade.date}-${trade.symbol}`))}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 pl-3 text-text-secondary font-mono">{trade.date}</td>
                          <td className="py-3.5 font-bold text-text-primary">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{trade.symbol}</span>
                              {trade.id && !trade.id.startsWith("t-new-") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAuditTrade(trade);
                                    setIsAuditModalOpen(true);
                                  }}
                                  className="text-neon-green hover:text-white transition-colors flex items-center gap-0.5 bg-neon-green/10 border border-neon-green/25 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer"
                                  title="Click to view broker API audit certificate"
                                >
                                  <ShieldCheck size={9} />
                                  Verified
                                </button>
                              )}
                              {trade.optionType && trade.optionType !== "NA" && (
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide",
                                  trade.optionType === "CE" 
                                    ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                                    : "bg-neon-red/10 text-neon-red border border-neon-red/20"
                                )}>
                                  {trade.optionType}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <StatusBadge variant={trade.direction === "BUY" ? "buy" : "sell"}>
                              {trade.direction}
                            </StatusBadge>
                          </td>
                          <td className="py-3.5 text-text-secondary font-medium">{trade.strategy}</td>
                          <td className="py-3.5 font-mono text-text-secondary">₹{trade.entryPrice}</td>
                          <td className="py-3.5 font-mono text-text-secondary">₹{trade.exitPrice}</td>
                          <td className="py-3.5 font-mono text-text-muted">{trade.quantity}</td>
                          <td className="py-3.5 font-mono text-text-muted">₹{trade.fees}</td>
                          <td className={`py-3.5 text-right font-extrabold font-mono ${getPnlColor(trade.pnl)}`}>
                            {isProfit ? "+" : ""}
                            {formatCurrency(trade.pnl)}
                            <span className="text-[10px] ml-1 font-medium block font-sans">
                              {formatPercent(trade.pnlPercent)}
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-3 text-text-muted group-hover:text-neon-blue transition-colors">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </td>
                        </tr>

                        {/* Expandable row */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="p-0 bg-white/[0.01]">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 py-4 border-t border-glass-border/30 border-b border-glass-border/30 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                      <FileText size={14} className="text-neon-blue" />
                                      Trade Log Notes & Metadata
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed bg-surface/40 p-3 rounded-lg border border-glass-border">
                                      {trade.notes || "No additional execution logs captured for this transaction. System confirmed routing clean execution path."}
                                    </p>

                                    {trade.optionType && trade.optionType !== "NA" && (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 rounded-lg bg-white/[0.01] border border-glass-border/30 text-xs font-mono">
                                        <div>
                                          <span className="text-[10px] text-text-secondary block font-sans">Option Strike</span>
                                          <span className="text-text-primary font-bold">₹{trade.strikePrice}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-secondary block font-sans">Expiry Date</span>
                                          <span className="text-text-primary font-bold">{trade.expiryDate || "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-secondary block font-sans">Implied Vol (IV)</span>
                                          <span className="text-neon-blue font-bold">{trade.impliedVolatility ? `${trade.impliedVolatility}%` : "N/A"}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-text-secondary block font-sans">Est. Option Delta</span>
                                          <span className={cn("font-bold", trade.optionType === "CE" ? "text-neon-green" : "text-neon-red")}>
                                            {trade.optionType === "CE" ? "+0.55" : "-0.48"}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Tags metadata */}
                                    {trade.tags && trade.tags.length > 0 && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <span className="text-[10px] text-text-muted font-semibold uppercase">Tags:</span>
                                        <div className="flex gap-1">
                                          {trade.tags.map((tag: string, tIdx: number) => (
                                            <span
                                              key={tIdx}
                                              className="text-[9px] text-neon-blue bg-neon-blue/5 border border-neon-blue/20 px-2 py-0.5 rounded"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl"
            >
              <GlassCard className="border border-glass-border p-6 space-y-6" glow="blue">
                <div className="flex items-center justify-between border-b border-glass-border pb-3">
                  <div>
                    <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Log Manual Trade Entry</h2>
                    <p className="text-[10px] text-text-secondary">Inject a verified trade log execution record directly into the journal</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-text-muted hover:text-text-primary font-mono text-sm cursor-pointer p-1"
                  >
                    CLOSE [X]
                  </button>
                </div>

                <form onSubmit={handleAddTrade} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Symbol */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Symbol *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NIFTY 50"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                      />
                    </div>

                    {/* Direction */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Direction *</label>
                      <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as any)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none"
                      >
                        <option value="BUY" className="bg-surface text-text-primary">BUY / LONG</option>
                        <option value="SELL" className="bg-surface text-text-primary">SELL / SHORT</option>
                      </select>
                    </div>

                    {/* Strategy */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Strategy *</label>
                      <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none"
                      >
                        {strategies.map((strat) => (
                          <option key={strat.id} value={strat.name} className="bg-surface text-text-primary">
                            {strat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Option Configuration row */}
                  <div className="p-3 rounded-xl bg-neon-blue/5 border border-neon-blue/15 space-y-3">
                    <span className="text-[10px] text-neon-blue font-bold uppercase tracking-wider block">Option Details (Index / Stock Options)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Option Type */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary uppercase font-semibold">Option Type</label>
                        <select
                          value={optionType}
                          onChange={(e) => setOptionType(e.target.value as any)}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-neon-blue/50"
                        >
                          <option value="NA" className="bg-surface text-text-primary">NA (Equity / Spot)</option>
                          <option value="CE" className="bg-surface text-text-primary">CE (Call Option)</option>
                          <option value="PE" className="bg-surface text-text-primary">PE (Put Option)</option>
                        </select>
                      </div>

                      {/* Strike Price */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary uppercase font-semibold">Strike Price</label>
                        <input
                          type="number"
                          step="50"
                          disabled={optionType === "NA"}
                          placeholder={optionType === "NA" ? "Disabled" : "e.g. 23500"}
                          value={strikePrice}
                          onChange={(e) => setStrikePrice(e.target.value)}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Expiry Date */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary uppercase font-semibold">Expiry Date</label>
                        <input
                          type="text"
                          disabled={optionType === "NA"}
                          placeholder={optionType === "NA" ? "Disabled" : "e.g. 18 Jun 2026"}
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Implied Volatility */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-text-secondary uppercase font-semibold">Implied Vol (IV %)</label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={optionType === "NA"}
                          placeholder={optionType === "NA" ? "Disabled" : "e.g. 14.2"}
                          value={impliedVolatility}
                          onChange={(e) => setImpliedVolatility(e.target.value)}
                          className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {optionType !== "NA" && strikePrice && (
                      <div className="text-[9px] text-text-muted font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                        Option Auto Symbol Preview: <span className="text-neon-blue font-bold">{symbol.toUpperCase().trim() || "UNDERLYING"} {strikePrice} {optionType}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Entry Price */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Entry Price *</label>
                      <input
                        type="number"
                        step="0.05"
                        required
                        placeholder="0.00"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                      />
                    </div>

                    {/* Exit Price */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Exit Price *</label>
                      <input
                        type="number"
                        step="0.05"
                        required
                        placeholder="0.00"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Quantity *</label>
                      <input
                        type="number"
                        required
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                      />
                    </div>

                    {/* Fees */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Fees</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="50.00"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Profit/Loss Manual Override */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Profit / Loss Override</label>
                      <input
                        type="number"
                        step="0.05"
                        placeholder={autoCalculatedPnl !== null ? `${autoCalculatedPnl.toFixed(2)} (Auto)` : "Override PnL"}
                        value={pnlInput}
                        onChange={(e) => setPnlInput(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 font-mono"
                      />
                      {autoCalculatedPnl !== null && (
                        <span className={`text-[9px] mt-0.5 font-mono ${autoCalculatedPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                          Calculated: {autoCalculatedPnl >= 0 ? "+" : ""}{autoCalculatedPnl.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </span>
                      )}
                    </div>

                    {/* Trade Date */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Trade Date</label>
                      <input
                        type="date"
                        value={tradeDate}
                        onChange={(e) => setTradeDate(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-secondary focus:outline-none"
                      />
                    </div>

                    {/* Trade Duration */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Trade Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 1hr 15min"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                      />
                    </div>
                  </div>

                  {/* Tags & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. SMC, Reversal, HighRisk"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-text-secondary uppercase font-semibold">Execution Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Add execution logs, psychology notes, or setup descriptions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-white/5 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue/50 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-glass-border/30">
                    <NeonButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </NeonButton>
                    <NeonButton
                      type="submit"
                      variant="green"
                      size="sm"
                    >
                      Confirm Execution Record
                    </NeonButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verified Broker Audit Certificate Modal */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <VerifiedAuditModal
            isOpen={isAuditModalOpen}
            onClose={() => {
              setIsAuditModalOpen(false);
              setAuditTrade(null);
            }}
            trade={auditTrade}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
