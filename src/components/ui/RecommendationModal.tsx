"use client";

import React from "react";
import { TradeRecommendation, getRecommendationQualityLabel } from "@/lib/ai-recommendation-engine";
import { X, BarChart3, TrendingUp, TrendingDown, Shield, Zap, Clock } from "lucide-react";

interface RecommendationModalProps {
  recommendation: TradeRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onPlaceOrder: (rec: TradeRecommendation) => void;
}

export function RecommendationModal({
  recommendation,
  isOpen,
  onClose,
  onPlaceOrder,
}: RecommendationModalProps) {
  if (!isOpen || !recommendation) return null;

  const isBuy = recommendation.direction === "BUY";
  const qualityLabel = getRecommendationQualityLabel(recommendation.quality);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-text-secondary/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${isBuy ? "bg-emerald-500/10" : "bg-red-500/10"} px-6 py-4 border-b border-text-secondary/20 flex items-center justify-between sticky top-0`}>
          <div className="flex items-center gap-3">
            <div className={`${isBuy ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"} rounded-lg p-2`}>
              {isBuy ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{recommendation.symbol}</h2>
              <p className="text-text-secondary/70 text-sm">{recommendation.timeframe} Timeframe Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-text-secondary/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Badge and Metadata */}
          <div className="bg-text-secondary/5 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">AI Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                <span className="text-sm text-text-secondary/70">{recommendation.aiModel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-secondary/70" />
                <span className="text-sm text-text-secondary/70">
                  {new Date(recommendation.timestamp).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Signal Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className={`${isBuy ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"} border rounded-lg p-3`}>
              <div className="text-text-secondary/70 text-xs font-semibold uppercase mb-1">Signal</div>
              <div className={`${isBuy ? "text-emerald-400" : "text-red-400"} text-lg font-bold`}>
                {recommendation.direction}
              </div>
            </div>
            <div className="bg-text-secondary/5 border border-text-secondary/20 rounded-lg p-3">
              <div className="text-text-secondary/70 text-xs font-semibold uppercase mb-1">Confidence</div>
              <div className="text-accent text-lg font-bold">{recommendation.confidence}%</div>
            </div>
            <div className="bg-text-secondary/5 border border-text-secondary/20 rounded-lg p-3">
              <div className="text-text-secondary/70 text-xs font-semibold uppercase mb-1">Quality</div>
              <div className="text-emerald-400 text-lg font-bold">{qualityLabel}</div>
            </div>
            <div className="bg-text-secondary/5 border border-text-secondary/20 rounded-lg p-3">
              <div className="text-text-secondary/70 text-xs font-semibold uppercase mb-1">R:R Ratio</div>
              <div className="text-yellow-400 text-lg font-bold">1:{recommendation.riskReward}</div>
            </div>
          </div>

          {/* Price Levels */}
          <div className="space-y-3">
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
              <BarChart3 size={16} />
              Price Targets & Risk
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-red-300/70 text-xs font-semibold uppercase mb-2">Stop Loss</div>
                <div className="text-red-400 text-2xl font-bold">
                  ₹{recommendation.stopLoss.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <div className="text-red-300/60 text-xs mt-2">
                  Risk: {((Math.abs(recommendation.entry - recommendation.stopLoss) / recommendation.entry) * 100).toFixed(2)}%
                </div>
              </div>
              <div className={`${isBuy ? "bg-emerald-500/10 border-emerald-500/30" : "bg-blue-500/10 border-blue-500/30"} border rounded-lg p-4`}>
                <div className={isBuy ? "text-emerald-300/70" : "text-blue-300/70"} className="text-xs font-semibold uppercase mb-2">
                  Entry Price
                </div>
                <div className={isBuy ? "text-emerald-400" : "text-blue-400"} className="text-2xl font-bold">
                  ₹{recommendation.entry.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="text-emerald-300/70 text-xs font-semibold uppercase mb-2">Target 1</div>
                <div className="text-emerald-400 text-xl font-bold">
                  ₹{recommendation.target1.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <div className="text-emerald-300/60 text-xs mt-2">
                  +{((((recommendation.target1 - recommendation.entry) / recommendation.entry) * 100)).toFixed(2)}%
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="text-emerald-300/70 text-xs font-semibold uppercase mb-2">Target 2</div>
                <div className="text-emerald-400 text-xl font-bold">
                  ₹{recommendation.target2?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <div className="text-emerald-300/60 text-xs mt-2">
                  +{((((recommendation.target2! - recommendation.entry) / recommendation.entry) * 100)).toFixed(2)}%
                </div>
              </div>
              {recommendation.target3 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <div className="text-emerald-300/70 text-xs font-semibold uppercase mb-2">Target 3</div>
                  <div className="text-emerald-400 text-xl font-bold">
                    ₹{recommendation.target3.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-emerald-300/60 text-xs mt-2">
                    +{((((recommendation.target3 - recommendation.entry) / recommendation.entry) * 100)).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="space-y-3">
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wide">Technical Analysis</h3>
            <div className="bg-text-secondary/5 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-text-secondary/70 text-xs font-semibold uppercase mb-2">Key Indicators</div>
                <div className="flex flex-wrap gap-2">
                  {recommendation.indicators.map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`${
                        indicator.status === "bullish" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      } text-xs px-3 py-1.5 rounded-md font-medium`}
                    >
                      {indicator.name}: {indicator.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-3">
            <h3 className="text-text-secondary text-sm font-semibold uppercase tracking-wide">Analysis Reasoning</h3>
            <ul className="space-y-2">
              {recommendation.reasoning.map((reason, idx) => (
                <li key={idx} className="text-text-secondary/80 text-sm flex gap-3 bg-text-secondary/5 p-3 rounded-lg">
                  <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-text-secondary/20">
            <button
              onClick={() => {
                onPlaceOrder(recommendation);
                onClose();
              }}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                isBuy
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              Place {recommendation.direction === "BUY" ? "Buy" : "Sell"} Order at ₹{recommendation.entry.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
