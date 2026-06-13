// ============================================================
// TRADE METRIX AI — Firestore Database Helpers
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
  type Firestore,
} from "firebase/firestore";
import { db } from "./firebase";

function getDb(): Firestore {
  if (!db) throw new Error("Firestore not configured. Set Firebase env vars.");
  return db;
}

// ---- Collection Names ----
export const COLLECTIONS = {
  USERS: "users",
  TRADES: "trades",
  SIGNALS: "signals",
  STRATEGIES: "strategies",
  BROKER_CONFIGS: "broker_configs",
  SETTINGS: "settings",
} as const;

// ---- User Profile ----
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "user" | "admin" | "pro";
  plan: "free" | "pro" | "institutional";
  capital: number;
  createdAt: any;
  lastLogin: any;
  settings: {
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramAutoSend?: boolean;
    openAlgoHost?: string;
    openAlgoHttpHost?: string;
    openAlgoApiKey?: string;
    openAlgoEnabled?: boolean;
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(getDb(), COLLECTIONS.USERS, uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(getDb(), COLLECTIONS.USERS, uid);
  await setDoc(docRef, {
    uid,
    role: "user",
    plan: "free",
    capital: 0,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    settings: {},
    ...data,
  }, { merge: true });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(getDb(), COLLECTIONS.USERS, uid);
  await updateDoc(docRef, { ...data, lastLogin: serverTimestamp() });
}

// ---- Trade Journal ----
export interface TradeRecord {
  id: string;
  uid: string;
  date: string;
  symbol: string;
  direction: "BUY" | "SELL";
  strategy: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  netPnl: number;
  notes: string;
  tags: string[];
  duration: string;
  optionType?: "CE" | "PE" | "NA";
  strikePrice?: number;
  expiryDate?: string;
  brokerOrderId?: string;
  broker?: string;
  status: "open" | "closed" | "cancelled";
  createdAt: any;
  closedAt?: any;
}

export async function addTrade(trade: Omit<TradeRecord, "id" | "createdAt">): Promise<string> {
  const colRef = collection(getDb(), COLLECTIONS.TRADES);
  const docRef = await addDoc(colRef, {
    ...trade,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserTrades(uid: string, limitCount = 100): Promise<TradeRecord[]> {
  const colRef = collection(getDb(), COLLECTIONS.TRADES);
  const q = query(
    colRef,
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeRecord));
}

export async function updateTrade(tradeId: string, data: Partial<TradeRecord>): Promise<void> {
  const docRef = doc(getDb(), COLLECTIONS.TRADES, tradeId);
  await updateDoc(docRef, data);
}

export async function closeTrade(tradeId: string, exitPrice: number, fees: number): Promise<void> {
  const docRef = doc(getDb(), COLLECTIONS.TRADES, tradeId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const trade = snap.data() as TradeRecord;
  const pnl = trade.direction === "BUY"
    ? (exitPrice - trade.entryPrice) * trade.quantity
    : (trade.entryPrice - exitPrice) * trade.quantity;
  const pnlPercent = (pnl / (trade.entryPrice * trade.quantity)) * 100;

  await updateDoc(docRef, {
    exitPrice,
    pnl: Number(pnl.toFixed(2)),
    pnlPercent: Number(pnlPercent.toFixed(2)),
    fees,
    netPnl: Number((pnl - fees).toFixed(2)),
    status: "closed",
    closedAt: serverTimestamp(),
  });
}

// ---- Signal Records ----
export interface SignalRecord {
  id?: string;
  uid?: string;
  symbol: string;
  direction: "BUY" | "SELL";
  confidenceScore: number;
  probability: number;
  entry: number;
  stopLoss: number;
  target: number;
  expectedRR: number;
  signalStrength: string;
  reasoning: string[];
  qualityScore: number;
  status: "active" | "triggered" | "expired" | "hit_target" | "hit_sl";
  timeframe: string;
  optionTradeSetup?: {
    contract: string;
    premiumEntry: number;
    premiumSL: number;
    premiumTarget: number;
    impliedVolatility: number;
    delta: number;
  };
  indicators: {
    rsi?: number;
    ema9?: number;
    ema21?: number;
    vwap?: number;
    macd?: { value: number; signal: number; histogram: number };
    volume?: number;
    avgVolume?: number;
  };
  generatedAt: any;
  triggeredAt?: any;
  resolvedAt?: any;
}

export async function addSignal(signal: Omit<SignalRecord, "id" | "generatedAt">): Promise<string> {
  const colRef = collection(getDb(), COLLECTIONS.SIGNALS);
  const docRef = await addDoc(colRef, {
    ...signal,
    generatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getActiveSignals(limitCount = 50): Promise<SignalRecord[]> {
  const colRef = collection(getDb(), COLLECTIONS.SIGNALS);
  const q = query(
    colRef,
    where("status", "==", "active"),
    orderBy("generatedAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SignalRecord));
}

export async function getAllSignals(limitCount = 100): Promise<SignalRecord[]> {
  const colRef = collection(getDb(), COLLECTIONS.SIGNALS);
  const q = query(
    colRef,
    orderBy("generatedAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SignalRecord));
}

export async function updateSignalStatus(
  signalId: string,
  status: SignalRecord["status"]
): Promise<void> {
  const docRef = doc(getDb(), COLLECTIONS.SIGNALS, signalId);
  await updateDoc(docRef, {
    status,
    resolvedAt: serverTimestamp(),
  });
}

// ---- Broker Config ----
export interface BrokerConfigRecord {
  id?: string;
  uid: string;
  brokerName: string;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  accessToken?: string;
  isConnected: boolean;
  capitalAllocated: number;
  autoTradingEnabled: boolean;
  lastConnectedAt?: any;
}

export async function getUserBrokerConfigs(uid: string): Promise<BrokerConfigRecord[]> {
  const colRef = collection(getDb(), COLLECTIONS.BROKER_CONFIGS);
  const q = query(colRef, where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrokerConfigRecord));
}

export async function saveBrokerConfig(config: Omit<BrokerConfigRecord, "id">): Promise<string> {
  const colRef = collection(getDb(), COLLECTIONS.BROKER_CONFIGS);
  const docRef = await addDoc(colRef, config);
  return docRef.id;
}

// ---- Real-time Listeners ----
export function onSignalsUpdate(callback: (signals: SignalRecord[]) => void) {
  const colRef = collection(getDb(), COLLECTIONS.SIGNALS);
  const q = query(
    colRef,
    where("status", "==", "active"),
    orderBy("generatedAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const signals = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SignalRecord));
    callback(signals);
  });
}

export function onTradesUpdate(uid: string, callback: (trades: TradeRecord[]) => void) {
  const colRef = collection(getDb(), COLLECTIONS.TRADES);
  const q = query(
    colRef,
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const trades = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TradeRecord));
    callback(trades);
  });
}
