// ============================================================
// TRADE METRIX AI — Broker API Route
// ============================================================
// POST /api/broker — Proxy requests to OpenAlgo
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      host = process.env.NEXT_PUBLIC_OPENALGO_HOST || "http://127.0.0.1:5000",
      apiKey = process.env.NEXT_PUBLIC_OPENALGO_API_KEY || "",
      ...params
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenAlgo API key not configured. Set it in Settings → Broker Connections." },
        { status: 400 }
      );
    }

    const endpointMap: Record<string, string> = {
      funds: "/api/v1/funds",
      positions: "/api/v1/positionbook",
      orders: "/api/v1/orderbook",
      holdings: "/api/v1/holdings",
      placeorder: "/api/v1/placeorder",
      cancelorder: "/api/v1/cancelorder",
      modifyorder: "/api/v1/modifyorder",
    };

    const endpoint = endpointMap[action];
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}. Available: ${Object.keys(endpointMap).join(", ")}` },
        { status: 400 }
      );
    }

    const res = await fetch(`${host}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, apikey: apiKey }),
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      action,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Broker API request failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Broker API ready",
    availableActions: ["funds", "positions", "orders", "holdings", "placeorder", "cancelorder", "modifyorder"],
    docs: "POST with { action: 'funds', apiKey: 'your-key', host: 'http://...' }",
  });
}
