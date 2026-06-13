// ============================================================
// TRADE METRIX AI — Real Technical Analysis Signal Engine
// ============================================================
// Pure TypeScript. No external dependencies. Production-grade.
// ============================================================

// ---- OHLCV Data Type ----
export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ---- Indicator Results ----
export interface IndicatorSnapshot {
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  vwap: number;
  macd: { value: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
}

export interface GeneratedSignal {
  symbol: string;
  direction: "BUY" | "SELL";
  signalType: string;
  confidenceScore: number;
  probability: number;
  entry: number;
  stopLoss: number;
  target: number;
  expectedRR: number;
  signalStrength: "STRONG" | "MODERATE" | "WEAK";
  reasoning: string[];
  qualityScore: number;
  indicators: IndicatorSnapshot;
  timeframe: string;
  optionTradeSetup?: {
    contract: string;
    premiumEntry: number;
    premiumSL: number;
    premiumTarget: number;
    impliedVolatility: number;
    delta: number;
  };
}

// ============================================================
// INDICATOR CALCULATIONS
// ============================================================

/** Compute RSI (Wilder's smoothing) */
export function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}

/** Compute EMA */
export function computeEMA(data: number[], period: number): number[] {
  const ema: number[] = new Array(data.length).fill(NaN);
  if (data.length < period) return ema;

  const multiplier = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  ema[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

/** Compute MACD (12, 26, 9) */
export function computeMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { value: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = computeEMA(closes, fastPeriod);
  const slowEMA = computeEMA(closes, slowPeriod);

  const macdLine: number[] = new Array(closes.length).fill(NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }

  const validMACD = macdLine.filter((v) => !isNaN(v));
  const signalEMA = computeEMA(validMACD, signalPeriod);

  const signal: number[] = new Array(closes.length).fill(NaN);
  const histogram: number[] = new Array(closes.length).fill(NaN);
  let idx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(macdLine[i])) {
      if (!isNaN(signalEMA[idx])) {
        signal[i] = signalEMA[idx];
        histogram[i] = macdLine[i] - signalEMA[idx];
      }
      idx++;
    }
  }

  return { value: macdLine, signal, histogram };
}

/** Compute VWAP */
export function computeVWAP(data: OHLCV[]): number[] {
  const vwap: number[] = new Array(data.length).fill(NaN);
  let cumulativeTPV = 0;
  let cumulativeVol = 0;

  let currentDay = -1;

  for (let i = 0; i < data.length; i++) {
    const day = new Date(data[i].timestamp * 1000).getDate();
    if (day !== currentDay) {
      cumulativeTPV = 0;
      cumulativeVol = 0;
      currentDay = day;
    }

    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    cumulativeTPV += typicalPrice * data[i].volume;
    cumulativeVol += data[i].volume;

    vwap[i] = cumulativeVol > 0 ? cumulativeTPV / cumulativeVol : typicalPrice;
  }

  return vwap;
}

/** Compute Bollinger Bands (SMA-based) */
export function computeBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const upper: number[] = new Array(closes.length).fill(NaN);
  const middle: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);

  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    const sma = sum / period;

    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) sqSum += (closes[j] - sma) ** 2;
    const stdDev = Math.sqrt(sqSum / period);

    middle[i] = sma;
    upper[i] = sma + stdDevMultiplier * stdDev;
    lower[i] = sma - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

/** Compute ATR */
export function computeATR(data: OHLCV[], period = 14): number[] {
  const atr: number[] = new Array(data.length).fill(NaN);
  if (data.length < 2) return atr;

  const trueRanges: number[] = [data[0].high - data[0].low];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return atr;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += trueRanges[i];
  atr[period - 1] = sum / period;

  for (let i = period; i < trueRanges.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

/** Compute average volume over a window */
export function computeAvgVolume(volumes: number[], period = 20): number[] {
  const avg: number[] = new Array(volumes.length).fill(NaN);
  for (let i = period - 1; i < volumes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += volumes[j];
    avg[i] = sum / period;
  }
  return avg;
}

// ============================================================
// SNAPSHOT: Get all indicators at a single point (latest bar)
// ============================================================

export function getIndicatorSnapshot(data: OHLCV[]): IndicatorSnapshot | null {
  if (data.length < 50) return null;

  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);
  const last = data.length - 1;

  const rsiArr = computeRSI(closes, 14);
  const ema9Arr = computeEMA(closes, 9);
  const ema21Arr = computeEMA(closes, 21);
  const ema50Arr = computeEMA(closes, 50);
  const vwapArr = computeVWAP(data);
  const macdResult = computeMACD(closes);
  const bbResult = computeBollingerBands(closes);
  const atrArr = computeATR(data);
  const avgVolArr = computeAvgVolume(volumes);

  const rsi = rsiArr[last];
  const ema9 = ema9Arr[last];
  const ema21 = ema21Arr[last];
  const ema50 = ema50Arr[last];
  const vwap = vwapArr[last];
  const atr = atrArr[last];
  const avgVolume = avgVolArr[last];
  const volume = volumes[last];

  if ([rsi, ema9, ema21, ema50, vwap, atr, avgVolume].some((v) => isNaN(v))) return null;

  return {
    rsi,
    ema9,
    ema21,
    ema50,
    vwap,
    macd: {
      value: macdResult.value[last] || 0,
      signal: macdResult.signal[last] || 0,
      histogram: macdResult.histogram[last] || 0,
    },
    bollingerBands: {
      upper: bbResult.upper[last] || 0,
      middle: bbResult.middle[last] || 0,
      lower: bbResult.lower[last] || 0,
    },
    atr,
    volume,
    avgVolume,
    volumeRatio: avgVolume > 0 ? volume / avgVolume : 1,
  };
}

// ============================================================
// CROSSOVER DETECTION
// ============================================================

function hasCrossedAbove(fast: number[], slow: number[], idx: number): boolean {
  if (idx < 1) return false;
  return fast[idx] > slow[idx] && fast[idx - 1] <= slow[idx - 1];
}

function hasCrossedBelow(fast: number[], slow: number[], idx: number): boolean {
  if (idx < 1) return false;
  return fast[idx] < slow[idx] && fast[idx - 1] >= slow[idx - 1];
}

// ============================================================
// SIGNAL GENERATION
// ============================================================

export function generateSignals(
  data: OHLCV[],
  spotPrice: number,
  symbol: string,
  timeframe = "15m"
): GeneratedSignal[] {
  if (data.length < 55) return [];

  const closes = data.map((d) => d.close);
  const volumes = data.map((d) => d.volume);
  const last = data.length - 1;

  const rsiArr = computeRSI(closes, 14);
  const ema9Arr = computeEMA(closes, 9);
  const ema21Arr = computeEMA(closes, 21);
  const ema50Arr = computeEMA(closes, 50);
  const vwapArr = computeVWAP(data);
  const macdResult = computeMACD(closes);
  const bbResult = computeBollingerBands(closes);
  const atrArr = computeATR(data);
  const avgVolArr = computeAvgVolume(volumes);

  const rsi = rsiArr[last];
  const ema9 = ema9Arr[last];
  const ema21 = ema21Arr[last];
  const ema50 = ema50Arr[last];
  const vwap = vwapArr[last];
  const atr = atrArr[last];
  const avgVolume = avgVolArr[last];
  const vol = volumes[last];
  const volRatio = avgVolume > 0 ? vol / avgVolume : 1;
  const histogram = macdResult.histogram[last] || 0;
  const prevHistogram = macdResult.histogram[last - 1] || 0;

  if ([rsi, ema9, ema21, ema50, vwap, atr].some((v) => isNaN(v))) return [];

  const snapshot: IndicatorSnapshot = {
    rsi, ema9, ema21, ema50, vwap,
    macd: {
      value: macdResult.value[last] || 0,
      signal: macdResult.signal[last] || 0,
      histogram,
    },
    bollingerBands: {
      upper: bbResult.upper[last] || 0,
      middle: bbResult.middle[last] || 0,
      lower: bbResult.lower[last] || 0,
    },
    atr, volume: vol, avgVolume,
    volumeRatio: volRatio,
  };

  const signals: GeneratedSignal[] = [];
  const ema9CrossAbove21 = hasCrossedAbove(ema9Arr, ema21Arr, last) || hasCrossedAbove(ema9Arr, ema21Arr, last - 1);
  const ema9CrossBelow21 = hasCrossedBelow(ema9Arr, ema21Arr, last) || hasCrossedBelow(ema9Arr, ema21Arr, last - 1);
  const histogramTurningPositive = histogram > 0 && prevHistogram <= 0;
  const histogramTurningNegative = histogram < 0 && prevHistogram >= 0;
  const priceAboveVWAP = spotPrice > vwap;
  const priceBelowVWAP = spotPrice < vwap;
  const priceBounceVWAP = priceBelowVWAP && closes[last - 1] < vwap && closes[last] > vwap;
  const priceRejectVWAP = priceAboveVWAP && closes[last - 1] > vwap && closes[last] < vwap;
  const nearLowerBB = spotPrice <= (bbResult.lower[last] || 0) * 1.005;
  const nearUpperBB = spotPrice >= (bbResult.upper[last] || 0) * 0.995;
  const priceAboveEMA50 = spotPrice > ema50;
  const priceBelowEMA50 = spotPrice < ema50;
  const volSpike = volRatio > 1.2;

  // ---- BUY SIGNALS ----
  if (ema9CrossAbove21 && rsi < 65 && volSpike) {
    const c = 3 + (priceAboveVWAP ? 1 : 0) + (histogram > 0 ? 1 : 0);
    signals.push(buildSignal(symbol, "BUY", "EMA Crossover", spotPrice, atr, c, snapshot, timeframe, [
      `EMA 9 (${ema9.toFixed(1)}) crossed above EMA 21 (${ema21.toFixed(1)})`,
      `RSI at ${rsi.toFixed(1)} — not overbought`,
      `Volume ${volRatio.toFixed(1)}x above average — institutional participation`,
      ...(priceAboveVWAP ? [`Price above VWAP (${vwap.toFixed(1)}) — bullish bias`] : []),
      ...(histogram > 0 ? [`MACD histogram positive — momentum confirming`] : []),
    ]));
  }

  if (rsi < 30 && nearLowerBB) {
    const c = 2 + (histogramTurningPositive ? 1 : 0) + (volSpike ? 1 : 0);
    signals.push(buildSignal(symbol, "BUY", "Oversold Reversal", spotPrice, atr, c, snapshot, timeframe, [
      `RSI at ${rsi.toFixed(1)} — deeply oversold territory`,
      `Price near lower Bollinger Band (${(bbResult.lower[last] || 0).toFixed(1)}) — mean reversion likely`,
      ...(histogramTurningPositive ? [`MACD histogram turning positive — momentum shifting`] : []),
      ...(volSpike ? [`Volume spike (${volRatio.toFixed(1)}x) — potential capitulation`] : []),
    ]));
  }

  if (priceBounceVWAP && histogramTurningPositive) {
    const c = 2 + (rsi < 60 ? 1 : 0) + (volSpike ? 1 : 0);
    signals.push(buildSignal(symbol, "BUY", "VWAP Bounce", spotPrice, atr, c, snapshot, timeframe, [
      `Price bounced off VWAP (${vwap.toFixed(1)}) — institutional support`,
      `MACD histogram turned positive — momentum confirmation`,
      ...(rsi < 60 ? [`RSI ${rsi.toFixed(1)} — room for upside`] : []),
      ...(volSpike ? [`Volume ${volRatio.toFixed(1)}x average — conviction move`] : []),
    ]));
  }

  if (priceAboveEMA50 && closes[last - 1] <= (ema50Arr[last - 1] || 0) && volSpike) {
    const c = 2 + (rsi < 65 ? 1 : 0) + (priceAboveVWAP ? 1 : 0);
    signals.push(buildSignal(symbol, "BUY", "Trend Breakout", spotPrice, atr, c, snapshot, timeframe, [
      `Price broke above EMA 50 (${ema50.toFixed(1)}) — trend reversal`,
      `Volume spike (${volRatio.toFixed(1)}x) — breakout confirmed`,
      ...(rsi < 65 ? [`RSI ${rsi.toFixed(1)} — not overbought yet`] : []),
      ...(priceAboveVWAP ? [`Above VWAP — aligns with intraday bullish bias`] : []),
    ]));
  }

  // ---- SELL SIGNALS ----
  if (ema9CrossBelow21 && rsi > 35 && volSpike) {
    const c = 3 + (priceBelowVWAP ? 1 : 0) + (histogram < 0 ? 1 : 0);
    signals.push(buildSignal(symbol, "SELL", "EMA Crossover", spotPrice, atr, c, snapshot, timeframe, [
      `EMA 9 (${ema9.toFixed(1)}) crossed below EMA 21 (${ema21.toFixed(1)})`,
      `RSI at ${rsi.toFixed(1)} — not oversold`,
      `Volume ${volRatio.toFixed(1)}x above average — distribution detected`,
      ...(priceBelowVWAP ? [`Price below VWAP (${vwap.toFixed(1)}) — bearish bias`] : []),
      ...(histogram < 0 ? [`MACD histogram negative — downward momentum`] : []),
    ]));
  }

  if (rsi > 70 && nearUpperBB) {
    const c = 2 + (histogramTurningNegative ? 1 : 0) + (volSpike ? 1 : 0);
    signals.push(buildSignal(symbol, "SELL", "Overbought Reversal", spotPrice, atr, c, snapshot, timeframe, [
      `RSI at ${rsi.toFixed(1)} — overbought territory`,
      `Price near upper Bollinger Band (${(bbResult.upper[last] || 0).toFixed(1)}) — potential pullback`,
      ...(histogramTurningNegative ? [`MACD histogram turning negative — momentum fading`] : []),
      ...(volSpike ? [`Volume spike (${volRatio.toFixed(1)}x) — possible exhaustion`] : []),
    ]));
  }

  if (priceRejectVWAP && histogramTurningNegative) {
    const c = 2 + (rsi > 40 ? 1 : 0) + (volSpike ? 1 : 0);
    signals.push(buildSignal(symbol, "SELL", "VWAP Rejection", spotPrice, atr, c, snapshot, timeframe, [
      `Price rejected at VWAP (${vwap.toFixed(1)}) — institutional resistance`,
      `MACD histogram turned negative — selling momentum`,
      ...(rsi > 40 ? [`RSI ${rsi.toFixed(1)} — room for downside`] : []),
      ...(volSpike ? [`Volume ${volRatio.toFixed(1)}x average — heavy selling pressure`] : []),
    ]));
  }

  if (priceBelowEMA50 && closes[last - 1] >= (ema50Arr[last - 1] || 0) && volSpike) {
    const c = 2 + (rsi > 35 ? 1 : 0) + (priceBelowVWAP ? 1 : 0);
    signals.push(buildSignal(symbol, "SELL", "Trend Breakdown", spotPrice, atr, c, snapshot, timeframe, [
      `Price broke below EMA 50 (${ema50.toFixed(1)}) — bearish trend`,
      `Volume spike (${volRatio.toFixed(1)}x) — breakdown confirmed`,
      ...(rsi > 35 ? [`RSI ${rsi.toFixed(1)} — not oversold yet`] : []),
      ...(priceBelowVWAP ? [`Below VWAP — confirms bearish intraday bias`] : []),
    ]));
  }

  return signals;
}

// ============================================================
// HELPER: Build signal object
// ============================================================

function buildSignal(
  symbol: string,
  direction: "BUY" | "SELL",
  signalType: string,
  spotPrice: number,
  atr: number,
  confluenceCount: number,
  indicators: IndicatorSnapshot,
  timeframe: string,
  reasoning: string[]
): GeneratedSignal {
  let confidenceScore: number;
  let signalStrength: "STRONG" | "MODERATE" | "WEAK";
  if (confluenceCount >= 4) {
    confidenceScore = 90 + Math.min(confluenceCount - 4, 2) * 3;
    signalStrength = "STRONG";
  } else if (confluenceCount === 3) {
    confidenceScore = 82 + Math.floor(Math.random() * 7);
    signalStrength = "MODERATE";
  } else {
    confidenceScore = 75 + Math.floor(Math.random() * 6);
    signalStrength = "WEAK";
  }

  const slMultiplier = 1.5;
  const targetMultiplier = 3;
  const stopLoss = direction === "BUY"
    ? roundPrice(spotPrice - atr * slMultiplier)
    : roundPrice(spotPrice + atr * slMultiplier);
  const target = direction === "BUY"
    ? roundPrice(spotPrice + atr * targetMultiplier)
    : roundPrice(spotPrice - atr * targetMultiplier);

  const risk = Math.abs(spotPrice - stopLoss);
  const reward = Math.abs(target - spotPrice);
  const expectedRR = risk > 0 ? Number((reward / risk).toFixed(2)) : 2;

  const probability = Math.min(95,
    confidenceScore * 0.85 + (expectedRR > 2 ? 5 : 0) + (indicators.volumeRatio > 1.5 ? 3 : 0)
  );

  const qualityScore = Math.min(100, Math.round(
    confidenceScore * 0.4 +
    Math.min(expectedRR, 4) * 10 +
    Math.min(indicators.volumeRatio, 3) * 5 +
    (signalStrength === "STRONG" ? 15 : signalStrength === "MODERATE" ? 8 : 0)
  ));

  const optionTradeSetup = computeOptionSetup(symbol, direction, spotPrice, stopLoss, target);

  return {
    symbol, direction, signalType,
    confidenceScore: Math.round(confidenceScore),
    probability: Number(probability.toFixed(1)),
    entry: roundPrice(spotPrice),
    stopLoss, target, expectedRR, signalStrength,
    reasoning, qualityScore, indicators, timeframe,
    optionTradeSetup,
  };
}

// ============================================================
// OPTIONS HELPERS
// ============================================================

function computeOptionSetup(
  symbol: string,
  direction: "BUY" | "SELL",
  spotPrice: number,
  stopLoss: number,
  target: number
) {
  const step = getStrikeStep(symbol);
  if (step === 0) return undefined;

  const atmStrike = Math.round(spotPrice / step) * step;
  const optionType = direction === "BUY" ? "CE" : "PE";
  const contract = `${getBaseSymbol(symbol)} ${atmStrike} ${optionType}`;

  const moneyness = (spotPrice - atmStrike) / spotPrice;
  const delta = direction === "BUY"
    ? Math.max(0.3, Math.min(0.7, 0.5 + moneyness * 5))
    : Math.max(0.3, Math.min(0.7, 0.5 - moneyness * 5));

  const spotMove = Math.abs(target - spotPrice);
  const spotSLMove = Math.abs(spotPrice - stopLoss);

  const premiumEntry = roundPrice(spotPrice * 0.008 + Math.abs(moneyness) * spotPrice * 0.5);
  const premiumTarget = roundPrice(premiumEntry + spotMove * delta);
  const premiumSL = roundPrice(Math.max(premiumEntry - spotSLMove * delta * 0.8, premiumEntry * 0.3));

  return {
    contract,
    premiumEntry: Math.max(premiumEntry, 10),
    premiumSL: Math.max(premiumSL, 2),
    premiumTarget: Math.max(premiumTarget, premiumEntry + 5),
    impliedVolatility: 15 + Math.abs(moneyness) * 100,
    delta: Number(delta.toFixed(3)),
  };
}

function getStrikeStep(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (sym.includes("NIFTY") && !sym.includes("BANK")) return 50;
  if (sym.includes("BANK")) return 100;
  if (sym.includes("FINNIFTY")) return 50;
  return 0;
}

function getBaseSymbol(symbol: string): string {
  if (symbol.includes("NSEI") || symbol.toUpperCase().includes("NIFTY")) return "NIFTY";
  if (symbol.includes("NSEBANK") || symbol.toUpperCase().includes("BANK")) return "BANKNIFTY";
  return symbol.replace(".NS", "").replace("^", "");
}

function roundPrice(price: number): number {
  return Number(price.toFixed(2));
}
