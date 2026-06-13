// ============================================================
// TRADE METRIX AI — TypeScript Interfaces
// ============================================================

// --- Dashboard ---
export interface DashboardStats {
  aiEngineStatus: "active" | "inactive" | "calibrating";
  marketStatus: "open" | "closed" | "pre-market" | "post-market";
  capital: number;
  todayPnl: number;
  todayPnlPercent: number;
  activeStrategies: number;
  winRate: number;
  totalTrades: number;
  totalProfit: number;
}

export interface HeatmapCell {
  symbol: string;
  sector: string;
  change: number;
  volume: number;
}

export interface InstitutionalFlowData {
  date: string;
  fiiNet: number;
  diiNet: number;
}

export interface MarketBreadth {
  advancing: number;
  declining: number;
  unchanged: number;
}

// --- AI Signal Engine ---
export type SignalDirection = "BUY" | "SELL";
export type SignalStrength = "Strong" | "Moderate" | "Weak";
export type SignalStatus = "active" | "triggered" | "expired" | "cancelled";

export interface Signal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  confidenceScore: number;
  probability: number;
  entry: number;
  stopLoss: number;
  target: number;
  expectedRR: number;
  signalStrength: SignalStrength;
  generatedTime: string;
  reasoning: string[];
  qualityScore: number;
  status: SignalStatus;
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

// --- Strategy Marketplace ---
export type RiskRating = 1 | 2 | 3 | 4 | 5;

export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  winRate: number;
  monthlyReturn: number;
  riskRating: RiskRating;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  isActive: boolean;
  isPremium: boolean;
  tags: string[];
  minInvestment?: number;
  isHniOnly?: boolean;
}

// --- Strategy Builder ---
export type ConditionOperator = ">" | "<" | ">=" | "<=" | "==" | "crosses_above" | "crosses_below";
export type ConditionAction = "BUY" | "SELL";
export type LogicOperator = "AND" | "OR";

export interface ConditionBlock {
  id: string;
  indicator: string;
  parameter?: string;
  operator: ConditionOperator;
  value: string;
  logicOperator?: LogicOperator;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  conditions: ConditionBlock[];
  action: ConditionAction;
  stopLossPercent: number;
  targetPercent: number;
  timeframe: string;
}

// --- Backtesting ---
export interface BacktestConfig {
  strategyId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  netProfit: number;
  netProfitPercent: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  trades: BacktestTrade[];
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

export interface MonthlyReturn {
  month: string;
  year: number;
  returnPercent: number;
  trades: number;
}

export interface BacktestTrade {
  id: string;
  entryDate: string;
  exitDate: string;
  direction: SignalDirection;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  holdingPeriod: string;
}

export type BrokerName =
  | "Dhan"
  | "Zerodha"
  | "Angel One"
  | "Shoonya"
  | "Fyers"
  | "Upstox"
  | "Groww"
  | "Kotak Securities"
  | "5paisa"
  | "IIFL Securities"
  | "Motilal Oswal"
  | "ICICI Direct"
  | "HDFC Securities"
  | "Sharekhan"
  | "Alice Blue";
export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export interface BrokerConfig {
  id: string;
  name: BrokerName;
  logo: string;
  status: ConnectionStatus;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  capitalAllocated: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  autoTradingEnabled: boolean;
  todayPnl: number;
  tradesExecuted: number;
}

export interface RiskSettings {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  riskPerTrade: number;
  emergencyStopEnabled: boolean;
  trailingStopEnabled: boolean;
}

// --- Trade Journal ---
export interface TradeEntry {
  id: string;
  date: string;
  symbol: string;
  direction: SignalDirection;
  strategy: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  netPnl: number;
  notes: string;
  screenshotUrl?: string;
  tags: string[];
  duration: string;
  optionType?: "CE" | "PE" | "NA";
  strikePrice?: number;
  expiryDate?: string;
  impliedVolatility?: number;
}

// --- Analytics ---
export interface AnalyticsData {
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  winLossRatio: { wins: number; losses: number };
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  avgDailyReturn: number;
  volatility: number;
  calmarRatio: number;
  strategyPerformance: StrategyPerformance[];
}

export interface StrategyPerformance {
  name: string;
  winRate: number;
  totalReturn: number;
  trades: number;
  avgPnl: number;
  profitFactor: number;
}

// --- Market Intelligence ---
export interface MarketSentiment {
  overall: number; // -100 to 100
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  bullishProbability: number;
  bearishProbability: number;
}

export interface SectorStrength {
  name: string;
  strength: number; // -100 to 100
  change: number;
  volume: string;
}

export interface SmartMoneyActivity {
  id: string;
  time: string;
  type: "accumulation" | "distribution" | "block_deal" | "bulk_deal";
  symbol: string;
  value: number;
  description: string;
}

export interface VolatilityData {
  indiaVix: number;
  vixChange: number;
  vixTrend: "rising" | "falling" | "stable";
  historicalAvg: number;
}

// --- Telegram ---
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isConnected: boolean;
  autoSendEnabled: boolean;
  signalTemplate: string;
  lastMessageSent?: string;
  messagesSentToday: number;
}

// --- Settings ---
export interface UserSettings {
  theme: "dark" | "light" | "system";
  notifications: {
    signalAlerts: boolean;
    tradeExecuted: boolean;
    dailySummary: boolean;
    riskAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  risk: RiskSettings;
  apiKeys: {
    dhan?: string;
    zerodha?: string;
    angelOne?: string;
    shoonya?: string;
  };
  profile: {
    name: string;
    email: string;
    phone?: string;
    plan: "free" | "pro" | "institutional";
  };
}

// --- Navigation ---
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
}

// --- Live Ticker & Market Intelligence ---
export interface LiveTick {
  symbol: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  bid: number;
  ask: number;
  lastHistory?: number[]; // for sparklines
}

export interface LiquidityPool {
  id: string;
  symbol: string;
  level: number;
  type: "BSL" | "SSL";
  strength: 1 | 2 | 3; // Strength indicators
  description: string;
}

