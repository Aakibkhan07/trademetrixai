"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wallet, Percent, Target, User, RefreshCw, Layers, Sparkles, Send } from "lucide-react";
import { useDemo } from "@/components/providers/DemoContext";
import { useMarketData } from "@/components/providers/MarketDataContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export function DemoControlPanel() {
  const {
    role,
    capital,
    winRate,
    activeStrategiesCount,
    username,
    isDemoControlOpen,
    setDemoControlOpen,
    updateSettings,
    injectNotification,
    resetAll,
  } = useDemo();

  const { openAlgoConfig, openAlgoStatus, placeOpenAlgoOrder } = useMarketData();

  // Local form states
  const [localCapital, setLocalCapital] = useState(capital);
  const [localWinRate, setLocalWinRate] = useState(winRate);
  const [localStrategies, setLocalStrategies] = useState(activeStrategiesCount);
  const [localUsername, setLocalUsername] = useState(username);

  // Sync when context changes
  useEffect(() => {
    setLocalCapital(capital);
    setLocalWinRate(winRate);
    setLocalStrategies(activeStrategiesCount);
    setLocalUsername(username);
  }, [capital, winRate, activeStrategiesCount, username]);

  if (!isDemoControlOpen || role !== "admin") return null;

  const handleSave = () => {
    updateSettings({
      capital: localCapital,
      winRate: Math.min(100, Math.max(0, localWinRate)),
      activeStrategiesCount: Math.max(0, localStrategies),
      username: localUsername,
    });
    injectNotification(
      "Metrics Configured",
      `Dashboard statistics adjusted: Capital = ₹${localCapital.toLocaleString()}, Win Rate = ${localWinRate}%.`,
      "success"
    );
    setDemoControlOpen(false);
  };

  const applyPreset = (presetName: string, cap: number, win: number, strat: number, userStr: string) => {
    setLocalCapital(cap);
    setLocalWinRate(win);
    setLocalStrategies(strat);
    setLocalUsername(userStr);

    injectNotification(
      "Preset Applied",
      `Loaded "${presetName}" profile parameters. Click Save to apply changes.`,
      "info"
    );
  };

  const handleInjectSignal = async (asset: "NIFTY" | "BANKNIFTY" | "RELIANCE", type: "CE" | "PE") => {
    const isCe = type === "CE";
    const strike = asset === "NIFTY" ? "23400" : asset === "BANKNIFTY" ? "50300" : "2940";
    const premium = asset === "NIFTY" ? "145.50" : asset === "BANKNIFTY" ? "240.20" : "48.60";
    const direction = isCe ? "BULLISH BREAKOUT" : "BEARISH REJECTION";
    
    injectNotification(
      "🚨 Live AI Signal Injected",
      `System detected ${direction} on ${asset} Spot. Option Contract: ${asset} ${strike} ${type} (Premium: ₹${premium}).`,
      isCe ? "success" : "warning"
    );

    // Attempt real-time Telegram signal routing
    try {
      const saved = localStorage.getItem("tm_telegram_config");
      if (saved) {
        const config = JSON.parse(saved);
        if (config.isConnected && config.autoSend && config.botToken && config.chatId) {
          const isPlaceholderToken = config.botToken === "1928471029:AAFj3l_9L2984kLas928skLa0192LkdA" || !config.botToken.trim();
          const isPlaceholderChat = config.chatId === "-1001928374829" || !config.chatId.trim();

          if (!isPlaceholderToken && !isPlaceholderChat) {
            // Calculate entry, stopLoss, target
            const entryVal = parseFloat(premium);
            const stopLossVal = (entryVal * 0.85).toFixed(2);
            const targetVal = (entryVal * 1.3).toFixed(2);
            
            // Format raw text template
            const rawText = config.template || `🚀 *Trade Metrix AI Signal*
            
📊 {symbol} — *{direction}*

▶️ Entry: {entry}
🛑 Stop Loss: {stopLoss}
🎯 Target: {target}`;

            const formattedText = rawText
              .replace("{symbol}", `${asset} ${strike} ${type}`)
              .replace("{direction}", isCe ? "BUY (LONG)" : "SELL (SHORT)")
              .replace("{entry}", `₹${premium}`)
              .replace("{stopLoss}", `₹${stopLossVal}`)
              .replace("{target}", `₹${targetVal}`);

            // Convert markdown style format to safe HTML tags
            let htmlText = formattedText;
            htmlText = htmlText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            htmlText = htmlText.replace(/\*(.*?)\*/g, "<b>$1</b>");
            htmlText = htmlText.replace(/_(.*?)_/g, "<i>$1</i>");

            // Post message payload to Telegram Bot API
            const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: config.chatId,
                text: htmlText,
                parse_mode: "HTML",
              }),
            });
            const data = await response.json();
            if (response.ok && data.ok) {
              injectNotification(
                "Telegram Broadcasted",
                `Signal posted successfully to Telegram Chat ID ${config.chatId}.`,
                "success"
              );
              
              // Increment telegram messages count
              const updatedCount = (config.messagesSentCount || 0) + 1;
              config.messagesSentCount = updatedCount;
              localStorage.setItem("tm_telegram_config", JSON.stringify(config));
            } else {
              console.warn("Telegram signal injection failed:", data.description);
              injectNotification(
                "Telegram Dispatch Error",
                `Failed to route signal: ${data.description || "API rejection"}`,
                "warning"
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to execute telegram signal auto-send:", err);
    }

    // Attempt real-time OpenAlgo order placement
    const isOpenAlgoActive = openAlgoConfig.enabled && openAlgoStatus === "connected";
    if (isOpenAlgoActive) {
      try {
        const optionSymbol = `${asset}26JUN${strike}${type}`; // NIFTY26JUN23400CE
        const orderRes = await placeOpenAlgoOrder({
          symbol: optionSymbol,
          action: "BUY", // Signals default to BUY for simplicity
          exchange: asset === "RELIANCE" ? "NSE" : "NFO", // Reliance is stock, Nifty/BankNifty are options
          quantity: asset === "NIFTY" ? 50 : asset === "BANKNIFTY" ? 15 : 1, // standard lots
          priceType: "MARKET",
          product: "MIS",
          strategy: "Injected Signal"
        });

        if (orderRes.success) {
          injectNotification(
            "Live Order Executed",
            `Routed ${optionSymbol} BUY order to broker via OpenAlgo. ID: ${orderRes.orderId}`,
            "success"
          );
        } else {
          injectNotification(
            "Live Execution Failed",
            `Broker routing failed: ${orderRes.error}`,
            "warning"
          );
        }
      } catch (err: any) {
        console.error("OpenAlgo auto-send failed:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        {/* Backdrop click close */}
        <div className="absolute inset-0" onClick={() => setDemoControlOpen(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg z-10"
        >
          <GlassCard className="border border-neon-purple/20 p-6 flex flex-col gap-5" glow="purple">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-glass-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
                  <Sparkles size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                    System Control Panel
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Configure institutional terminal metrics and manage system states.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDemoControlOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 border border-glass-border text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Presets segment */}
            <div>
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block mb-2">
                Select quick workspace presets
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => applyPreset("Retail Account", 85000, 52.4, 2, "Aakib Retail")}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-neon-blue/30 text-left transition-all hover:bg-white/5"
                >
                  <span className="text-[9px] font-bold text-neon-blue block">Retail Account</span>
                  <span className="text-[10px] font-bold text-text-primary mt-0.5 block">₹85,000</span>
                  <span className="text-[9px] text-text-muted block mt-0.5">Win Rate: 52.4%</span>
                </button>

                <button
                  onClick={() => applyPreset("Institutional Pro", 2500000, 74.5, 5, "TradeMetrix Master")}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-neon-purple/30 text-left transition-all hover:bg-white/5"
                >
                  <span className="text-[9px] font-bold text-neon-purple block">Pro Account</span>
                  <span className="text-[10px] font-bold text-text-primary mt-0.5 block">₹25L</span>
                  <span className="text-[9px] text-text-muted block mt-0.5">Win Rate: 74.5%</span>
                </button>

                <button
                  onClick={() => applyPreset("Hedge Fund Alpha", 150000000, 89.2, 12, "Aakib Fund Alpha")}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-neon-green/30 text-left transition-all hover:bg-white/5"
                >
                  <span className="text-[9px] font-bold text-neon-green block">Hedge Fund</span>
                  <span className="text-[10px] font-bold text-text-primary mt-0.5 block">₹15Cr</span>
                  <span className="text-[9px] text-text-muted block mt-0.5">Win Rate: 89.2%</span>
                </button>
              </div>
            </div>

            {/* Manual controls form */}
            <div className="space-y-4 border-t border-b border-glass-border py-4">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block">
                Custom override parameters
              </span>

              {/* Username & Capital */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <User size={11} className="text-text-muted" /> Profile Name
                  </label>
                  <input
                    type="text"
                    value={localUsername}
                    onChange={(e) => setLocalUsername(e.target.value)}
                    className="w-full bg-black/60 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-neon-purple"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <Wallet size={11} className="text-text-muted" /> Capital Allocated (₹)
                  </label>
                  <input
                    type="number"
                    value={localCapital}
                    onChange={(e) => setLocalCapital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-neon-purple font-mono"
                  />
                </div>
              </div>

              {/* Win Rate & Strategies */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <Percent size={11} className="text-text-muted" /> Win Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={localWinRate}
                    onChange={(e) => setLocalWinRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-neon-purple font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
                    <Target size={11} className="text-text-muted" /> Active Strategies
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={localStrategies}
                    onChange={(e) => setLocalStrategies(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-glass-border rounded-xl px-3 py-2 text-xs text-text-primary font-bold focus:outline-none focus:border-neon-purple font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Events simulation */}
            <div>
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider block mb-2">
                Generate test signals & alert feeds
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-text-secondary block">Call Option Setup Alerts:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleInjectSignal("NIFTY", "CE")}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-neon-green/5 border border-neon-green/15 text-neon-green text-[9px] font-bold hover:bg-neon-green/10 transition-colors"
                    >
                      + Nifty Call
                    </button>
                    <button
                      onClick={() => handleInjectSignal("BANKNIFTY", "CE")}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-neon-green/5 border border-neon-green/15 text-neon-green text-[9px] font-bold hover:bg-neon-green/10 transition-colors"
                    >
                      + BankNifty Call
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-text-secondary block">Put Option Setup Alerts:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleInjectSignal("NIFTY", "PE")}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-neon-red/5 border border-neon-red/15 text-neon-red text-[9px] font-bold hover:bg-neon-red/10 transition-colors"
                    >
                      + Nifty Put
                    </button>
                    <button
                      onClick={() => handleInjectSignal("BANKNIFTY", "PE")}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-neon-red/5 border border-neon-red/15 text-neon-red text-[9px] font-bold hover:bg-neon-red/10 transition-colors"
                    >
                      + BankNifty Put
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex gap-2.5 pt-3 border-t border-glass-border">
              <NeonButton
                variant="blue"
                onClick={handleSave}
                className="flex-1 text-xs py-2 font-bold"
              >
                Save Overrides
              </NeonButton>
              <NeonButton
                variant="outline"
                onClick={resetAll}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Reset Defaults
              </NeonButton>
            </div>

          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
