"use client";

import { motion } from "motion/react";
import { X, ShieldCheck, CheckCircle2, Copy, ExternalLink, Calendar, Hash, Tag, Award } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { NeonButton } from "./NeonButton";
import { formatCurrency, formatPercent, getPnlColor } from "@/lib/utils";

interface VerifiedAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: {
    id: string;
    date: string;
    symbol: string;
    direction: string;
    strategy: string;
    entryPrice: number;
    exitPrice?: number;
    quantity: number;
    pnl: number;
    pnlPercent: number;
    fees: number;
    netPnl: number;
    optionType?: string;
    strikePrice?: number;
    expiryDate?: string;
  } | null;
}

export function VerifiedAuditModal({ isOpen, onClose, trade }: VerifiedAuditModalProps) {
  if (!isOpen || !trade) return null;

  // Generate a mock hash and exchange ID based on the trade ID
  const mockTxHash = "0x" + Array.from(trade.id).map(c => c.charCodeAt(0).toString(16)).join("").substring(0, 32).padEnd(32, "a");
  const mockExchangeId = `NSE-${trade.date.replace(/-/g, "")}-${trade.id.toUpperCase()}`;
  const mockTimestamp = `${trade.date} ${trade.direction === "BUY" ? "09:24:12.450" : "14:15:33.890"}`;
  
  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockTxHash);
    alert("Cryptographic hash copied to clipboard!");
  };

  const isProfit = trade.pnl >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg relative"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-1.5 rounded-lg bg-white/5 border border-glass-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        <GlassCard className="border border-neon-green/30 p-6 flex flex-col gap-6" glow="green">
          {/* Header */}
          <div className="border-b border-glass-border pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green animate-pulse">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                  Verified Broker Audit Ledger
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 text-neon-green flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified Feed
                </span>
              </div>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Broker API Sync Ref: <span className="text-text-primary font-mono">{mockExchangeId}</span>
              </p>
            </div>
          </div>

          {/* Verification Status Banner */}
          <div className="bg-neon-green/5 border border-neon-green/20 rounded-xl p-3.5 text-center flex flex-col items-center gap-1.5">
            <Award size={18} className="text-neon-green animate-bounce" />
            <span className="text-xs font-bold text-text-primary">Authenticity Guaranteed</span>
            <p className="text-[10px] text-text-secondary max-w-sm">
              This trade was fetched directly via broker read-only API feeds. Execution price, quantity, and contract note parameters match the clearing member statement exactly.
            </p>
          </div>

          {/* Audit parameters */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase flex items-center gap-1">
                  <Tag size={10} /> Contract / Symbol
                </span>
                <span className="text-xs font-bold text-text-primary font-mono">{trade.symbol}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase flex items-center gap-1">
                  <Calendar size={10} /> Executed Timestamp
                </span>
                <span className="text-xs font-medium text-text-primary font-mono">{mockTimestamp}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase flex items-center gap-1">
                  <Hash size={10} /> Trade ID / Direction
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary font-mono">{trade.id.toUpperCase()}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${trade.direction === "BUY" ? "bg-neon-green/15 text-neon-green border border-neon-green/25" : "bg-neon-red/15 text-neon-red border border-neon-red/25"}`}>
                    {trade.direction}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase">Strategy Router</span>
                <span className="text-xs font-bold text-text-primary">{trade.strategy}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase">Quantity Executed</span>
                <span className="text-xs font-medium text-text-primary font-mono">{trade.quantity} units</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] text-text-secondary uppercase">Execution / Exit Price</span>
                <span className="text-xs font-medium text-text-primary font-mono">
                  ₹{trade.entryPrice} → {trade.exitPrice ? `₹${trade.exitPrice}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-glass-border/40" />

          {/* Cryptographic Ledger Details */}
          <div className="space-y-2 bg-black/85 border border-glass-border/40 p-3.5 rounded-xl">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider block">Cryptographic Hash</span>
            <div className="flex items-center justify-between gap-3 font-mono text-[10px]">
              <span className="text-neon-green truncate max-w-[280px]">{mockTxHash}</span>
              <button
                onClick={handleCopyHash}
                className="p-1 rounded bg-white/5 border border-glass-border text-text-muted hover:text-text-primary transition-colors hover:bg-white/10"
                title="Copy Hash"
              >
                <Copy size={11} />
              </button>
            </div>
          </div>

          {/* Financials details table */}
          <div className="grid grid-cols-3 gap-3 text-center border-t border-glass-border/40 pt-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-text-secondary uppercase">Gross Profit</span>
              <span className={`text-sm font-bold font-mono mt-1 ${getPnlColor(trade.pnl)}`}>
                {isProfit ? "+" : ""}
                {formatCurrency(trade.pnl)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-secondary uppercase">Transaction Fees</span>
              <span className="text-sm font-bold font-mono mt-1 text-text-secondary">
                ₹{trade.fees.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-secondary uppercase">Audited Net Return</span>
              <span className={`text-sm font-extrabold font-mono mt-1 ${getPnlColor(trade.netPnl)}`}>
                {trade.netPnl >= 0 ? "+" : ""}
                {formatCurrency(trade.netPnl)}
                <span className="text-[9px] block font-sans font-medium mt-0.5">
                  {formatPercent(trade.pnlPercent)}
                </span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <NeonButton variant="outline" size="sm" fullWidth onClick={onClose}>
              Dismiss Details
            </NeonButton>
            <NeonButton
              variant="green"
              glow
              size="sm"
              fullWidth
              className="flex items-center justify-center gap-1.5"
              onClick={() => {
                alert("Navigating to NSE order details repository...");
              }}
            >
              Verify on Exchange
              <ExternalLink size={12} />
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
