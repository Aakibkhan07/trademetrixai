// ============================================================
// TRADE METRIX AI — Unified Broker API Abstraction
// ============================================================
// Primary implementation: OpenAlgo (works with any Indian broker)
// ============================================================

export interface BrokerConfig {
  provider: "openalgo" | "manual";
  apiKey: string;
  host: string;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  brokerName?: string;
  clientId?: string;
}

export interface Position {
  symbol: string;
  exchange: string;
  product: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  exchange: string;
  orderType: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  triggerPrice?: number;
  status: "OPEN" | "COMPLETE" | "CANCELLED" | "REJECTED" | "PENDING";
  filledQuantity: number;
  averagePrice: number;
  timestamp: string;
  product: string;
}

export interface Holding {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  investedValue: number;
  currentValue: number;
}

export interface FundData {
  availableCash: number;
  usedMargin: number;
  totalBalance: number;
  collateral: number;
}

export interface OrderRequest {
  symbol: string;
  exchange: "NSE" | "BSE" | "NFO" | "MCX";
  action: "BUY" | "SELL";
  quantity: number;
  orderType: "MARKET" | "LIMIT" | "SL" | "SL-M";
  product: "MIS" | "NRML" | "CNC";
  price?: number;
  triggerPrice?: number;
  disclosedQuantity?: number;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  message: string;
}

export interface OrderStatus {
  orderId: string;
  status: Order["status"];
  filledQuantity: number;
  averagePrice: number;
  message?: string;
}

export class OpenAlgoBroker {
  private apiKey: string;
  private host: string;
  private connected: boolean = false;

  constructor(config: BrokerConfig) {
    this.apiKey = config.apiKey;
    this.host = config.host.replace(/\/$/, "");
  }

  private async request(method: "GET" | "POST", endpoint: string, body?: any): Promise<any> {
    const url = `${this.host}${endpoint}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const fetchOptions: RequestInit = { method, headers };

    if (method === "POST" && body) {
      fetchOptions.body = JSON.stringify({ ...body, apikey: this.apiKey });
    } else if (method === "GET") {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAlgo API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  async connect(): Promise<ConnectionResult> {
    try {
      await this.request("POST", "/api/v1/funds", {});
      this.connected = true;
      return { success: true, message: "Connected to broker via OpenAlgo", brokerName: "OpenAlgo Bridge" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to connect to OpenAlgo" };
    }
  }

  async disconnect(): Promise<void> { this.connected = false; }
  isConnected(): boolean { return this.connected; }

  async getPositions(): Promise<Position[]> {
    try {
      const data = await this.request("POST", "/api/v1/positionbook", {});
      if (!data?.data || !Array.isArray(data.data)) return [];
      return data.data.map((p: any) => ({
        symbol: p.symbol || p.tradingsymbol || "",
        exchange: p.exchange || "",
        product: p.product || "",
        quantity: Number(p.quantity || p.netqty || 0),
        averagePrice: Number(p.averageprice || p.buyavgprice || 0),
        lastPrice: Number(p.ltp || p.lastprice || 0),
        pnl: Number(p.pnl || p.realised || 0),
        pnlPercent: 0,
      }));
    } catch { return []; }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const data = await this.request("POST", "/api/v1/orderbook", {});
      if (!data?.data || !Array.isArray(data.data)) return [];
      return data.data.map((o: any) => ({
        orderId: String(o.orderid || o.order_id || ""),
        symbol: o.symbol || o.tradingsymbol || "",
        exchange: o.exchange || "",
        orderType: o.ordertype || o.order_type || "",
        side: (o.transactiontype || o.action || "").toUpperCase() as "BUY" | "SELL",
        quantity: Number(o.quantity || 0),
        price: Number(o.price || 0),
        triggerPrice: Number(o.triggerprice || 0),
        status: mapOrderStatus(o.status || o.orderstatus || ""),
        filledQuantity: Number(o.filledshares || o.filled_quantity || 0),
        averagePrice: Number(o.averageprice || 0),
        timestamp: o.ordertime || o.exchange_timestamp || "",
        product: o.product || "",
      }));
    } catch { return []; }
  }

  async getHoldings(): Promise<Holding[]> {
    try {
      const data = await this.request("POST", "/api/v1/holdings", {});
      if (!data?.data || !Array.isArray(data.data)) return [];
      return data.data.map((h: any) => ({
        symbol: h.symbol || h.tradingsymbol || "",
        exchange: h.exchange || "",
        quantity: Number(h.quantity || 0),
        averagePrice: Number(h.averageprice || h.average_price || 0),
        lastPrice: Number(h.ltp || h.lastprice || 0),
        pnl: Number(h.pnl || h.profitandloss || 0),
        investedValue: Number(h.quantity || 0) * Number(h.averageprice || 0),
        currentValue: Number(h.quantity || 0) * Number(h.ltp || h.lastprice || 0),
      }));
    } catch { return []; }
  }

  async getFunds(): Promise<FundData> {
    try {
      const data = await this.request("POST", "/api/v1/funds", {});
      return {
        availableCash: Number(data?.data?.availablecash || data?.data?.available_cash || 0),
        usedMargin: Number(data?.data?.utiliseddebits || data?.data?.used_margin || 0),
        totalBalance: Number(data?.data?.net || data?.data?.total_balance || 0),
        collateral: Number(data?.data?.collateral || 0),
      };
    } catch { return { availableCash: 0, usedMargin: 0, totalBalance: 0, collateral: 0 }; }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    try {
      const payload = {
        symbol: order.symbol,
        exchange: order.exchange,
        action: order.action,
        quantity: order.quantity.toString(),
        pricetype: order.orderType,
        product: order.product,
        price: order.price?.toString() || "0",
        trigger_price: order.triggerPrice?.toString() || "0",
        disclosed_quantity: order.disclosedQuantity?.toString() || "0",
      };
      const data = await this.request("POST", "/api/v1/placeorder", payload);
      return {
        success: data?.status === "success",
        orderId: data?.data?.orderid || data?.orderid,
        message: data?.message || "Order placed",
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Order placement failed" };
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const data = await this.request("POST", "/api/v1/cancelorder", { orderid: orderId });
      return data?.status === "success";
    } catch { return false; }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return { orderId, status: "PENDING", filledQuantity: 0, averagePrice: 0, message: "Order not found" };
    return { orderId: order.orderId, status: order.status, filledQuantity: order.filledQuantity, averagePrice: order.averagePrice };
  }
}

function mapOrderStatus(raw: string): Order["status"] {
  const s = raw.toUpperCase();
  if (s.includes("COMPLETE") || s.includes("FILLED")) return "COMPLETE";
  if (s.includes("CANCEL")) return "CANCELLED";
  if (s.includes("REJECT")) return "REJECTED";
  if (s.includes("OPEN") || s.includes("TRIGGER")) return "OPEN";
  return "PENDING";
}

export class BrokerManager {
  private static instance: BrokerManager | null = null;
  private broker: OpenAlgoBroker | null = null;

  static getInstance(): BrokerManager {
    if (!BrokerManager.instance) BrokerManager.instance = new BrokerManager();
    return BrokerManager.instance;
  }

  async initialize(config: BrokerConfig): Promise<ConnectionResult> {
    this.broker = new OpenAlgoBroker(config);
    return this.broker.connect();
  }

  getBroker(): OpenAlgoBroker | null { return this.broker; }
  isConnected(): boolean { return this.broker?.isConnected() || false; }

  async disconnect(): Promise<void> {
    await this.broker?.disconnect();
    this.broker = null;
  }
}
