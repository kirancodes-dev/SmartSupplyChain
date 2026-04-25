"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

// Free public price proxies — mock realistic live data with slight random drift
const BASE_PRICES = [
  { symbol: "BDIY",  name: "Baltic Dry Index",  base: 1842, unit: "pts",  suffix: "" },
  { symbol: "CRUDE", name: "Brent Crude",        base: 87.4, unit: "$/bbl", suffix: "" },
  { symbol: "LNG",   name: "LNG Spot",           base: 12.8, unit: "$/mmBtu", suffix: "" },
  { symbol: "CNT",   name: "Container Rate",     base: 3240, unit: "$/FEU", suffix: "" },
];

type Price = { symbol: string; name: string; price: number; change: number; changePct: number; unit: string };

function drift(base: number, pct = 0.004): number {
  return base * (1 + (Math.random() - 0.5) * pct);
}

export default function CommodityPrices() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const tick = () => {
    setPrices(prev => BASE_PRICES.map((item, i) => {
      const prevPrice = prev[i]?.price || item.base;
      const newPrice = parseFloat(drift(prevPrice).toFixed(item.base > 100 ? 0 : 2));
      const change = parseFloat((newPrice - item.base).toFixed(2));
      const changePct = parseFloat(((change / item.base) * 100).toFixed(2));
      return { symbol: item.symbol, name: item.name, price: newPrice, change, changePct, unit: item.unit };
    }));
    setLastUpdate(new Date());
  };

  useEffect(() => {
    tick();
    const t = setInterval(tick, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/8">
      <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" /> Shipping Market Index
          </h3>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <RefreshCw size={9} className="animate-spin" /> Live Simulation
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
        {prices.map(p => {
          const up = p.change > 0;
          const flat = p.change === 0;
          const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
          const color = flat ? "text-gray-400" : up ? "text-emerald-400" : "text-red-400";
          const bg = flat ? "" : up ? "bg-emerald-500/5" : "bg-red-500/5";
          return (
            <div key={p.symbol} className={`px-4 py-3 ${bg} transition-colors duration-1000`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-gray-500 tracking-wider">{p.symbol}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${color}`}>
                  <Icon size={10} /> {up ? "+" : ""}{p.changePct}%
                </span>
              </div>
              <p className="text-lg font-black text-white leading-tight">{p.price.toLocaleString()}</p>
              <p className="text-[9px] text-gray-600 truncate">{p.name}</p>
              <p className="text-[9px] text-gray-700">{p.unit}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
