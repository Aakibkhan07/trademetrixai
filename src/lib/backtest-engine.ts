// ============================================================
// TRADE METRIX AI — Real Backtesting Engine
// ============================================================
// Evaluates strategies against historical OHLCV data.
// Computes equity curve, drawdown, Sharpe, win rate, etc.
// ============================================================

import {
  computeRSI,
  computeEMA,
  computeMACD,
  computeVWAP,
  computeBollingerBands,
  computeATR,
  computeAvgVolume,
  type OHLCV,
} from "./signal-engine";

// ---- Strategy Definition ----

export interface Condition {
  indicator: "RSI" | "EMA_CROSS" | "MACD_CROSS" | "PRICE_VS_VWAP" | "VOLUME_SPIKE" | "BOLLINGER_BREAK" | "PRICE_VS_EMA";
  operator: "ABOVE" | "BELOW" | "CROSSES_ABOVE" | "CROSSES_BELOW";
  value?: number;
  params?: Record<string, number>;
}

export interface ConditionGroup {
  logic: "AND" | "OR";
  conditions: Condition[];
}

export interface StrategyDefinition {
  name: string;
  conditions: {
    entryLong: ConditionGroup;
    exitLong: ConditionGroup;
    entryShort?: ConditionGroup;
    exitShort?: ConditionGroup;
  };
  riskManagement: {
    stopLossPercent: number;
    targetPercent: number;
    trailingStopPercent?: number;
    maxPositionSize: number;
  };
}

// ---- Backtest Results ----

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  exitReason: "TARGET" | "STOPLOSS" | "TRAILING_STOP" | "SIGNAL_EXIT" | "END_OF_DATA";
  holdingBars: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  avgHoldingBars: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  initialCapital: number;
  finalCapital: number;
}

// ---- Precomputed Indicator Arrays ----

interface IndicatorArrays {
  rsi: number[];
  ema9: number[];
  ema21: number[];
  ema50: number[];
  vwap: number[];
  macdValue: number[];
  macdSignal: number[];
  macdHistogram: number[];
  bbUpper: number[];
  bbMiddle: number[];
  bbLower: number[];
  atr: number[];
  avgVolume: number[];
  closes: number[];
  volumes: number[];
}

function precomputeIndicators(data: OHLCV[]): IndicatorArrays {
  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);

  const rsi = computeRSI(closes, 14);
  const ema9 = computeEMA(closes, 9);
  const ema21 = computeEMA(closes, 21);
  const ema50 = computeEMA(closes, 50);
  const vwap = computeVWAP(data);
  const macd = computeMACD(closes);
  const bb = computeBollingerBands(closes);
  const atr = computeATR(data);
  const avgVolume = computeAvgVolume(volumes);

  return {
    rsi,
    ema9,
    ema21,
    ema50,
    vwap,
    macdValue: macd.value,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    atr,
    avgVolume,
    closes,
    volumes,
  };
}

// ---- Condition Evaluator ----

function evaluateCondition(
  cond: Condition,
  idx: number,
  ind: IndicatorArrays
): boolean {
  switch (cond.indicator) {
    case "RSI": {
      const rsi = ind.rsi[idx];
      if (isNaN(rsi)) return false;
      const threshold = cond.value ?? 50;
      if (cond.operator === "ABOVE") return rsi > threshold;
      if (cond.operator === "BELOW") return rsi < threshold;
      if (cond.operator === "CROSSES_ABOVE") return idx > 0 && ind.rsi[idx - 1] <= threshold && rsi > threshold;
      if (cond.operator === "CROSSES_BELOW") return idx > 0 && ind.rsi[idx - 1] >= threshold && rsi < threshold;
      return false;
    }

    case "EMA_CROSS": {
      const fast = ind.ema9[idx];
      const slow = ind.ema21[idx];
      if (isNaN(fast) || isNaN(slow)) return false;
      if (cond.operator === "CROSSES_ABOVE") return idx > 0 && ind.ema9[idx - 1] <= ind.ema21[idx - 1] && fast > slow;
      if (cond.operator === "CROSSES_BELOW") return idx > 0 && ind.ema9[idx - 1] >= ind.ema21[idx - 1] && fast < slow;
      if (cond.operator === "ABOVE") return fast > slow;
      if (cond.operator === "BELOW") return fast < slow;
      return false;
    }

    case "MACD_CROSS": {
      const h = ind.macdHistogram[idx];
      const ph = ind.macdHistogram[idx - 1];
      if (isNaN(h) || isNaN(ph)) return false;
      if (cond.operator === "CROSSES_ABOVE") return ph <= 0 && h > 0;
      if (cond.operator === "CROSSES_BELOW") return ph >= 0 && h < 0;
      if (cond.operator === "ABOVE") return h > 0;
      if (cond.operator === "BELOW") return h < 0;
      return false;
    }

    case "PRICE_VS_VWAP": {
      const price = ind.closes[idx];
      const vwap = ind.vwap[idx];
      if (isNaN(vwap)) return false;
      if (cond.operator === "ABOVE") return price > vwap;
      if (cond.operator === "BELOW") return price < vwap;
      if (cond.operator === "CROSSES_ABOVE") return idx > 0 && ind.closes[idx - 1] <= ind.vwap[idx - 1] && price > vwap;
      if (cond.operator === "CROSSES_BELOW") return idx > 0 && ind.closes[idx - 1] >= ind.vwap[idx - 1] && price < vwap;
      return false;
    }

    case "PRICE_VS_EMA": {
      const price = ind.closes[idx];
      const ema = ind.ema50[idx];
      if (isNaN(ema)) return false;
      if (cond.operator === "ABOVE") return price > ema;
      if (cond.operator === "BELOW") return price < ema;
      if (cond.operator === "CROSSES_ABOVE") return idx > 0 && ind.closes[idx - 1] <= ind.ema50[idx - 1] && price > ema;
      if (cond.operator === "CROSSES_BELOW") return idx > 0 && ind.closes[idx - 1] >= ind.ema50[idx - 1] && price < ema;
      return false;
    }

    case "VOLUME_SPIKE": {
      const vol = ind.volumes[idx];
      const avg = ind.avgVolume[idx];
      if (isNaN(avg) || avg === 0) return false;
      const ratio = vol / avg;
      const threshold = cond.value ?? 1.5;
      if (cond.operator === "ABOVE") return ratio > threshold;
      if (cond.operator === "BELOW") return ratio < threshold;
      return false;
    }

    case "BOLLINGER_BREAK": {
      const price = ind.closes[idx];
      const upper = ind.bbUpper[idx];
      const lower = ind.bbLower[idx];
      if (isNaN(upper) || isNaN(lower)) return false;
      if (cond.operator === "ABOVE") return price > upper;
      if (cond.operator === "BELOW") return price < lower;
      if (cond.operator === "CROSSES_ABOVE") return idx > 0 && ind.closes[idx - 1] <= ind.bbUpper[idx - 1] && price > upper;
      if (cond.operator === "CROSSES_BELOW") return idx > 0 && ind.closes[idx - 1] >= ind.bbLower[idx - 1] && price < lower;
      return false;
    }

    default:
      return false;
  }
}

function evaluateConditionGroup(
  group: ConditionGroup,
  idx: number,
  ind: IndicatorArrays
): boolean {
  if (group.conditions.length === 0) return false;

  if (group.logic === "AND") {
    return group.conditions.every((c) => evaluateCondition(c, idx, ind));
  } else {
    return group.conditions.some((c) => evaluateCondition(c, idx, ind));
  }
}

// ============================================================
// MAIN BACKTEST FUNCTION
// ============================================================

export function runBacktest(
  data: OHLCV[],
  strategy: StrategyDefinition,
  initialCapital = 100000
): BacktestResult {
  const ind = precomputeIndicators(data);
  const startIdx = 55; // Enough warm-up for all indicators

  let capital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  let inPosition = false;
  let posDirection: "LONG" | "SHORT" = "LONG";
  let entryPrice = 0;
  let entryIdx = 0;
  let stopLossPrice = 0;
  let targetPrice = 0;
  let trailingStop = 0;
  let posQuantity = 0;

  for (let i = startIdx; i < data.length; i++) {
    const bar = data[i];
    const date = new Date(bar.timestamp * 1000).toISOString().split("T")[0];
    const price = bar.close;

    if (inPosition) {
      // Check SL/Target
      let exitReason: BacktestTrade["exitReason"] | null = null;
      let exitPrice = price;

      if (posDirection === "LONG") {
        // Update trailing stop
        if (strategy.riskManagement.trailingStopPercent) {
          const newTrail = price * (1 - strategy.riskManagement.trailingStopPercent / 100);
          if (newTrail > trailingStop) trailingStop = newTrail;
          if (bar.low <= trailingStop) {
            exitReason = "TRAILING_STOP";
            exitPrice = trailingStop;
          }
        }

        if (!exitReason && bar.low <= stopLossPrice) {
          exitReason = "STOPLOSS";
          exitPrice = stopLossPrice;
        }
        if (!exitReason && bar.high >= targetPrice) {
          exitReason = "TARGET";
          exitPrice = targetPrice;
        }
        if (!exitReason && strategy.conditions.exitLong && evaluateConditionGroup(strategy.conditions.exitLong, i, ind)) {
          exitReason = "SIGNAL_EXIT";
          exitPrice = price;
        }
      } else {
        if (strategy.riskManagement.trailingStopPercent) {
          const newTrail = price * (1 + strategy.riskManagement.trailingStopPercent / 100);
          if (newTrail < trailingStop || trailingStop === 0) trailingStop = newTrail;
          if (bar.high >= trailingStop) {
            exitReason = "TRAILING_STOP";
            exitPrice = trailingStop;
          }
        }

        if (!exitReason && bar.high >= stopLossPrice) {
          exitReason = "STOPLOSS";
          exitPrice = stopLossPrice;
        }
        if (!exitReason && bar.low <= targetPrice) {
          exitReason = "TARGET";
          exitPrice = targetPrice;
        }
        if (!exitReason && strategy.conditions.exitShort && evaluateConditionGroup(strategy.conditions.exitShort, i, ind)) {
          exitReason = "SIGNAL_EXIT";
          exitPrice = price;
        }
      }

      if (exitReason) {
        const pnl = posDirection === "LONG"
          ? (exitPrice - entryPrice) * posQuantity
          : (entryPrice - exitPrice) * posQuantity;
        const pnlPercent = (pnl / (entryPrice * posQuantity)) * 100;

        capital += pnl;
        trades.push({
          entryDate: new Date(data[entryIdx].timestamp * 1000).toISOString(),
          exitDate: new Date(bar.timestamp * 1000).toISOString(),
          direction: posDirection,
          entryPrice,
          exitPrice,
          quantity: posQuantity,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          exitReason,
          holdingBars: i - entryIdx,
        });
        inPosition = false;
      }
    } else {
      // Check entry conditions
      if (evaluateConditionGroup(strategy.conditions.entryLong, i, ind)) {
        inPosition = true;
        posDirection = "LONG";
        entryPrice = price;
        entryIdx = i;
        posQuantity = Math.max(1, Math.floor(
          (capital * strategy.riskManagement.maxPositionSize / 100) / price
        ));
        stopLossPrice = price * (1 - strategy.riskManagement.stopLossPercent / 100);
        targetPrice = price * (1 + strategy.riskManagement.targetPercent / 100);
        trailingStop = strategy.riskManagement.trailingStopPercent
          ? price * (1 - strategy.riskManagement.trailingStopPercent / 100)
          : 0;
      } else if (
        strategy.conditions.entryShort &&
        evaluateConditionGroup(strategy.conditions.entryShort, i, ind)
      ) {
        inPosition = true;
        posDirection = "SHORT";
        entryPrice = price;
        entryIdx = i;
        posQuantity = Math.max(1, Math.floor(
          (capital * strategy.riskManagement.maxPositionSize / 100) / price
        ));
        stopLossPrice = price * (1 + strategy.riskManagement.stopLossPercent / 100);
        targetPrice = price * (1 - strategy.riskManagement.targetPercent / 100);
        trailingStop = strategy.riskManagement.trailingStopPercent
          ? price * (1 + strategy.riskManagement.trailingStopPercent / 100)
          : 0;
      }
    }

    // Track equity curve
    if (peakCapital < capital) peakCapital = capital;
    const drawdown = peakCapital - capital;
    const drawdownPercent = peakCapital > 0 ? (drawdown / peakCapital) * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    if (drawdownPercent > maxDrawdownPercent) maxDrawdownPercent = drawdownPercent;

    equityCurve.push({
      date,
      equity: Number(capital.toFixed(2)),
      drawdown: Number(drawdownPercent.toFixed(2)),
    });
  }

  // Close any remaining position at end of data
  if (inPosition) {
    const lastBar = data[data.length - 1];
    const exitPrice = lastBar.close;
    const pnl = posDirection === "LONG"
      ? (exitPrice - entryPrice) * posQuantity
      : (entryPrice - exitPrice) * posQuantity;
    const pnlPercent = (pnl / (entryPrice * posQuantity)) * 100;
    capital += pnl;

    trades.push({
      entryDate: new Date(data[entryIdx].timestamp * 1000).toISOString(),
      exitDate: new Date(lastBar.timestamp * 1000).toISOString(),
      direction: posDirection,
      entryPrice,
      exitPrice,
      quantity: posQuantity,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      exitReason: "END_OF_DATA",
      holdingBars: data.length - 1 - entryIdx,
    });
  }

  // Compute stats
  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl <= 0);
  const totalWins = winningTrades.reduce((s, t) => s + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

  // Streaks
  let winStreak = 0, loseStreak = 0, maxWinStreak = 0, maxLoseStreak = 0;
  for (const t of trades) {
    if (t.pnl > 0) { winStreak++; loseStreak = 0; }
    else { loseStreak++; winStreak = 0; }
    if (winStreak > maxWinStreak) maxWinStreak = winStreak;
    if (loseStreak > maxLoseStreak) maxLoseStreak = loseStreak;
  }

  // Sharpe ratio (annualized, assuming ~252 trading days)
  const returns = trades.map((t) => t.pnlPercent / 100);
  const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
  const stdReturn = returns.length > 1
    ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1))
    : 0;
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    strategyName: strategy.name,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0,
    totalPnl: Number((capital - initialCapital).toFixed(2)),
    totalPnlPercent: Number((((capital - initialCapital) / initialCapital) * 100).toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    avgWin: winningTrades.length > 0 ? Number((totalWins / winningTrades.length).toFixed(2)) : 0,
    avgLoss: losingTrades.length > 0 ? Number((totalLosses / losingTrades.length).toFixed(2)) : 0,
    avgHoldingBars: trades.length > 0 ? Number((trades.reduce((s, t) => s + t.holdingBars, 0) / trades.length).toFixed(1)) : 0,
    longestWinStreak: maxWinStreak,
    longestLoseStreak: maxLoseStreak,
    trades,
    equityCurve,
    initialCapital,
    finalCapital: Number(capital.toFixed(2)),
  };
}

// ---- Preset Strategies ----

export const PRESET_STRATEGIES: StrategyDefinition[] = [
  {
    name: "EMA Crossover + Volume",
    conditions: {
      entryLong: {
        logic: "AND",
        conditions: [
          { indicator: "EMA_CROSS", operator: "CROSSES_ABOVE" },
          { indicator: "VOLUME_SPIKE", operator: "ABOVE", value: 1.2 },
          { indicator: "RSI", operator: "BELOW", value: 65 },
        ],
      },
      exitLong: {
        logic: "OR",
        conditions: [
          { indicator: "EMA_CROSS", operator: "CROSSES_BELOW" },
          { indicator: "RSI", operator: "ABOVE", value: 75 },
        ],
      },
    },
    riskManagement: {
      stopLossPercent: 1.5,
      targetPercent: 3,
      trailingStopPercent: 1,
      maxPositionSize: 20,
    },
  },
  {
    name: "RSI Mean Reversion",
    conditions: {
      entryLong: {
        logic: "AND",
        conditions: [
          { indicator: "RSI", operator: "CROSSES_ABOVE", value: 30 },
          { indicator: "BOLLINGER_BREAK", operator: "BELOW" },
        ],
      },
      exitLong: {
        logic: "OR",
        conditions: [
          { indicator: "RSI", operator: "ABOVE", value: 60 },
          { indicator: "PRICE_VS_VWAP", operator: "ABOVE" },
        ],
      },
    },
    riskManagement: {
      stopLossPercent: 2,
      targetPercent: 4,
      maxPositionSize: 15,
    },
  },
  {
    name: "VWAP Momentum",
    conditions: {
      entryLong: {
        logic: "AND",
        conditions: [
          { indicator: "PRICE_VS_VWAP", operator: "CROSSES_ABOVE" },
          { indicator: "MACD_CROSS", operator: "ABOVE" },
          { indicator: "VOLUME_SPIKE", operator: "ABOVE", value: 1.3 },
        ],
      },
      exitLong: {
        logic: "OR",
        conditions: [
          { indicator: "PRICE_VS_VWAP", operator: "CROSSES_BELOW" },
          { indicator: "MACD_CROSS", operator: "CROSSES_BELOW" },
        ],
      },
      entryShort: {
        logic: "AND",
        conditions: [
          { indicator: "PRICE_VS_VWAP", operator: "CROSSES_BELOW" },
          { indicator: "MACD_CROSS", operator: "BELOW" },
          { indicator: "VOLUME_SPIKE", operator: "ABOVE", value: 1.3 },
        ],
      },
      exitShort: {
        logic: "OR",
        conditions: [
          { indicator: "PRICE_VS_VWAP", operator: "CROSSES_ABOVE" },
          { indicator: "MACD_CROSS", operator: "CROSSES_ABOVE" },
        ],
      },
    },
    riskManagement: {
      stopLossPercent: 1,
      targetPercent: 2.5,
      trailingStopPercent: 0.8,
      maxPositionSize: 25,
    },
  },
];
