"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UploadCloud, 
  Check, 
  ShieldCheck, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText,
  AlertCircle
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import { cn } from "@/lib/utils";

// expert presets data
const PRESETS = [
  {
    id: "p-1",
    name: "NIFTY Bullish FVG Mitigation",
    description: "NIFTY 50 15m chart displaying institutional Fair Value Gap fill",
    underlying: "NIFTY 50",
    direction: "BUY" as const,
    strategy: "SMC FVG Inefficient Fill",
    confidence: 94,
    probability: 88,
    entrySpot: 23380.00,
    stopLossSpot: 23340.00,
    targetSpot: 23580.00,
    expectedRR: 5.0,
    impliedVolatility: 13.2,
    delta: 0.54,
    optionContract: "NIFTY 23400 CE",
    optionPremiumEntry: 145.50,
    optionPremiumSL: 115.00,
    optionPremiumTarget: 250.00,
    detectedStructures: [
      "Bullish Order Block (OB) mitigation on 15m TF",
      "Fair Value Gap (FVG) inefficiency filled at 23,360",
      "Sell-Side Liquidity (SSL) swept below Asia session low",
      "Market Structure Shift (MSS) confirmed on 5m with displacement"
    ],
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "p-2",
    name: "BANKNIFTY BSL Liquidity Run",
    description: "BANKNIFTY 5m chart displaying Buy-Side Liquidity pool sweep",
    underlying: "BANKNIFTY",
    direction: "SELL" as const,
    strategy: "ICT Liquidity Run (BSL Sweep)",
    confidence: 89,
    probability: 81,
    entrySpot: 50320.00,
    stopLossSpot: 50360.00,
    targetSpot: 49500.00,
    expectedRR: 13.3,
    impliedVolatility: 15.8,
    delta: -0.52,
    optionContract: "BANKNIFTY 50300 PE",
    optionPremiumEntry: 240.20,
    optionPremiumSL: 190.00,
    optionPremiumTarget: 410.00,
    detectedStructures: [
      "Equal highs swept (BSL sweep) above daily swing high at 50,320",
      "Bearish Breaker Block formed on 5m timeframe",
      "15m Bearish Order Block mitigation with strong rejection candle",
      "Discount-to-Premium zone expansion confirmed on Fibonacci"
    ],
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "p-3",
    name: "RELIANCE 4H Breaker Bounce",
    description: "RELIANCE 1h chart displaying mitigation of breaker block support",
    underlying: "RELIANCE",
    direction: "BUY" as const,
    strategy: "SMC Breaker Mitigation",
    confidence: 82,
    probability: 76,
    entrySpot: 2942.35,
    stopLossSpot: 2932.00,
    targetSpot: 2998.00,
    expectedRR: 4.08,
    impliedVolatility: 17.5,
    delta: 0.51,
    optionContract: "RELIANCE 2940 CE",
    optionPremiumEntry: 48.60,
    optionPremiumSL: 39.00,
    optionPremiumTarget: 78.00,
    detectedStructures: [
      "Mitigated 1h bullish Breaker Block zone at 2,935",
      "Order Flow aligned with daily institutional accumulation",
      "Tapped 0.618 Fibonacci retracement equilibrium zone",
      "High volume consolidation indicating retail short squeeze"
    ],
    imageUrl: "https://images.unsplash.com/photo-1642390091310-20025ab80458?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "p-4",
    name: "SENSEX Supertrend Breakout",
    description: "SENSEX 15m chart displaying Bollinger Band squeeze and Supertrend buy trigger",
    underlying: "SENSEX",
    direction: "BUY" as const,
    strategy: "Volatility Squeeze (BB + Supertrend)",
    confidence: 96,
    probability: 91,
    entrySpot: 74520.00,
    stopLossSpot: 74400.00,
    targetSpot: 75100.00,
    expectedRR: 4.83,
    impliedVolatility: 14.8,
    delta: 0.58,
    optionContract: "SENSEX 74200 CE",
    optionPremiumEntry: 310.50,
    optionPremiumSL: 240.00,
    optionPremiumTarget: 650.00,
    detectedStructures: [
      "Bollinger Bands (20,2) squeeze indicates imminent volatility breakout",
      "Supertrend (10,3) triggered BUY signal on 15m candle close",
      "Auto Key Levels mapped weekly horizontal support at 74,500",
      "RSI crossed above 50 midline indicating structural momentum shift"
    ],
    imageUrl: "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&w=600&q=80"
  }
];

export default function ChartAnalyzerPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal log window
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Terminal logging logic simulation
  const startScanner = (imageUrl: string, presetId: string | null) => {
    setSelectedImage(imageUrl);
    setSelectedPresetId(presetId);
    setIsScanning(true);
    setShowResults(false);
    setTerminalLogs([]);

    const logMessages = [
      "🚀 [10:42:01] INITIALIZING COMPUTER VISION SCAN ENGINE...",
      "🔗 [10:42:01] LOADING SCREENSHOT ARTIFACT INTO TENSOR BUFFER...",
      "🔍 [10:42:02] PARSING CANDLESTICK SHAPES & DYNAMIC IMBALANCES...",
      "📐 [10:42:02] MAPPING SUPPORT & RESISTANCE (S/R) LEVELS...",
      "🏦 [10:42:03] IDENTIFYING INSTITUTIONAL ORDER BLOCKS (OB)...",
      "💧 [10:42:03] CALCULATING LIQUIDITY SWEEPS (BSL / SSL POOLS)...",
      "📊 [10:42:04] ANALYSIS COMPLETED. COMPILING OPTIONS METRICS..."
    ];

    let delay = 0;
    logMessages.forEach((msg, idx) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, msg]);
        if (idx === logMessages.length - 1) {
          setTimeout(() => {
            setIsScanning(false);
            setShowResults(true);
          }, 800);
        }
      }, delay);
      delay += 350 + Math.random() * 200;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          startScanner(event.target.result as string, null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          startScanner(event.target.result as string, null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset configuration selection
  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  return (
    <div className="flex flex-col flex-1">
      <Header title="AI Chart Analyzer" subtitle="Institutional computer vision screenshot scanning" />

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Upload workspace and Presets */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <GlassCard className="border border-glass-border flex flex-col justify-between" glow="none">
              <div>
                <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">
                  Visual Screenshot Scanner
                </h2>
                <p className="text-[10px] text-text-secondary mb-4">
                  Drag and drop a trading chart screenshot. Our AI will automatically locate institutional setups.
                </p>
              </div>

              {/* Upload Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all min-h-[220px] cursor-pointer",
                  dragActive ? "border-neon-blue bg-neon-blue/5" : "border-glass-border bg-white/[0.02] hover:border-neon-blue/40"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                <AnimatePresence mode="wait">
                  {selectedImage ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full max-h-[280px] overflow-hidden rounded-xl flex items-center justify-center bg-black/40"
                    >
                      <img 
                        src={selectedImage} 
                        alt="Scanned trading chart preview" 
                        className="w-full h-full object-contain max-h-[280px]"
                      />
                      
                      {/* Interactive scanning laser sweep bar animation */}
                      {isScanning && (
                        <motion.div
                          initial={{ top: "0%" }}
                          animate={{ top: "100%" }}
                          transition={{
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 1.4,
                            ease: "easeInOut"
                          }}
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent shadow-[0_0_15px_#00d4ff] z-10"
                        />
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 text-center">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/5 border border-neon-blue/15 flex items-center justify-center text-neon-blue">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">Upload chart screenshot</span>
                        <span className="text-[10px] text-text-muted">Supports PNG, JPG, JPEG up to 10MB</span>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ticking live diagnostics scroll logs */}
              {isScanning && (
                <div className="mt-4 p-3 rounded-xl bg-black/80 border border-glass-border font-mono text-[9px] text-neon-green h-28 overflow-y-auto space-y-1">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="leading-normal">{log}</div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              )}
            </GlassCard>

            {/* Presets Row */}
            <div className="space-y-3">
              <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider block">
                Or choose an expert preset chart to analyze instantly
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PRESETS.map((preset) => (
                  <GlassCard
                    key={preset.id}
                    onClick={() => startScanner(preset.imageUrl, preset.id)}
                    className={cn(
                      "border p-4 flex flex-col justify-between cursor-pointer hover:border-neon-blue/40 h-28",
                      selectedPresetId === preset.id ? "border-neon-blue bg-neon-blue/5" : "border-glass-border"
                    )}
                    hover
                  >
                    <span className="text-[10px] text-text-secondary font-bold uppercase">{preset.underlying}</span>
                    <span className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{preset.name}</span>
                    <div className="flex justify-between items-center mt-3">
                      <StatusBadge variant={preset.direction === "BUY" ? "buy" : "sell"}>
                        {preset.direction === "BUY" ? "BULLISH" : "BEARISH"}
                      </StatusBadge>
                      <span className="text-[9px] text-text-muted font-mono">Conf: {preset.confidence}%</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis Report output */}
          <div className="lg:col-span-5 flex flex-col">
            <AnimatePresence mode="wait">
              {showResults ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="flex flex-col gap-6 h-full justify-between animate-fade-in"
                >
                  <GlassCard
                    className={cn(
                      "border h-full flex flex-col justify-between p-6",
                      activePreset.direction === "BUY" ? "border-neon-green/20" : "border-neon-red/20"
                    )}
                    glow={activePreset.direction === "BUY" ? "green" : "red"}
                  >
                    {/* Header info */}
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-text-muted uppercase font-bold font-mono tracking-wider">AI Computer Vision Report</span>
                          <h3 className="text-xl font-bold text-text-primary tracking-tight mt-1">{activePreset.underlying} Spot</h3>
                        </div>
                        <StatusBadge variant={activePreset.direction === "BUY" ? "buy" : "sell"} pulse>
                          {activePreset.direction === "BUY" ? "BULLISH BIAS" : "BEARISH BIAS"}
                        </StatusBadge>
                      </div>

                      {/* Confidence and Prob metrics */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-3 bg-white/[0.01] border border-glass-border/30 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] text-text-secondary uppercase">Scanning Confidence</span>
                          <span className="text-2xl font-extrabold text-neon-blue mt-1 font-mono">{activePreset.confidence}%</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-glass-border/30 rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] text-text-secondary uppercase">Expected R:R Ratio</span>
                          <span className="text-2xl font-extrabold text-neon-purple mt-1 font-mono">1:{activePreset.expectedRR}</span>
                        </div>
                      </div>

                      <ProbabilityBar value={activePreset.probability} label="Setup Hit Probability" className="mt-5" />

                      {/* Detected price action structures */}
                      <div className="mt-6 space-y-2">
                        <span className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider flex items-center gap-1">
                          <Layers size={11} className="text-neon-blue" />
                          Detected Market Structures (SMC)
                        </span>
                        <div className="space-y-2">
                          {activePreset.detectedStructures.map((structure, sIdx) => (
                            <div key={sIdx} className="flex gap-2 text-xs text-text-secondary items-start">
                              <Check size={12} className="text-neon-green mt-0.5 shrink-0" />
                              <span>{structure}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Options contract premium setup card */}
                      <div className="mt-6 p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/15 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted uppercase font-bold">Recommended Contract</span>
                          <span className="text-neon-blue font-extrabold font-mono text-xs">{activePreset.optionContract}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-glass-border/30 text-xs font-mono">
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans">Premium Entry</span>
                            <span className="text-text-primary font-bold">₹{activePreset.optionPremiumEntry.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans">Premium Target</span>
                            <span className="text-neon-green font-bold">₹{activePreset.optionPremiumTarget.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans">Premium Stop Loss</span>
                            <span className="text-neon-red font-bold">₹{activePreset.optionPremiumSL.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-text-secondary block font-sans">Option Delta</span>
                            <span className={cn("font-bold", activePreset.delta >= 0 ? "text-neon-green" : "text-neon-red")}>
                              {activePreset.delta > 0 ? "+" : ""}{activePreset.delta.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 pt-4 border-t border-glass-border/40 flex gap-2">
                      <NeonButton variant="green" className="flex-1 text-xs py-2 shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                        Execute Algo Setup
                      </NeonButton>
                      <NeonButton variant="outline" className="text-xs" onClick={() => setSelectedImage(null)}>
                        Scan Another
                      </NeonButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <GlassCard className="border border-glass-border flex flex-col justify-center items-center text-center p-8 h-full min-h-[350px]" glow="none">
                  <div className="w-12 h-12 rounded-xl bg-neon-blue/5 border border-neon-blue/15 flex items-center justify-center text-neon-blue mb-4">
                    <FileText size={22} className="animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">Analysis Report Queue Empty</h3>
                  <p className="text-[10px] text-text-secondary max-w-xs mt-1.5 leading-relaxed">
                    Select a preset expert chart or upload a screenshot in the visual scanner workspace to generate diagnostic results.
                  </p>
                </GlassCard>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Informative compliance banner */}
        <div className="p-4 rounded-xl bg-neon-amber/5 border border-neon-amber/20 flex gap-3 text-xs text-text-secondary leading-relaxed">
          <AlertCircle size={16} className="text-neon-amber shrink-0 mt-0.5" />
          <div>
            <strong className="text-text-primary">SEBI Compliance & Risk Disclosure:</strong> Trading index and stock options involves substantial financial risk. The Trade Metrix AI Chart Analyzer processes visual data using advanced computer-vision models to identify structures. It does not issue financial tips or recommendations. All trades should be validated according to your personal risk tolerances.
          </div>
        </div>
      </div>
    </div>
  );
}
