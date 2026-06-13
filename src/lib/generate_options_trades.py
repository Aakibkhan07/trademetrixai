import yfinance as yf
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import ssl
import json
import os

# Bypass SSL verify context for urllib requests
ssl._create_default_https_context = ssl._create_unverified_context

# List of strategies from dummy-data.ts
STRATEGIES = [
    {"name": "EMA 9/15 Scalper", "category": "Scalping", "tags": ["EMA", "Scalping", "Index"]},
    {"name": "SSMA Trend Rider", "category": "Trend Following", "tags": ["SSMA", "Trend", "Swing"]},
    {"name": "Opening Range Breakout", "category": "Breakout", "tags": ["ORB", "Breakout", "Intraday"]},
    {"name": "Momentum Hunter", "category": "Momentum", "tags": ["Momentum", "RSI", "MACD"]},
    {"name": "Volume Expansion", "category": "Volume", "tags": ["Volume", "Institutional", "Accuracy"]},
    {"name": "Smart Money Concept", "category": "Smart Money", "tags": ["SMC", "Order Block", "Liquidity"]},
    {"name": "VWAP Reversal", "category": "Mean Reversion", "tags": ["VWAP", "Reversal", "Mean Reversion"]},
    {"name": "Option Scalper", "category": "Options", "tags": ["Options", "Scalping", "Premium"]},
    {"name": "ICT Silver Bullet", "category": "Smart Money", "tags": ["ICT", "Silver Bullet", "FVG"]},
    {"name": "Order Block Mitigation", "category": "Smart Money", "tags": ["OB", "Mitigation", "SMC"]},
    {"name": "Liquidity Run (BSL/SSL Sweep)", "category": "Liquidity", "tags": ["Liquidity", "BSL", "SSL", "Sweeps"]},
    {"name": "Premium/Discount Mean Reversion", "category": "Mean Reversion", "tags": ["Fibonacci", "Discount", "Equilibrium"]},
    {"name": "Bollinger Band Rebound", "category": "Mean Reversion", "tags": ["Bollinger", "Bands", "Reversion"]},
    {"name": "Supertrend Alpha Crossover", "category": "Trend Following", "tags": ["Supertrend", "Trend", "Crossover"]},
    {"name": "Heikin Ashi Momentum Ride", "category": "Momentum", "tags": ["HeikinAshi", "Momentum", "NoiseFilter"]},
    {"name": "Volume Spread Analysis", "category": "Volume", "tags": ["VSA", "Accumulation", "Distribution"]},
    {"name": "MACD Divergence Sniper", "category": "Momentum", "tags": ["MACD", "Divergence", "Sniper"]},
    {"name": "Fibonacci Golden Pocket", "category": "Mean Reversion", "tags": ["Fibonacci", "GoldenPocket", "Pullback"]},
    {"name": "Inside Bar Breakout", "category": "Breakout", "tags": ["InsideBar", "Breakout", "Volatility"]},
    {"name": "Iron Condor Delta-Neutral", "category": "Options", "tags": ["IronCondor", "Options", "DeltaNeutral"]},
    {"name": "Weekly Straddle Arbitrage", "category": "Options", "tags": ["Straddle", "Arbitrage", "Volatility"]},
    {"name": "CPR Pivot Bounce", "category": "Mean Reversion", "tags": ["CPR", "Pivots", "Intraday"]},
    {"name": "Dynamic Trailing Follower", "category": "Trend Following", "tags": ["ATR", "TrailingStop", "Trend"]},
    {"name": "High-Frequency Arbitrage", "category": "Scalping", "tags": ["HFT", "Arbitrage", "Microseconds"]},
    {"name": "HNI Multi-Asset Index Basket", "category": "HNI Exclusive", "tags": ["HNI", "MultiAsset", "Hedging", "SafeGrowth"]},
    {"name": "Delta Hedging Options Engine", "category": "Options", "tags": ["HNI", "DeltaHedging", "Algorithmic", "Spread"]},
    {"name": "Smart Money Mega-Sized Sweeps", "category": "Smart Money", "tags": ["HNI", "BlockTrades", "FIIFlow", "HighSize"]},
    {"name": "Algorithmic Equity Momentum Lab", "category": "Momentum", "tags": ["HNI", "Midcaps", "Alpha", "Momentum"]},
    {"name": "Cross-Broker Volatility Arbitrage", "category": "HNI Exclusive", "tags": ["HNI", "Arbitrage", "LowRisk", "Feeds"]},
    {"name": "Institutional Index Arbitrage", "category": "HNI Exclusive", "tags": ["HNI", "Arbitrage", "Index", "Riskless"]}
]

def get_next_thursday(date_str):
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    days_ahead = 3 - dt.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    next_thu = dt + timedelta(days=days_ahead)
    return next_thu.strftime("%d %b %Y")

def generate_trades():
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)
    
    print("Downloading ^NSEI and ^NSEBANK daily close rates from Yahoo...")
    nifty_df = yf.download("^NSEI", start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
    banknifty_df = yf.download("^NSEBANK", start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
    
    if nifty_df.empty or banknifty_df.empty:
        print("Error: downloaded data was empty.")
        return
        
    nifty_df = nifty_df.reset_index()
    banknifty_df = banknifty_df.reset_index()
    
    nifty_df.columns = [c[0] if isinstance(c, tuple) else c for c in nifty_df.columns]
    banknifty_df.columns = [c[0] if isinstance(c, tuple) else c for c in banknifty_df.columns]
    
    nifty_records = nifty_df.to_dict('records')
    banknifty_records = banknifty_df.to_dict('records')
    
    # We want exactly 177 trades (about 3 trades per day across ~59 trading days)
    trading_days = nifty_records
    num_days = len(trading_days)
    total_trades_count = num_days * 3
    
    # Target exactly 74.3% win rate
    target_wins = int(total_trades_count * 0.743)
    results = [True] * target_wins + [False] * (total_trades_count - target_wins)
    random.shuffle(results)
    
    generated_trades = []
    trade_index = 0
    
    for i, day_row in enumerate(trading_days):
        date_obj = day_row['Date']
        # yfinance index is pandas Timestamp; convert to string
        date_str = date_obj.strftime("%Y-%m-%d") if hasattr(date_obj, 'strftime') else str(date_obj).split(" ")[0]
        
        # Get Nifty & BankNifty indices levels for this date
        nifty_close = float(day_row['Close'].iloc[0]) if isinstance(day_row['Close'], pd.Series) else float(day_row['Close'])
        nifty_open = float(day_row['Open'].iloc[0]) if isinstance(day_row['Open'], pd.Series) else float(day_row['Open'])
        
        # Find BankNifty row for the same date
        bn_row = None
        for row in banknifty_records:
            r_date = row['Date'].strftime("%Y-%m-%d") if hasattr(row['Date'], 'strftime') else str(row['Date']).split(" ")[0]
            if r_date == date_str:
                bn_row = row
                break
        
        if bn_row:
            bn_close = float(bn_row['Close'].iloc[0]) if isinstance(bn_row['Close'], pd.Series) else float(bn_row['Close'])
            bn_open = float(bn_row['Open'].iloc[0]) if isinstance(bn_row['Open'], pd.Series) else float(bn_row['Open'])
        else:
            bn_close = 50120.0
            bn_open = 49990.0

        # Generate 3 trades for this day
        for t_idx in range(3):
            is_win = results[trade_index]
            trade_index += 1
            
            # Select symbol index
            use_nifty = random.random() > 0.35
            index_name = "NIFTY" if use_nifty else "BANKNIFTY"
            index_close = nifty_close if use_nifty else bn_close
            index_open = nifty_open if use_nifty else bn_open
            
            # Strike Price
            if use_nifty:
                strike = int(round(index_close / 50.0) * 50)
            else:
                strike = int(round(index_close / 100.0) * 100)
                
            # Option Type
            is_green_day = index_close > index_open
            if is_green_day:
                option_type = "CE" if random.random() > 0.40 else "PE"
            else:
                option_type = "PE" if random.random() > 0.40 else "CE"
                
            # Strategy selection - cycle through all 30 strategies to ensure full coverage
            strat = STRATEGIES[trade_index % len(STRATEGIES)]
            
            # Direction
            direction = "BUY" if random.random() > 0.15 else "SELL"
            
            # Lots and quantities
            lot_size = 25 if use_nifty else 15
            lot_count = random.randint(8, 45)
            quantity = lot_size * lot_count
            
            # Expiry date
            expiry_str = get_next_thursday(date_str)
            
            # Entry Price
            entry_price = round(random.uniform(90.0, 310.0), 2)
            
            # Exit Price based on Win/Loss
            if is_win:
                if direction == "BUY":
                    exit_pct = random.uniform(0.35, 1.45)
                    exit_price = round(entry_price * (1 + exit_pct), 2)
                else:  # Options writing (SELL) - profit when option price drops
                    exit_pct = random.uniform(0.40, 0.95)
                    exit_price = round(entry_price * (1 - exit_pct), 2)
            else:
                if direction == "BUY":
                    exit_pct = random.uniform(0.20, 0.35) # Hit stop loss
                    exit_price = round(entry_price * (1 - exit_pct), 2)
                else:  # Options writing (SELL) - loss when option price surges
                    exit_pct = random.uniform(0.30, 0.85)
                    exit_price = round(entry_price * (1 + exit_pct), 2)
                    
            # Gross PnL
            if direction == "BUY":
                pnl = round((exit_price - entry_price) * quantity, 2)
            else:
                pnl = round((entry_price - exit_price) * quantity, 2)
                
            pnl_pct = round((pnl / (entry_price * quantity)) * 100, 2)
            
            # Dynamic brokerage and taxes (fees)
            brokerage = 40.00 # Entry + Exit standard brokerage
            stt = round((exit_price * quantity * 0.0006) if direction == "BUY" else (entry_price * quantity * 0.0006), 2)
            gst_clearing = round(random.uniform(8.00, 22.00), 2)
            fees = round(brokerage + stt + gst_clearing, 2)
            net_pnl = round(pnl - fees, 2)
            
            # Details Note and Duration
            duration_minutes = random.choice([8, 12, 15, 25, 40, 60, 90, 150])
            duration_str = f"{duration_minutes}min" if duration_minutes < 60 else f"{duration_minutes//60}hr {duration_minutes%60}min"
            
            notes_templates = {
                "Scalping": [
                    f"Rapid crossover scalp. {index_name} spot price tapped daily support before accelerating.",
                    f"VWAP breakout momentum on {index_name} option chart. High volume candle sweep verified."
                ],
                "Trend Following": [
                    f"Macro trend expansion on {index_name}. Supertrend crossover (10,3) aligned with positive daily close.",
                    f"Riding multi-hour trend channel on {index_name}. ATR trailing stops held the position safely."
                ],
                "Breakout": [
                    f"Opening range volatility contraction breakout on {index_name} weekly option.",
                    f"Resistance ceiling swept with volume confirmation. Fast index breakout rally."
                ],
                "Smart Money": [
                    f"Tapped 5m breaker block on {index_name} spot index. Order block mitigation complete.",
                    f"Liquidity pool sweep above Asia session high. Rejection candle entry confirmed."
                ],
                "Mean Reversion": [
                    f"Extremes expansion outside Bollinger Band 2.0. Tapped horizontal support before reversal.",
                    f"Fibonacci golden pocket (61.8%) bounce. Rebounding from discount equilibrium area."
                ],
                "Options": [
                    f"Delta-neutral options rollover setup. Premium decay harvested efficiently.",
                    f"Weekly straddle arbitrage based on IV crush. Multi-leg basket cleared successfully."
                ],
                "HNI Exclusive": [
                    f"HNI Split clear routing: block trades split across Dhan/Zerodha. Systemic risk shielded.",
                    f"Tax-optimised options writing rollover setup. Low drawdowns verified on institutional desk."
                ]
            }
            
            cat_key = strat["category"]
            if cat_key not in notes_templates:
                cat_key = "Smart Money"
            note = random.choice(notes_templates[cat_key])
            
            # Cryptographic details
            iv = round(random.uniform(12.5, 24.2), 1)
            delta = round(random.uniform(0.38, 0.62) * (1 if option_type == "CE" else -1), 2)
            
            trade_entry = {
                "id": f"t-hist-{trade_index:03d}",
                "date": date_str,
                "symbol": f"{index_name} {strike} {option_type}",
                "direction": direction,
                "strategy": strat["name"],
                "entryPrice": entry_price,
                "exitPrice": exit_price,
                "quantity": quantity,
                "pnl": pnl,
                "pnlPercent": pnl_pct,
                "fees": fees,
                "netPnl": net_pnl,
                "notes": note,
                "tags": strat["tags"] + [option_type, index_name],
                "duration": duration_str,
                "optionType": option_type,
                "strikePrice": strike,
                "expiryDate": expiry_str,
                "impliedVolatility": iv
            }
            
            generated_trades.append(trade_entry)

    # Sort trades descending chronologically
    generated_trades.sort(key=lambda x: (x["date"], x["id"]), reverse=True)
    
    # Write to trade-history.ts
    output_path = os.path.join(os.path.dirname(__file__), "trade-history.ts")
    print(f"Writing {len(generated_trades)} trades to {output_path}...")
    
    with open(output_path, "w") as f:
        f.write('import { TradeEntry } from "./types";\n\n')
        f.write('export const historicalTrades: TradeEntry[] = ')
        f.write(json.dumps(generated_trades, indent=2))
        f.write(';\n')
        
    print("Done! Options trade logs generated successfully.")

if __name__ == "__main__":
    generate_trades()
