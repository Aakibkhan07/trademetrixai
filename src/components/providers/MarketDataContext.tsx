"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LiveTick } from "@/lib/types";

export type MarketSession = "LIVE" | "POST_MARKET";

export interface OpenAlgoConfig {
  host: string;
  httpHost: string;
  apiKey: string;
  enabled: boolean;
}

export type OpenAlgoStatus = "disconnected" | "connecting" | "connected" | "error";

interface MarketDataContextProps {
  tickers: Record<string, LiveTick>;
  session: MarketSession;
  sessionName: string;
  getTick: (symbol: string) => LiveTick;
  portfolioPnL: number;
  portfolioPnLPercent: number;
  brokerCapitalAllocations: Record<string, { allocated: number; todayPnl: number; trades: number }>;
  latency: number;
  apiStatus: "connected" | "connecting";
  openAlgoConfig: OpenAlgoConfig;
  updateOpenAlgoConfig: (config: Partial<OpenAlgoConfig>) => void;
  openAlgoStatus: OpenAlgoStatus;
  placeOpenAlgoOrder: (params: {
    symbol: string;
    action: "BUY" | "SELL";
    exchange?: string;
    quantity?: number;
    priceType?: string;
    product?: string;
    strategy?: string;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
}

const MarketDataContext = createContext<MarketDataContextProps | undefined>(undefined);

// Helper to check IST market hours
const getMarketSession = (): { session: MarketSession; name: string } => {
  // Convert current time to IST
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // IST is UTC + 5:30
  const istOffset = 5.5;
  const istDate = new Date(utc + 3600000 * istOffset);

  const day = istDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = totalMinutes >= marketOpen && totalMinutes <= marketClose;

  if (isWeekday && isMarketHours) {
    return { session: "LIVE", name: "LIVE SESSION (NSE/BSE)" };
  } else {
    return { session: "POST_MARKET", name: "POST-MARKET (LOCAL FEED ACTIVE • PRICES STATIC)" };
  }
};

const initialTickers: Record<string, LiveTick> = {
  "NIFTY 50": { symbol: "NIFTY 50", price: 23450.5, changePercent: 0.85, high: 23510.0, low: 23290.5, volume: 245000000, bid: 23450.0, ask: 23451.0, lastHistory: [23410, 23425, 23420, 23438, 23442, 23450.5] },
  BANKNIFTY: { symbol: "BANKNIFTY", price: 50120.8, changePercent: 1.12, high: 50280.0, low: 49750.2, volume: 185000000, bid: 50120.0, ask: 50121.5, lastHistory: [49850, 49920, 49990, 50050, 50100, 50120.8] },
  SENSEX: { symbol: "SENSEX", price: 74560.8, changePercent: 0.95, high: 74720.0, low: 74150.2, volume: 155000000, bid: 74560.0, ask: 74561.5, lastHistory: [74350, 74420, 74490, 74510, 74530, 74560.8] },
  RELIANCE: { symbol: "RELIANCE", price: 2942.35, changePercent: 2.3, high: 2955.0, low: 2895.0, volume: 15400000, bid: 2942.1, ask: 2942.5, lastHistory: [2910, 2915, 2928, 2932, 2940, 2942.35] },
  TCS: { symbol: "TCS", price: 3824.5, changePercent: -1.1, high: 3890.0, low: 3810.0, volume: 8200000, bid: 3824.0, ask: 3824.8, lastHistory: [3865, 3855, 3840, 3832, 3828, 3824.5] },
  HDFCBANK: { symbol: "HDFCBANK", price: 1612.4, changePercent: 1.7, high: 1622.0, low: 1591.0, volume: 12300000, bid: 1612.3, ask: 1612.5, lastHistory: [1595, 1598, 1604, 1608, 1610, 1612.4] },
  INFY: { symbol: "INFY", price: 1472.9, changePercent: -0.4, high: 1488.0, low: 1465.0, volume: 9100000, bid: 1472.7, ask: 1473.0, lastHistory: [1480, 1478, 1476, 1474, 1471, 1472.9] },
  ICICIBANK: { symbol: "ICICIBANK", price: 1118.6, changePercent: 0.9, high: 1125.0, low: 1104.0, volume: 11800000, bid: 1118.5, ask: 1118.8, lastHistory: [1108, 1110, 1114, 1115, 1117, 1118.6] },
  SBIN: { symbol: "SBIN", price: 842.15, changePercent: 2.1, high: 847.5, low: 825.0, volume: 16200000, bid: 842.0, ask: 842.3, lastHistory: [828, 831, 835, 838, 840, 842.15] },
  TATAMOTORS: { symbol: "TATAMOTORS", price: 978.4, changePercent: 1.8, high: 984.0, low: 956.0, volume: 14200000, bid: 978.2, ask: 978.6, lastHistory: [960, 965, 970, 974, 976, 978.4] },
  BAJFINANCE: { symbol: "BAJFINANCE", price: 6845.0, changePercent: 1.25, high: 6890.0, low: 6760.0, volume: 4200000, bid: 6844.5, ask: 6846.0, lastHistory: [6780, 6800, 6815, 6825, 6835, 6845.0] },
  "INDIA VIX": { symbol: "INDIA VIX", price: 13.45, changePercent: -5.2, high: 14.1, low: 13.2, volume: 0, bid: 0, ask: 0, lastHistory: [14.0, 13.8, 13.7, 13.6, 13.5, 13.45] },
  "NIFTY 23400 CE": { symbol: "NIFTY 23400 CE", price: 145.5, changePercent: 0, high: 195.0, low: 110.0, volume: 45000000, bid: 145.3, ask: 145.7, lastHistory: [130, 135, 138, 142, 144, 145.5] },
  "NIFTY 23500 PE": { symbol: "NIFTY 23500 PE", price: 110.4, changePercent: 0, high: 140.0, low: 85.0, volume: 38000000, bid: 110.2, ask: 110.6, lastHistory: [125, 120, 118, 115, 112, 110.4] },
  "BANKNIFTY 50300 PE": { symbol: "BANKNIFTY 50300 PE", price: 240.2, changePercent: 0, high: 310.0, low: 180.0, volume: 22000000, bid: 240.0, ask: 240.5, lastHistory: [260, 255, 250, 246, 242, 240.2] },
  "BANKNIFTY 50100 CE": { symbol: "BANKNIFTY 50100 CE", price: 280.5, changePercent: 0, high: 350.0, low: 220.0, volume: 29000000, bid: 280.2, ask: 280.8, lastHistory: [260, 268, 272, 275, 279, 280.5] },
  "SENSEX 74200 CE": { symbol: "SENSEX 74200 CE", price: 310.5, changePercent: 0, high: 420.0, low: 240.0, volume: 18000000, bid: 310.2, ask: 310.8, lastHistory: [280, 290, 298, 304, 308, 310.5] },
  "SENSEX 74500 PE": { symbol: "SENSEX 74500 PE", price: 290.4, changePercent: 0, high: 390.0, low: 210.0, volume: 15000000, bid: 290.2, ask: 290.6, lastHistory: [270, 278, 282, 285, 288, 290.4] }
};

const normalizeOpenAlgoSymbol = (openAlgoSymbol: string): string | null => {
  const cleanSym = openAlgoSymbol.split(":").pop()?.trim().toUpperCase() || "";
  
  if (cleanSym === "NIFTY 50" || cleanSym === "NIFTY_50" || cleanSym === "NIFTY50" || cleanSym === "NIFTY" || cleanSym === "NIFTY 50 INDEX" || cleanSym === "NIFTY_INDEX") {
    return "NIFTY 50";
  }
  if (cleanSym === "BANKNIFTY" || cleanSym === "NIFTY BANK" || cleanSym === "NIFTY_BANK" || cleanSym === "BANK_NIFTY" || cleanSym === "NIFTYBANK") {
    return "BANKNIFTY";
  }
  if (cleanSym === "SENSEX" || cleanSym === "BSESN" || cleanSym === "SENSEX INDEX") {
    return "SENSEX";
  }
  if (cleanSym === "INDIA VIX" || cleanSym === "INDIAVIX" || cleanSym === "VIX") {
    return "INDIA VIX";
  }
  
  // Standard stock normalization (e.g. RELIANCE-EQ -> RELIANCE)
  const baseStockSym = cleanSym.replace("-EQ", "").trim();
  return baseStockSym;
};

export const MarketDataProvider = ({ children }: { children: ReactNode }) => {
  const [tickers, setTickers] = useState<Record<string, LiveTick>>(initialTickers);
  const [sessionInfo, setSessionInfo] = useState(getMarketSession());

  // Live ticking portfolio statistics
  const [portfolioPnL, setPortfolioPnL] = useState(47350);
  const [portfolioPnLPercent, setPortfolioPnLPercent] = useState(1.89);

  // Latency & Connection Status
  const [latency, setLatency] = useState(4.2);
  const [apiStatus, setApiStatus] = useState<"connected" | "connecting">("connected");

  // OpenAlgo Real-Time Integration State
  const [openAlgoConfig, setOpenAlgoConfig] = useState<OpenAlgoConfig>({
    host: "ws://127.0.0.1:8765",
    httpHost: "http://127.0.0.1:5000",
    apiKey: "",
    enabled: false
  });
  const [openAlgoStatus, setOpenAlgoStatus] = useState<OpenAlgoStatus>("disconnected");

  // Live connected broker balances
  const [brokerCapitalAllocations, setBrokerCapitalAllocations] = useState<Record<string, { allocated: number; todayPnl: number; trades: number }>>({
    "b-001": { allocated: 500000, todayPnl: 12500, trades: 8 },
    "b-002": { allocated: 1000000, todayPnl: 0, trades: 0 },
    "b-003": { allocated: 750000, todayPnl: 8750, trades: 5 },
    "b-004": { allocated: 250000, todayPnl: -2300, trades: 3 }
  });

  // Load OpenAlgo settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tm_openalgo_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOpenAlgoConfig({
          host: parsed.host || "ws://127.0.0.1:8765",
          httpHost: parsed.httpHost || "http://127.0.0.1:5000",
          apiKey: parsed.apiKey || "",
          enabled: parsed.enabled || false
        });
      } catch (e) {
        console.error("Failed to load OpenAlgo config:", e);
      }
    }
  }, []);

  const updateOpenAlgoConfig = (newConfig: Partial<OpenAlgoConfig>) => {
    setOpenAlgoConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem("tm_openalgo_config", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    // Check session type regularly
    const sessionInterval = setInterval(() => {
      setSessionInfo(getMarketSession());
    }, 10000);

    // Helper to fetch real-time market data from the Next.js API endpoint
    const fetchRealData = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/market");
        const json = await res.json();
        if (json.success && json.data && Object.keys(json.data).length > 0) {
          setTickers((prev) => {
            const updated = { ...prev };
            Object.keys(json.data).forEach((key) => {
              const tick = json.data[key];
              const history = prev[key]?.lastHistory ? [...prev[key].lastHistory] : [];
              history.push(tick.price);
              if (history.length > 8) history.shift();
              updated[key] = {
                ...tick,
                lastHistory: history
              };
            });

            // Update Nifty/BankNifty correlated options premiums
            const currentNifty = updated["NIFTY 50"]?.price || 23450.5;
            const prevNifty = prev["NIFTY 50"]?.price || 23450.5;
            const niftyDiff = currentNifty - prevNifty;

            const currentBanknifty = updated["BANKNIFTY"]?.price || 50120.8;
            const prevBanknifty = prev["BANKNIFTY"]?.price || 50120.8;
            const bankniftyDiff = currentBanknifty - prevBanknifty;

            const currentSensex = updated["SENSEX"]?.price || 74560.8;
            const prevSensex = prev["SENSEX"]?.price || 74560.8;
            const sensexDiff = currentSensex - prevSensex;

            // NIFTY 23400 CE (Delta: 0.54)
            if (updated["NIFTY 23400 CE"]) {
              const prevPrice = prev["NIFTY 23400 CE"]?.price || 145.5;
              const newPrice = Number((prevPrice + niftyDiff * 0.54).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["NIFTY 23400 CE"].price) / initialTickers["NIFTY 23400 CE"].price) * 100).toFixed(2));
              const history = prev["NIFTY 23400 CE"]?.lastHistory ? [...prev["NIFTY 23400 CE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["NIFTY 23400 CE"] = { ...updated["NIFTY 23400 CE"], price: newPrice, changePercent, lastHistory: history };
            }
            // NIFTY 23500 PE (Delta: -0.46)
            if (updated["NIFTY 23500 PE"]) {
              const prevPrice = prev["NIFTY 23500 PE"]?.price || 110.4;
              const newPrice = Number((prevPrice + niftyDiff * -0.46).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["NIFTY 23500 PE"].price) / initialTickers["NIFTY 23500 PE"].price) * 100).toFixed(2));
              const history = prev["NIFTY 23500 PE"]?.lastHistory ? [...prev["NIFTY 23500 PE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["NIFTY 23500 PE"] = { ...updated["NIFTY 23500 PE"], price: newPrice, changePercent, lastHistory: history };
            }
            // BANKNIFTY 50300 PE (Delta: -0.52)
            if (updated["BANKNIFTY 50300 PE"]) {
              const prevPrice = prev["BANKNIFTY 50300 PE"]?.price || 240.2;
              const newPrice = Number((prevPrice + bankniftyDiff * -0.52).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["BANKNIFTY 50300 PE"].price) / initialTickers["BANKNIFTY 50300 PE"].price) * 100).toFixed(2));
              const history = prev["BANKNIFTY 50300 PE"]?.lastHistory ? [...prev["BANKNIFTY 50300 PE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["BANKNIFTY 50300 PE"] = { ...updated["BANKNIFTY 50300 PE"], price: newPrice, changePercent, lastHistory: history };
            }
            // BANKNIFTY 50100 CE (Delta: 0.52)
            if (updated["BANKNIFTY 50100 CE"]) {
              const prevPrice = prev["BANKNIFTY 50100 CE"]?.price || 280.5;
              const newPrice = Number((prevPrice + bankniftyDiff * 0.52).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["BANKNIFTY 50100 CE"].price) / initialTickers["BANKNIFTY 50100 CE"].price) * 100).toFixed(2));
              const history = prev["BANKNIFTY 50100 CE"]?.lastHistory ? [...prev["BANKNIFTY 50100 CE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["BANKNIFTY 50100 CE"] = { ...updated["BANKNIFTY 50100 CE"], price: newPrice, changePercent, lastHistory: history };
            }
            // SENSEX 74200 CE (Delta: 0.58)
            if (updated["SENSEX 74200 CE"]) {
              const prevPrice = prev["SENSEX 74200 CE"]?.price || 310.5;
              const newPrice = Number((prevPrice + sensexDiff * 0.58).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["SENSEX 74200 CE"].price) / initialTickers["SENSEX 74200 CE"].price) * 100).toFixed(2));
              const history = prev["SENSEX 74200 CE"]?.lastHistory ? [...prev["SENSEX 74200 CE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["SENSEX 74200 CE"] = { ...updated["SENSEX 74200 CE"], price: newPrice, changePercent, lastHistory: history };
            }
            // SENSEX 74500 PE (Delta: -0.42)
            if (updated["SENSEX 74500 PE"]) {
              const prevPrice = prev["SENSEX 74500 PE"]?.price || 290.4;
              const newPrice = Number((prevPrice + sensexDiff * -0.42).toFixed(2));
              const changePercent = Number((((newPrice - initialTickers["SENSEX 74500 PE"].price) / initialTickers["SENSEX 74500 PE"].price) * 100).toFixed(2));
              const history = prev["SENSEX 74500 PE"]?.lastHistory ? [...prev["SENSEX 74500 PE"].lastHistory] : [];
              history.push(newPrice); if (history.length > 8) history.shift();
              updated["SENSEX 74500 PE"] = { ...updated["SENSEX 74500 PE"], price: newPrice, changePercent, lastHistory: history };
            }

            // Update portfolio PnL and broker allocations based on live Nifty / stock change percentages
            const niftyMove = updated["NIFTY 50"]?.changePercent || 0;
            const sbinMove = updated["SBIN"]?.changePercent || 0;
            const hdfcMove = updated["HDFCBANK"]?.changePercent || 0;
            const tcsMove = updated["TCS"]?.changePercent || 0;

            const activeWeight = (sbinMove + hdfcMove + niftyMove) / 3;
            setPortfolioPnL(Math.round(47350 + activeWeight * 8500));
            setPortfolioPnLPercent(Number((1.89 + activeWeight * 0.3).toFixed(2)));

            setBrokerCapitalAllocations((prevAlloc) => {
              const updatedAlloc = { ...prevAlloc };
              updatedAlloc["b-001"] = { ...updatedAlloc["b-001"], todayPnl: Math.round(12500 + sbinMove * 1800) };
              updatedAlloc["b-003"] = { ...updatedAlloc["b-003"], todayPnl: Math.round(8750 + niftyMove * 2200) };
              updatedAlloc["b-004"] = { ...updatedAlloc["b-004"], todayPnl: Math.round(-2300 + tcsMove * 1400) };
              return updatedAlloc;
            });

            return updated;
          });
          return true;
        }
      } catch (err) {
        console.error("Failed to fetch real-time market data:", err);
      }
      return false;
    };

    // Load initial real data on mount (so user gets actual NSE closing rates even outside market hours)
    fetchRealData();

    // Live tick updater
    const tickInterval = setInterval(async () => {
      // Skip simulated updates when OpenAlgo WebSocket is connected
      if (openAlgoConfig.enabled && openAlgoStatus === "connected") {
        return;
      }

      const isLive = sessionInfo.session === "LIVE";
      
      if (!isLive) {
        // Freeze all simulated price movement outside live market hours
        return;
      }
      
      const success = await fetchRealData();
      if (success) return; // Real data successfully loaded, skip simulated fallback!
      
      // Update latency
      setLatency(Number((Math.random() * 3.8 + 2.1).toFixed(1)));
      
      const multiplier = 1;

      setTickers((prevTickers) => {
        const updated = { ...prevTickers };
        
        Object.keys(updated).forEach((key) => {
          // If it is an option contract, we will skip random ticking here and tick it relative to spot indices below
          if (key.includes("CE") || key.includes("PE")) return;

          const ticker = updated[key];
          const direction = Math.random() > 0.48 ? 1 : -1; // slight upward bias
          // Tick step ranges from 0.01% to 0.08%
          const tickPct = (Math.random() * 0.07 + 0.01) * 0.01 * direction * multiplier;
          const newPrice = Number((ticker.price * (1 + tickPct)).toFixed(key === "INDIA VIX" || key.includes("NIFTY") ? 2 : 2));
          
          // Recalculate change percent relative to typical reference point (simulated open)
          const baseRef = initialTickers[key].price;
          const newChgPct = Number((((newPrice - baseRef) / baseRef) * 100).toFixed(2));

          const history = ticker.lastHistory ? [...ticker.lastHistory] : [];
          history.push(newPrice);
          if (history.length > 8) history.shift();

          updated[key] = {
            ...ticker,
            price: newPrice,
            changePercent: newChgPct,
            high: newPrice > ticker.high ? newPrice : ticker.high,
            low: newPrice < ticker.low ? newPrice : ticker.low,
            bid: Number((newPrice - Math.random() * 0.5).toFixed(2)),
            ask: Number((newPrice + Math.random() * 0.5).toFixed(2)),
            lastHistory: history
          };
        });

        // Correlate Option Premiums in simulated mode
        const currentNifty = updated["NIFTY 50"].price;
        const prevNifty = prevTickers["NIFTY 50"].price;
        const niftyDiff = currentNifty - prevNifty;

        const currentBanknifty = updated["BANKNIFTY"].price;
        const prevBanknifty = prevTickers["BANKNIFTY"].price;
        const bankniftyDiff = currentBanknifty - prevBanknifty;

        const currentSensex = updated["SENSEX"].price;
        const prevSensex = prevTickers["SENSEX"].price;
        const sensexDiff = currentSensex - prevSensex;

        // Update Option CE/PE ticks dynamically using Delta
        const optionKeys = ["NIFTY 23400 CE", "NIFTY 23500 PE", "BANKNIFTY 50300 PE", "BANKNIFTY 50100 CE", "SENSEX 74200 CE", "SENSEX 74500 PE"];
        optionKeys.forEach((oKey) => {
          const ticker = updated[oKey];
          const isNifty = oKey.includes("NIFTY");
          const isBanknifty = oKey.includes("BANKNIFTY");
          const isCE = oKey.includes("CE");
          
          let diff = 0;
          let delta = 0;
          if (isNifty) {
            diff = niftyDiff;
            delta = isCE ? 0.54 : -0.46;
          } else if (isBanknifty) {
            diff = bankniftyDiff;
            delta = isCE ? 0.52 : -0.52;
          } else { // SENSEX
            diff = sensexDiff;
            delta = isCE ? 0.58 : -0.42;
          }

          const newPrice = Number((ticker.price + diff * delta).toFixed(2));
          const baseRef = initialTickers[oKey].price;
          const newChgPct = Number((((newPrice - baseRef) / baseRef) * 100).toFixed(2));

          const history = ticker.lastHistory ? [...ticker.lastHistory] : [];
          history.push(newPrice);
          if (history.length > 8) history.shift();

          updated[oKey] = {
            ...ticker,
            price: newPrice,
            changePercent: newChgPct,
            high: newPrice > ticker.high ? newPrice : ticker.high,
            low: newPrice < ticker.low ? newPrice : ticker.low,
            bid: Number((newPrice - 0.25).toFixed(2)),
            ask: Number((newPrice + 0.25).toFixed(2)),
            lastHistory: history
          };
        });

        // Ticking portfolio PnL updates
        // Portfolio return is roughly correlated with market moves
        const niftyMove = updated["NIFTY 50"].changePercent;
        const sbinMove = updated["SBIN"].changePercent;
        const hdfcMove = updated["HDFCBANK"].changePercent;
        
        // Calculate dynamic live portfolio PnL (around baseline 47350)
        const activeWeight = (sbinMove + hdfcMove + niftyMove) / 3;
        const newPnL = Math.round(47350 + activeWeight * 8500);
        const newPnLPercent = Number((1.89 + activeWeight * 0.3).toFixed(2));
        setPortfolioPnL(newPnL);
        setPortfolioPnLPercent(newPnLPercent);

        // Update broker allocations PnLs in real-time
        setBrokerCapitalAllocations((prevAlloc) => {
          const updatedAlloc = { ...prevAlloc };
          
          // Dhan todayPnl ticks with SBIN
          updatedAlloc["b-001"] = {
            ...updatedAlloc["b-001"],
            todayPnl: Math.round(12500 + sbinMove * 1800)
          };
          
          // Angel One todayPnl ticks with Nifty
          updatedAlloc["b-003"] = {
            ...updatedAlloc["b-003"],
            todayPnl: Math.round(8750 + niftyMove * 2200)
          };
          
          // Shoonya todayPnl ticks with TCS (negative)
          const tcsMove = updated["TCS"].changePercent;
          updatedAlloc["b-004"] = {
            ...updatedAlloc["b-004"],
            todayPnl: Math.round(-2300 + tcsMove * 1400)
          };

          return updatedAlloc;
        });

        return updated;
      });
    }, 1200);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(tickInterval);
    };
  }, [sessionInfo.session, openAlgoConfig.enabled, openAlgoStatus]);

  // OpenAlgo WebSocket Integration
  useEffect(() => {
    if (!openAlgoConfig.enabled) {
      setOpenAlgoStatus("disconnected");
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCleanCleanup = false;

    const connect = () => {
      if (isCleanCleanup) return;
      setOpenAlgoStatus("connecting");
      
      try {
        console.log(`Connecting to OpenAlgo WebSocket at: ${openAlgoConfig.host}`);
        socket = new WebSocket(openAlgoConfig.host);

        socket.onopen = () => {
          console.log("OpenAlgo WebSocket connection opened");
          // Authenticate
          socket?.send(JSON.stringify({
            action: "authenticate",
            api_key: openAlgoConfig.apiKey
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check if authentication was successful
            if (data.status === "success" && (data.message?.toLowerCase().includes("auth") || data.message?.toLowerCase().includes("login") || data.message?.toLowerCase().includes("connect"))) {
              console.log("OpenAlgo authenticated successfully!");
              setOpenAlgoStatus("connected");
              
              // Subscribe to symbols (mode 1: LTP)
              socket?.send(JSON.stringify({
                action: "subscribe",
                mode: 1,
                symbols: [
                  { exchange: "NSE", symbol: "RELIANCE" },
                  { exchange: "NSE", symbol: "TCS" },
                  { exchange: "NSE", symbol: "HDFCBANK" },
                  { exchange: "NSE", symbol: "INFY" },
                  { exchange: "NSE", symbol: "ICICIBANK" },
                  { exchange: "NSE", symbol: "SBIN" },
                  { exchange: "NSE", symbol: "TATAMOTORS" },
                  { exchange: "NSE", symbol: "BAJFINANCE" },
                  { exchange: "NSE_INDEX", symbol: "Nifty 50" },
                  { exchange: "NSE_INDEX", symbol: "Nifty Bank" },
                  { exchange: "BSE_INDEX", symbol: "SENSEX" },
                  { exchange: "NSE_INDEX", symbol: "INDIA VIX" }
                ]
              }));
              return;
            }

            // Handle tickers
            // OpenAlgo data structure:
            // { "symbol": "INFY", "exchange": "NSE", "mode": "LTP", "data": { "ltp": 1500.5, "timestamp": 1234 } }
            if (data && data.symbol && data.data) {
              const cleanSymbol = normalizeOpenAlgoSymbol(data.symbol);
              if (cleanSymbol) {
                const priceVal = data.data.ltp || data.data.price;
                if (priceVal !== undefined) {
                  setTickers((prev) => {
                    const ticker = prev[cleanSymbol];
                    if (!ticker) return prev;

                    const newPrice = Number(priceVal.toFixed(2));
                    const baseRef = initialTickers[cleanSymbol]?.price || newPrice;
                    const changePercent = Number((((newPrice - baseRef) / baseRef) * 100).toFixed(2));

                    const history = ticker.lastHistory ? [...ticker.lastHistory] : [];
                    history.push(newPrice);
                    if (history.length > 8) history.shift();

                    const updated = {
                      ...prev,
                      [cleanSymbol]: {
                        ...ticker,
                        price: newPrice,
                        changePercent,
                        high: newPrice > ticker.high ? newPrice : ticker.high,
                        low: newPrice < ticker.low ? newPrice : ticker.low,
                        bid: Number((newPrice - 0.25).toFixed(2)),
                        ask: Number((newPrice + 0.25).toFixed(2)),
                        lastHistory: history
                      }
                    };

                    // Recalculate options if it is Nifty, BankNifty, or Sensex
                    if (cleanSymbol === "NIFTY 50" || cleanSymbol === "BANKNIFTY" || cleanSymbol === "SENSEX") {
                      const niftyDiff = (updated["NIFTY 50"]?.price || 23450.5) - (prev["NIFTY 50"]?.price || 23450.5);
                      const bankniftyDiff = (updated["BANKNIFTY"]?.price || 50120.8) - (prev["BANKNIFTY"]?.price || 50120.8);
                      const sensexDiff = (updated["SENSEX"]?.price || 74560.8) - (prev["SENSEX"]?.price || 74560.8);

                      const optionKeys = ["NIFTY 23400 CE", "NIFTY 23500 PE", "BANKNIFTY 50300 PE", "BANKNIFTY 50100 CE", "SENSEX 74200 CE", "SENSEX 74500 PE"];
                      optionKeys.forEach((oKey) => {
                        const oTicker = updated[oKey];
                        if (!oTicker) return;
                        const isNifty = oKey.includes("NIFTY");
                        const isBanknifty = oKey.includes("BANKNIFTY");
                        const isCE = oKey.includes("CE");
                        
                        let diff = 0;
                        let delta = 0;
                        if (isNifty) {
                          diff = niftyDiff;
                          delta = isCE ? 0.54 : -0.46;
                        } else if (isBanknifty) {
                          diff = bankniftyDiff;
                          delta = isCE ? 0.52 : -0.52;
                        } else {
                          diff = sensexDiff;
                          delta = isCE ? 0.58 : -0.42;
                        }

                        const optionPrice = Number((oTicker.price + diff * delta).toFixed(2));
                        const oBaseRef = initialTickers[oKey]?.price || optionPrice;
                        const oChangePercent = Number((((optionPrice - oBaseRef) / oBaseRef) * 100).toFixed(2));

                        const oHistory = oTicker.lastHistory ? [...oTicker.lastHistory] : [];
                        oHistory.push(optionPrice);
                        if (oHistory.length > 8) oHistory.shift();

                        updated[oKey] = {
                          ...oTicker,
                          price: optionPrice,
                          changePercent: oChangePercent,
                          high: optionPrice > oTicker.high ? optionPrice : oTicker.high,
                          low: optionPrice < oTicker.low ? optionPrice : oTicker.low,
                          bid: Number((optionPrice - 0.25).toFixed(2)),
                          ask: Number((optionPrice + 0.25).toFixed(2)),
                          lastHistory: oHistory
                        };
                      });
                    }

                    // Ticking portfolio PnL updates
                    const niftyMove = updated["NIFTY 50"]?.changePercent || 0;
                    const sbinMove = updated["SBIN"]?.changePercent || 0;
                    const hdfcMove = updated["HDFCBANK"]?.changePercent || 0;
                    
                    const activeWeight = (sbinMove + hdfcMove + niftyMove) / 3;
                    const newPnL = Math.round(47350 + activeWeight * 8500);
                    const newPnLPercent = Number((1.89 + activeWeight * 0.3).toFixed(2));
                    setPortfolioPnL(newPnL);
                    setPortfolioPnLPercent(newPnLPercent);

                    // Update broker allocations PnLs in real-time
                    setBrokerCapitalAllocations((prevAlloc) => {
                      const updatedAlloc = { ...prevAlloc };
                      updatedAlloc["b-001"] = { ...updatedAlloc["b-001"], todayPnl: Math.round(12500 + sbinMove * 1800) };
                      updatedAlloc["b-003"] = { ...updatedAlloc["b-003"], todayPnl: Math.round(8750 + niftyMove * 2200) };
                      const tcsMove = updated["TCS"]?.changePercent || 0;
                      updatedAlloc["b-004"] = { ...updatedAlloc["b-004"], todayPnl: Math.round(-2300 + tcsMove * 1400) };
                      return updatedAlloc;
                    });

                    return updated;
                  });
                }
              }
            }
          } catch (e) {
            console.error("Error parsing OpenAlgo WebSocket message:", e);
          }
        };

        socket.onerror = (error) => {
          console.error("OpenAlgo WebSocket error:", error);
          setOpenAlgoStatus("error");
        };

        socket.onclose = (event) => {
          if (!isCleanCleanup) {
            console.log("OpenAlgo WebSocket closed. Attempting reconnect...");
            setOpenAlgoStatus("disconnected");
            reconnectTimeout = setTimeout(connect, 5000); // Reconnect in 5s
          }
        };
      } catch (err) {
        console.error("Failed to connect to OpenAlgo:", err);
        setOpenAlgoStatus("error");
        if (!isCleanCleanup) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      isCleanCleanup = true;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [openAlgoConfig.enabled, openAlgoConfig.host, openAlgoConfig.apiKey]);

  const getTick = (symbol: string): LiveTick => {
    return tickers[symbol] || {
      symbol,
      price: 100,
      changePercent: 0,
      high: 100,
      low: 100,
      volume: 0,
      bid: 100,
      ask: 100
    };
  };

  const placeOpenAlgoOrder = async (params: {
    symbol: string;
    action: "BUY" | "SELL";
    exchange?: string;
    quantity?: number;
    priceType?: string;
    product?: string;
    strategy?: string;
  }) => {
    if (!openAlgoConfig.enabled || openAlgoStatus !== "connected") {
      return { success: false, error: "OpenAlgo API Bridge is not active or connected." };
    }

    try {
      const endpoint = `${openAlgoConfig.httpHost || "http://127.0.0.1:5000"}/api/v1/placeorder`;
      
      const payload = {
        apikey: openAlgoConfig.apiKey,
        strategy: params.strategy || "TradeMetrix Strategy",
        exchange: params.exchange || "NFO",
        symbol: params.symbol,
        action: params.action,
        product: params.product || "MIS",
        pricetype: params.priceType || "MARKET",
        quantity: String(params.quantity || 1),
        price: "0",
        trigger_price: "0",
        disclosed_quantity: "0"
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && (data.status === "success" || data.ok)) {
        setBrokerCapitalAllocations((prev) => {
          const updated = { ...prev };
          const brokerId = "b-001";
          if (updated[brokerId]) {
            updated[brokerId] = {
              ...updated[brokerId],
              trades: updated[brokerId].trades + 1
            };
          }
          return updated;
        });

        return {
          success: true,
          orderId: data.orderid || (data.result && data.result.orderid) || "TRM-OR-" + Math.floor(Math.random() * 1000000)
        };
      } else {
        return {
          success: false,
          error: data.message || data.description || "Order placement rejected by OpenAlgo server."
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to establish network connection to OpenAlgo HTTP API."
      };
    }
  };

  return (
    <MarketDataContext.Provider
      value={{
        tickers,
        session: sessionInfo.session,
        sessionName: sessionInfo.name,
        getTick,
        portfolioPnL,
        portfolioPnLPercent,
        brokerCapitalAllocations,
        latency,
        apiStatus,
        openAlgoConfig,
        updateOpenAlgoConfig,
        openAlgoStatus,
        placeOpenAlgoOrder
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error("useMarketData must be used within a MarketDataProvider");
  }
  return context;
};
