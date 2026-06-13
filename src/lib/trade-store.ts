// ============================================================
// TRADE METRIX AI — Unified Trade Store Manager
// ============================================================
// Dual-mode database helper:
// - If Firebase is configured, routes trades to Cloud Firestore.
// - If Firebase is not configured, routes trades to localStorage.
// ============================================================

import {
  addTrade as firestoreAddTrade,
  getUserTrades as firestoreGetUserTrades,
  updateTrade as firestoreUpdateTrade,
  closeTrade as firestoreCloseTrade,
  type TradeRecord,
} from "./firestore";

const LOCAL_STORAGE_KEY = "tm_local_trades";

// Initialize with some default historical trades if localStorage is empty
const defaultTrades: TradeRecord[] = [
  {
    id: "t-demo-0",
    uid: "demo-user",
    date: new Date(Date.now() - 3600000 * 24).toISOString().split("T")[0],
    symbol: "RELIANCE",
    direction: "BUY",
    strategy: "EMA 9/15 Scalper",
    entryPrice: 2910.0,
    exitPrice: 2942.35,
    quantity: 100,
    pnl: 3235.0,
    pnlPercent: 1.11,
    fees: 40.0,
    netPnl: 3195.0,
    status: "closed",
    notes: "Perfect bounce off EMA support.",
    tags: ["EMA", "Bullish"],
    duration: "1h 15m",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "t-demo-1",
    uid: "demo-user",
    date: new Date(Date.now() - 3600000 * 48).toISOString().split("T")[0],
    symbol: "TCS",
    direction: "SELL",
    strategy: "RSI Mean Reversion",
    entryPrice: 3850.0,
    exitPrice: 3824.5,
    quantity: 50,
    pnl: 1275.0,
    pnlPercent: 0.66,
    fees: 35.0,
    netPnl: 1240.0,
    status: "closed",
    notes: "Overbought correction captured.",
    tags: ["RSI", "Bearish"],
    duration: "45m",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "t-demo-2",
    uid: "demo-user",
    date: new Date(Date.now() - 3600000 * 72).toISOString().split("T")[0],
    symbol: "INFY",
    direction: "BUY",
    strategy: "VWAP Momentum",
    entryPrice: 1485.0,
    exitPrice: 1472.9,
    quantity: 200,
    pnl: -2420.0,
    pnlPercent: -0.81,
    fees: 40.0,
    netPnl: -2460.0,
    status: "closed",
    notes: "Failed breakout at session high.",
    tags: ["VWAP", "Breakout"],
    duration: "30m",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  }
];

const isFirebaseReady = (): boolean => {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
};

export async function getTrades(uid: string): Promise<TradeRecord[]> {
  if (isFirebaseReady()) {
    try {
      return await firestoreGetUserTrades(uid);
    } catch (e) {
      console.warn("Firestore read failed, falling back to local storage trades", e);
    }
  }

  // Local Storage Fallback
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    // Add IDs to default trades if they don't have them
    const defaultTradesWithIds = defaultTrades.map((trade, idx) => ({
      ...trade,
      id: trade.id || `t-demo-${idx}`,
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultTradesWithIds));
    return defaultTradesWithIds;
  }
  try {
    const parsed = JSON.parse(stored);
    // Ensure all trades have IDs
    return parsed.map((trade: any, idx: number) => ({
      ...trade,
      id: trade.id || `t-fallback-${idx}`,
    }));
  } catch (e) {
    return [];
  }
}

export async function addTrade(trade: Omit<TradeRecord, "id" | "createdAt">): Promise<string> {
  if (isFirebaseReady()) {
    try {
      return await firestoreAddTrade(trade);
    } catch (e) {
      console.warn("Firestore add failed, falling back to local storage", e);
    }
  }

  // Local Storage Fallback
  if (typeof window === "undefined") return "local-id";
  const id = `local-trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newTrade: TradeRecord = {
    ...trade,
    id,
    createdAt: new Date().toISOString(),
  };

  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  const trades = stored ? JSON.parse(stored) : [];
  trades.unshift(newTrade);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  return id;
}

export async function updateTrade(tradeId: string, data: Partial<TradeRecord>): Promise<void> {
  if (isFirebaseReady() && !tradeId.startsWith("local-")) {
    try {
      await firestoreUpdateTrade(tradeId, data);
      return;
    } catch (e) {
      console.warn("Firestore update failed, falling back to local storage", e);
    }
  }

  // Local Storage Fallback
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return;
  try {
    let trades = JSON.parse(stored) as TradeRecord[];
    trades = trades.map((t) => (t.id === tradeId ? { ...t, ...data } : t));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {}
}

export async function closeTrade(tradeId: string, exitPrice: number, fees = 40): Promise<void> {
  if (isFirebaseReady() && !tradeId.startsWith("local-")) {
    try {
      await firestoreCloseTrade(tradeId, exitPrice, fees);
      return;
    } catch (e) {
      console.warn("Firestore close failed, falling back to local storage", e);
    }
  }

  // Local Storage Fallback
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return;
  try {
    const trades = JSON.parse(stored) as TradeRecord[];
    const index = trades.findIndex((t) => t.id === tradeId);
    if (index === -1) return;

    const trade = trades[index];
    const pnl = trade.direction === "BUY"
      ? (exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - exitPrice) * trade.quantity;
    const pnlPercent = (pnl / (trade.entryPrice * trade.quantity)) * 100;

    trades[index] = {
      ...trade,
      exitPrice,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      fees,
      netPnl: Number((pnl - fees).toFixed(2)),
      status: "closed",
      closedAt: new Date().toISOString(),
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));

    // Update the capital allocated in localStorage if needed
    const currentCapital = localStorage.getItem("tm_demo_capital");
    if (currentCapital) {
      const netPnl = pnl - fees;
      const updated = parseFloat(currentCapital) + netPnl;
      localStorage.setItem("tm_demo_capital", updated.toString());
      // Dispatches a storage event so components know to update
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {}
}

export function clearTrades(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
}
