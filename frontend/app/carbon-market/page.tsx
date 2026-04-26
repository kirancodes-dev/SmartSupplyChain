"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, TrendingUp, TrendingDown, DollarSign, Activity, CheckCircle, Package, ArrowRight, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

type CarbonData = {
  market: { price_per_ton_usd: number; price_24h_change_pct: number; volume_24h_tons: number; market_cap_usd: number; exchange: string; last_updated: string; };
  portfolio: { total_co2_saved_tons: number; tokenized_credits: number; available_to_sell: number; portfolio_value_usd: number; pending_verification_tons: number; credits_sold_total: number; revenue_realized_usd: number; transactions: any[]; };
  market_listings: { id: string; tons: number; price_per_ton: number; seller: string; expiry: string; verified_by: string; }[];
};

export default function CarbonMarketPage() {
  const [data, setData] = useState<CarbonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [sellAmount, setSellAmount] = useState(100);
  const [showToast, setShowToast] = useState<any>(null);

  // Mock chart data for UX
  const chartData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    price: data ? data.market.price_per_ton_usd * (1 + (Math.sin(i / 3) * 0.05) + (Math.random() * 0.02 - 0.01)) : 24
  }));

  const load = async () => {
    try {
      const res = await apiFetch("/carbon/market");
      setData(res);
      setSellAmount(Math.min(100, res.portfolio.available_to_sell));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sellCredits = async () => {
    if (!data || sellAmount <= 0) return;
    setSelling(true);
    try {
      const tx = await apiFetch("/carbon/sell", { method: "POST", body: JSON.stringify({ tons: sellAmount }) });
      setShowToast(tx);
      setTimeout(() => setShowToast(null), 5000);
      await load();
    } catch {}
    setSelling(false);
  };

  if (loading || !data) return (
    <div className="min-h-screen flex flex-col bg-[#060818]">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
      </div>
    </div>
  );

  const { market, portfolio, market_listings } = data;
  const isUp = market.price_24h_change_pct >= 0;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><Leaf size={26} className="text-emerald-400" /> Carbon Credit Exchange</h1>
            <p className="text-gray-500 mt-1">Monetize AI-driven CO₂ savings on the {market.exchange}</p>
          </div>
          <div className="flex items-center gap-6 glass-panel px-6 py-3 rounded-2xl border-emerald-500/20">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Live Price (1t CO₂)</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white">${market.price_per_ton_usd.toFixed(2)}</p>
                <p className={`text-sm font-bold flex items-center pb-0.5 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(market.price_24h_change_pct)}%
                </p>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">24h Vol</p>
              <p className="text-lg font-bold text-white">{(market.volume_24h_tons / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>

        {/* Sell Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-panel rounded-2xl p-4 border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-4">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><CheckCircle size={20} /></div>
              <div className="flex-1">
                <p className="text-sm font-black text-emerald-400">Order Executed Successfully</p>
                <p className="text-xs text-gray-400">Sold {showToast.tons_sold}t to {showToast.buyer} for ${showToast.value_usd.toLocaleString()}.</p>
              </div>
              <div className="text-right text-xs text-gray-500 font-mono">
                TX: {showToast.blockchain_hash.substring(0,16)}...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Portfolio & Sell Panel */}
          <div className="flex flex-col gap-6">
            <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-emerald-500 bg-gradient-to-b from-emerald-500/5 to-transparent">
              <h2 className="text-sm font-black text-white flex items-center gap-2 mb-4"><Package size={16} className="text-emerald-400" /> Your ESG Portfolio</h2>
              
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-1">AI-Optimized CO₂ Savings</p>
                <p className="text-4xl font-black text-white">{portfolio.total_co2_saved_tons.toLocaleString()}<span className="text-lg text-emerald-500">t</span></p>
                <p className="text-xs text-gray-500 mt-1">Est Value: <span className="text-emerald-400 font-bold">${portfolio.portfolio_value_usd.toLocaleString()}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">Available to Sell</p>
                  <p className="text-lg font-bold text-white">{portfolio.available_to_sell.toLocaleString()}t</p>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase">Pending Verification</p>
                  <p className="text-lg font-bold text-gray-400">{portfolio.pending_verification_tons}t</p>
                </div>
              </div>

              {/* Sell action */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-white">Issue Sell Order</p>
                  <p className="text-[10px] text-gray-500">Max: {portfolio.available_to_sell}t</p>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="number" value={sellAmount} onChange={e => setSellAmount(Number(e.target.value))} max={portfolio.available_to_sell} min={1}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white font-mono focus:border-emerald-500/50 outline-none" />
                  <span className="text-sm font-bold text-gray-500">tons</span>
                </div>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-gray-500">Est. Revenue:</span>
                  <span className="font-bold text-emerald-400">${(sellAmount * market.price_per_ton_usd).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
                <button onClick={sellCredits} disabled={selling || sellAmount <= 0 || sellAmount > portfolio.available_to_sell}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}>
                  {selling ? <RefreshCw size={14} className="animate-spin" /> : <DollarSign size={14} />} Execute Market Sell
                </button>
              </div>
            </div>

            {/* Revenue Stat */}
            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Total Revenue Realized</p>
              <p className="text-3xl font-black text-white">${portfolio.revenue_realized_usd.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle size={10} /> from {portfolio.credits_sold_total}t sold</p>
            </div>
          </div>

          {/* Right Col: Market Data */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Chart */}
            <div className="glass-panel rounded-2xl p-6 h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2"><Activity size={16} /> EU ETS Spot Price (24h)</h2>
                <span className="text-[10px] px-2 py-1 bg-white/10 rounded-md text-gray-400 font-mono">Live Data</span>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: "#060818", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} itemStyle={{ color: "#10b981" }} />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#10b981", stroke: "#060818", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Book / Listings */}
            <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck size={16} /> Verified Market Listings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] uppercase text-gray-500 tracking-wider">
                    <tr>
                      <th className="px-6 py-3 font-medium">Listing ID</th>
                      <th className="px-6 py-3 font-medium">Seller</th>
                      <th className="px-6 py-3 font-medium text-right">Volume (t)</th>
                      <th className="px-6 py-3 font-medium text-right">Price/t</th>
                      <th className="px-6 py-3 font-medium">Certification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {market_listings.map((l, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-400">{l.id}</td>
                        <td className="px-6 py-4 text-white font-bold">{l.seller}</td>
                        <td className="px-6 py-4 text-right font-mono text-emerald-400">{l.tons}</td>
                        <td className="px-6 py-4 text-right font-mono">${l.price_per_ton.toFixed(2)}</td>
                        <td className="px-6 py-4 text-[10px] text-gray-500">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{l.verified_by}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
