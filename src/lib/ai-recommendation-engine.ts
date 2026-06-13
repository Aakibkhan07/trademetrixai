// AI Recommendation Engine - Generates AI-based trade recommendations
// This engine simulates AI analysis to provide trading recommendations

export interface TradeRecommendation {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  target1: number;
  target2?: number;
  target3?: number;
  confidence: number; // 0-100
  quality: number; // 0-100
  timeframe: string;
  riskReward: number;
  reasoning: string[];
  indicators: {
    name: string;
    value: string;
    status: "bullish" | "bearish" | "neutral";
  }[];
  timestamp: string;
  expiryTime?: string;
  aiModel: string;
  tags: string[];
}

// Pool of AI models for variety
const AI_MODELS = [
  "GPT-4 Trading Engine",
  "Neural Net V3.2",
  "Quantum Algo 2.0",
  "DeepMind Market AI",
  "Sentinel AI",
];

// Generate recommendations for different symbols
const SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BANKNIFTY", "NIFTY 50"];

// Bullish reasoning patterns
const BULLISH_REASONING = [
  "Golden Cross detected on 4H timeframe with volume confirmation",
  "Price broke above key resistance level with strong momentum",
  "RSI crossed above 50 indicating shift to bullish bias",
  "Volume profile shows accumulation at support level",
  "Ichimoku cloud turned bullish with price above Kumo",
  "Macd histogram turned positive with uptrend acceleration",
  "Supply zone rejection with bullish engulfing pattern",
  "Market structure higher lows with rising trend line break",
];

// Bearish reasoning patterns
const BEARISH_REASONING = [
  "Death Cross detected on 4H timeframe with selling pressure",
  "Price rejected from key resistance with declining volume",
  "RSI divergence showing potential reversal to downside",
  "Distribution phase detected in volume profile",
  "Ichimoku cloud turned bearish with price below Kumo",
  "Macd histogram turned negative with downtrend acceleration",
  "Supply zone rejection with bearish engulfing pattern",
  "Market structure lower highs with broken trend line",
];

// Technical indicators to include
const INDICATORS_POOL = [
  { name: "RSI", values: ["35-45 (Oversold)", "50-60 (Neutral)", "65-75 (Overbought)"] },
  { name: "MACD", values: ["Bullish crossover", "Bearish divergence", "Histogram expansion"] },
  { name: "Bollinger Bands", values: ["Price at lower band", "Mid-band rejection", "Upper band approach"] },
  { name: "Moving Average", values: ["EMA 20 > EMA 50", "EMA 50 > EMA 200", "Price above 200 MA"] },
  { name: "Volume Profile", values: ["High accumulation", "Distribution pattern", "Volume spike"] },
];

export function generateAIRecommendations(count: number = 6): TradeRecommendation[] {
  const recommendations: TradeRecommendation[] = [];
  const symbolIndices = new Set<number>();

  // Ensure variety in symbols
  while (symbolIndices.size < Math.min(count, SYMBOLS.length)) {
    symbolIndices.add(Math.floor(Math.random() * SYMBOLS.length));
  }

  const selectedSymbols = Array.from(symbolIndices).map(i => SYMBOLS[i]);

  selectedSymbols.forEach((symbol, idx) => {
    const direction = Math.random() > 0.5 ? "BUY" : "SELL";
    const confidence = Math.floor(Math.random() * 30 + 65); // 65-95
    const quality = Math.floor(Math.random() * 25 + 70); // 70-95
    const basePrice = Math.floor(Math.random() * 2000 + 1000);

    // Generate prices based on direction
    let entry, stopLoss, target1, target2, target3;

    if (direction === "BUY") {
      entry = basePrice;
      stopLoss = entry * 0.97; // 3% below
      target1 = entry * 1.03; // 3% above
      target2 = entry * 1.05; // 5% above
      target3 = entry * 1.08; // 8% above
    } else {
      entry = basePrice;
      stopLoss = entry * 1.03; // 3% above
      target1 = entry * 0.97; // 3% below
      target2 = entry * 0.95; // 5% below
      target3 = entry * 0.92; // 8% below
    }

    // Calculate risk-reward ratio
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target2 - entry);
    const riskReward = +(reward / risk).toFixed(2);

    // Select reasoning based on direction
    const reasoningPool = direction === "BUY" ? BULLISH_REASONING : BEARISH_REASONING;
    const reasoning = [
      reasoningPool[Math.floor(Math.random() * reasoningPool.length)],
      reasoningPool[Math.floor(Math.random() * reasoningPool.length)],
    ];

    // Generate indicators
    const indicators = INDICATORS_POOL.slice(0, 3).map(indicator => {
      const values = indicator.values;
      return {
        name: indicator.name,
        value: values[Math.floor(Math.random() * values.length)],
        status: direction === "BUY" ? "bullish" : "bearish",
      };
    });

    const now = new Date();
    const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

    recommendations.push({
      id: `ai-rec-${Date.now()}-${idx}`,
      symbol,
      direction,
      entry: +entry.toFixed(2),
      stopLoss: +stopLoss.toFixed(2),
      target1: +target1.toFixed(2),
      target2: +target2.toFixed(2),
      target3: +target3.toFixed(2),
      confidence,
      quality,
      timeframe: ["1H", "4H", "D"][Math.floor(Math.random() * 3)],
      riskReward,
      reasoning,
      indicators,
      timestamp: now.toISOString(),
      expiryTime: expiryTime.toISOString(),
      aiModel: AI_MODELS[Math.floor(Math.random() * AI_MODELS.length)],
      tags: direction === "BUY" ? ["Bullish", "Momentum"] : ["Bearish", "Reversal"],
    });
  });

  return recommendations;
}

export function getRecommendationQualityLabel(quality: number): string {
  if (quality >= 85) return "Excellent";
  if (quality >= 75) return "Good";
  if (quality >= 65) return "Moderate";
  return "Fair";
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-green-500";
  if (confidence >= 70) return "text-emerald-400";
  if (confidence >= 60) return "text-yellow-500";
  return "text-orange-500";
}

export function getRiskRewardColor(riskReward: number): string {
  if (riskReward >= 2) return "text-green-500";
  if (riskReward >= 1.5) return "text-emerald-400";
  if (riskReward >= 1) return "text-yellow-500";
  return "text-orange-500";
}
