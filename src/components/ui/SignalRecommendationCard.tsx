"use client";

import React from "react";
import { TradeRecommendation, getConfidenceColor, getRiskRewardColor, getRecommendationQualityLabel } from "@/lib/ai-recommendation-engine";
import { ChevronRight, Zap, Shield, TrendingUp, TrendingDown } from "lucide-react";

interface SignalRecommendationCardProps {
  recommendation: TradeRecommendation;
  onViewDetails: (rec: TradeRecommendation) => void;
  onPlaceOrder: (rec: TradeRecommendation) => void;
}

export function SignalRecommendationCard({
  recommendation,
  onViewDetails,
  onPlaceOrder,
}: SignalRecommendationCardProps) {
  const isBuy = recommendation.direction === "BUY";
  const directionColor = isBuy ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400";
  const directionBgColor = isBuy ? "bg-emerald-500/20" : "bg-red-500/20";
  const confidenceColor = getConfidenceColor(recommendation.confidence);
  const riskRewardColor = getRiskRewardColor(recommendation.riskReward);
  const qualityLabel = getRecommendationQualityLabel(recommendation.quality);

  return (
    <div className="bg-background border border-text-secondary/20 rounded-lg overflow-hidden hover:border-text-secondary/40 transition-all duration-300 group">
      {/* Header */}
      <div className={`${directionBgColor} px-4 py-3 border-b border-text-secondary/20`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${directionColor} rounded-full p-2`}>
              {isBuy ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <div className="font-bold text-text-primary text-lg">{recommendation.symbol}</div>
              <div className="text-text-secondary text-sm">{recommendation.timeframe} Timeframe</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap size={12} />
              AI Generated
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Direction and Signal */}
        <div className="flex items-center gap-4">
          <div className={`${directionColor} font-bold text-lg px-3 py-1.5 rounded-lg`}>
            {recommendation.direction}
          </div>
          <div className="flex gap-4 flex-1">
            <div className="text-text-secondary text-sm">
              <div className="text-text-secondary/70">Confidence</div>
              <div className={`${confidenceColor} font-bold text-base`}>{recommendation.confidence}%</div>
            </div>
            <div className="text-text-secondary text-sm">
              <div className="text-text-secondary/70">Quality</div>
              <div className="text-emerald-400 font-bold">{qualityLabel}</div>
            </div>
            <div className="text-text-secondary text-sm">
              <div className="text-text-secondary/70">R:R Ratio</div>
              <div className={`${riskRewardColor} font-bold`}>1:{recommendation.riskReward}</div>
            </div>
          </div>
        </div>

        {/* Price Levels */}
        <div className="bg-text-secondary/5 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary/70">Entry Price</span>
            <span className="font-bold text-text-primary">₹{recommendation.entry.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary/70">Stop Loss</span>
            <span className="font-bold text-red-400">₹{recommendation.stopLoss.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary/70">Target 1</span>
            <span className="font-bold text-emerald-400">₹{recommendation.target1.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary/70">Target 2</span>
            <span className="font-bold text-emerald-400">₹{recommendation.target2?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Reasoning - Bullet Points */}
        <div className="space-y-2">
          <div className="text-text-secondary text-xs font-semibold uppercase tracking-wide">Analysis</div>
          <ul className="space-y-1.5">
            {recommendation.reasoning.map((reason, idx) => (
              <li key={idx} className="text-text-secondary/80 text-sm flex gap-2">
                <span className="text-accent mt-1 flex-shrink-0">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Indicators */}
        <div className="space-y-2">
          <div className="text-text-secondary text-xs font-semibold uppercase tracking-wide">Key Indicators</div>
          <div className="flex flex-wrap gap-2">
            {recommendation.indicators.map((indicator, idx) => (
              <div key={idx} className={`${
                indicator.status === "bullish" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
              } text-xs px-2.5 py-1.5 rounded-md font-medium`}>
                {indicator.name}: {indicator.value}
              </div>
            ))}
          </div>
        </div>

        {/* AI Model Info */}
        <div className="flex items-center justify-between text-xs text-text-secondary/70 pt-2 border-t border-text-secondary/10">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span>Generated by {recommendation.aiModel}</span>
          </div>
          <div>
            {new Date(recommendation.timestamp).toLocaleTimeString("en-IN")}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 px-4 py-3 bg-text-secondary/5 border-t border-text-secondary/20">
        <button
          onClick={() => onViewDetails(recommendation)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-text-secondary/10 hover:bg-text-secondary/20 text-text-secondary hover:text-text-primary transition-all duration-200 font-semibold text-sm group-hover:bg-accent/20 group-hover:text-accent"
        >
          View Details
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPlaceOrder(recommendation)}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isBuy
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200"
              : "bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200"
          }`}
        >
          Place {recommendation.direction === "BUY" ? "Buy" : "Sell"} Order
        </button>
      </div>
    </div>
  );
}
