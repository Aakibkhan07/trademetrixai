// ============================================================
// TRADE METRIX AI — Backtest API Route
// ============================================================
// POST /api/backtest — Run a backtest against real historical data
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runBacktest, PRESET_STRATEGIES, type StrategyDefinition } from "@/lib/backtest-engine";
import type { OHLCV } from "@/lib/signal-engine";

const YAHOO_TICKERS: Record<string, string> = {
  "NIFTY": "^NSEI",
  "NIFTY 50": "^NSEI",
  "BANKNIFTY": "^NSEBANK",
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "INFY": "INFY.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "SBIN": "SBIN.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
};

async function fetchHistoricalData(symbol: string, period = "6mo", interval = "1d"): Promise<OHLCV[]> {
  const yahooTicker = YAHOO_TICKERS[symbol.toUpperCase()] || symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=${interval}&range=${period}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });

  if (!res.ok) throw new Error(`Failed to fetch data for ${symbol}: ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const timestamps: number[] = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};

  const ohlcv: OHLCV[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (q.open?.[i] != null && q.high?.[i] != null && q.low?.[i] != null && q.close?.[i] != null && q.volume?.[i] != null) {
      ohlcv.push({
        timestamp: timestamps[i],
        open: q.open[i],
        high: q.high[i],
        low: q.low[i],
        close: q.close[i],
        volume: q.volume[i],
      });
    }
  }

  return ohlcv;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      symbol = "NIFTY",
      strategyName,
      strategy: customStrategy,
      period = "6mo",
      interval = "1d",
      initialCapital = 100000,
    } = body;

    // Get strategy
    let strategy: StrategyDefinition;
    if (customStrategy) {
      strategy = customStrategy as StrategyDefinition;
    } else if (strategyName) {
      const preset = PRESET_STRATEGIES.find((s) => s.name === strategyName);
      if (!preset) {
        return NextResponse.json(
          { success: false, error: `Unknown strategy: ${strategyName}. Available: ${PRESET_STRATEGIES.map((s) => s.name).join(", ")}` },
          { status: 400 }
        );
      }
      strategy = preset;
    } else {
      strategy = PRESET_STRATEGIES[0]; // Default
    }

    // Fetch historical data
    const ohlcv = await fetchHistoricalData(symbol, period, interval);

    if (ohlcv.length < 60) {
      return NextResponse.json(
        { success: false, error: `Insufficient data for ${symbol}: only ${ohlcv.length} bars (need 60+)` },
        { status: 400 }
      );
    }

    // Run backtest
    const result = runBacktest(ohlcv, strategy, initialCapital);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      symbol,
      period,
      interval,
      dataPoints: ohlcv.length,
      result,
      availableStrategies: PRESET_STRATEGIES.map((s) => s.name),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Backtest failed" },
      { status: 500 }
    );
  }
}

// GET: List available strategies and symbols
export async function GET() {
  return NextResponse.json({
    success: true,
    strategies: PRESET_STRATEGIES.map((s) => ({
      name: s.name,
      entryConditions: s.conditions.entryLong.conditions.length,
      exitConditions: s.conditions.exitLong.conditions.length,
      hasShort: !!s.conditions.entryShort,
      riskManagement: s.riskManagement,
    })),
    symbols: Object.keys(YAHOO_TICKERS),
    periods: ["1mo", "3mo", "6mo", "1y", "2y"],
    intervals: ["15m", "30m", "1h", "1d"],
  });
}
