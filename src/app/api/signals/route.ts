// ============================================================
// TRADE METRIX AI — Signal Generation API Route
// ============================================================
// GET /api/signals?symbol=^NSEI&timeframe=15m
// Fetches real OHLCV from Yahoo Finance and generates TA signals
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateSignals,
  getIndicatorSnapshot,
  type OHLCV,
  type GeneratedSignal,
} from "@/lib/signal-engine";

// Yahoo Finance ticker mapping for Indian market
const WATCHLIST: Record<string, string> = {
  "NIFTY 50": "^NSEI",
  "BANKNIFTY": "^NSEBANK",
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "INFY": "INFY.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "SBIN": "SBIN.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "ADANIENT": "ADANIENT.NS",
  "WIPRO": "WIPRO.NS",
  "LT": "LT.NS",
  "BAJFINANCE": "BAJFINANCE.NS",
  "ITC": "ITC.NS",
  "AXISBANK": "AXISBANK.NS",
};

const TIMEFRAME_MAP: Record<string, { interval: string; range: string }> = {
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "5d" },
  "30m": { interval: "30m", range: "10d" },
  "1h": { interval: "60m", range: "20d" },
  "1d": { interval: "1d", range: "3mo" },
};

async function fetchOHLCV(
  yahooTicker: string,
  interval: string,
  range: string
): Promise<OHLCV[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance API error: ${res.status} for ${yahooTicker}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${yahooTicker}`);

  const timestamps: number[] = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const opens: (number | null)[] = quote.open || [];
  const highs: (number | null)[] = quote.high || [];
  const lows: (number | null)[] = quote.low || [];
  const closes: (number | null)[] = quote.close || [];
  const volumes: (number | null)[] = quote.volume || [];

  const ohlcv: OHLCV[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (opens[i] != null && highs[i] != null && lows[i] != null && closes[i] != null && volumes[i] != null) {
      ohlcv.push({
        timestamp: timestamps[i],
        open: opens[i]!,
        high: highs[i]!,
        low: lows[i]!,
        close: closes[i]!,
        volume: volumes[i]!,
      });
    }
  }

  return ohlcv;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolParam = searchParams.get("symbol");
    const timeframe = searchParams.get("timeframe") || "15m";
    const scanAll = searchParams.get("scan") === "true";

    const tfConfig = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP["15m"];

    const tickersToScan: [string, string][] = [];

    if (symbolParam) {
      const yahooTicker = WATCHLIST[symbolParam.toUpperCase()] || symbolParam;
      tickersToScan.push([symbolParam, yahooTicker]);
    } else if (scanAll) {
      for (const [name, ticker] of Object.entries(WATCHLIST)) {
        tickersToScan.push([name, ticker]);
      }
    } else {
      const defaultSymbols = ["NIFTY 50", "BANKNIFTY", "RELIANCE", "HDFCBANK", "TCS", "INFY", "SBIN"];
      for (const name of defaultSymbols) {
        if (WATCHLIST[name]) {
          tickersToScan.push([name, WATCHLIST[name]]);
        }
      }
    }

    const allSignals: (GeneratedSignal & { displayName: string })[] = [];
    const indicatorData: Record<string, any> = {};
    const errors: string[] = [];

    const results = await Promise.allSettled(
      tickersToScan.map(async ([displayName, yahooTicker]) => {
        const ohlcv = await fetchOHLCV(yahooTicker, tfConfig.interval, tfConfig.range);

        if (ohlcv.length < 55) {
          return { displayName, signals: [], indicators: null, error: "Insufficient data" };
        }

        const spotPrice = ohlcv[ohlcv.length - 1].close;
        const signals = generateSignals(ohlcv, spotPrice, displayName, timeframe);
        const indicators = getIndicatorSnapshot(ohlcv);

        return { displayName, signals, indicators, spotPrice, yahooTicker };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { displayName, signals, indicators, spotPrice, yahooTicker } = result.value;
        if (signals) {
          for (const sig of signals) {
            allSignals.push({ ...sig, displayName });
          }
        }
        if (indicators) {
          indicatorData[displayName] = { ...indicators, spotPrice, yahooTicker };
        }
        if (result.value.error) {
          errors.push(`${displayName}: ${result.value.error}`);
        }
      } else {
        errors.push(`Failed: ${result.reason?.message || "Unknown error"}`);
      }
    }

    allSignals.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeframe,
      signalCount: allSignals.length,
      signals: allSignals,
      indicators: indicatorData,
      scannedSymbols: tickersToScan.map(([name]) => name),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Signal generation failed", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
