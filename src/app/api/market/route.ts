import { NextResponse } from "next/server";

const SYMBOL_MAP: Record<string, string> = {
  "NIFTY 50": "%5ENSEI",
  "BANKNIFTY": "%5ENSEBANK",
  "SENSEX": "%5EBSESN",
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "HDFCBANK": "HDFCBANK.NS",
  "INFY": "INFY.NS",
  "ICICIBANK": "ICICIBANK.NS",
  "SBIN": "SBIN.NS",
  "TATAMOTORS": "TATAMOTORS.NS",
  "BAJFINANCE": "BAJFINANCE.NS",
  "INDIA VIX": "%5EINDIAVIX"
};

export async function GET() {
  const results: Record<string, any> = {};

  try {
    const promises = Object.entries(SYMBOL_MAP).map(async ([key, yfSymbol]) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1m&range=1d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          next: { revalidate: 5 } // cache for 5 seconds to prevent rate limiting
        });

        if (!res.ok) {
          return null;
        }

        const json = await res.json();
        const meta = json.chart?.result?.[0]?.meta;
        if (!meta) {
          return null;
        }

        const price = meta.regularMarketPrice || meta.price || 0;
        const prevClose = meta.chartPreviousClose || price;
        const changePercent = prevClose ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;

        return {
          key,
          data: {
            symbol: key,
            price: Number(price.toFixed(2)),
            changePercent,
            high: Number((meta.regularMarketDayHigh || price).toFixed(2)),
            low: Number((meta.regularMarketDayLow || price).toFixed(2)),
            volume: meta.regularMarketVolume || 0,
            bid: Number((price - 0.25).toFixed(2)),
            ask: Number((price + 0.25).toFixed(2))
          }
        };
      } catch (e) {
        return null;
      }
    });

    const resolved = await Promise.all(promises);
    resolved.forEach((res) => {
      if (res && res.key && res.data) {
        results[res.key] = res.data;
      }
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
