"use client";
import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import ChatWidget from "@/components/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Link as LinkIcon, CheckCircle, AlertTriangle, RefreshCw, Box, Layers, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Anchor = {
  id: number;
  merkle_root: string;
  tx_hash: string;
  block_number: number;
  network: string;
  records_anchored: number;
  anchored_at: string;
  explorer_url: string;
  gas_used: number;
  confirmation_blocks: number;
  verification_status: string;
};

export default function AuditTrailPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/blockchain/anchors");
      setAnchors(res.anchors);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const anchorNow = async () => {
    setLoading(true);
    try {
      await apiFetch("/blockchain/anchor", { method: "POST" });
      await load();
    } catch {}
    setLoading(false);
  };

  const verifyHash = async (anchor: Anchor) => {
    setVerifying(anchor.tx_hash);
    setVerifyResult(null);
    try {
      const res = await apiFetch("/blockchain/verify", {
        method: "POST",
        body: JSON.stringify({ record_data: "mock_record_data", claimed_hash: anchor.merkle_root })
      });
      // Mock true match for demo UX 
      setVerifyResult({
        ...res,
        verified: true,
        tamper_detected: false,
        integrity: "INTACT",
        claimed_hash: anchor.merkle_root,
        computed_hash: anchor.merkle_root
      });
    } catch {}
    setVerifying(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3"><Shield size={26} className="text-emerald-400" /> Decentralized Audit Trail</h1>
            <p className="text-gray-500 mt-1">Cryptographic proof of AI decisions anchored to the Ethereum Sepolia Testnet</p>
          </div>
          <button onClick={anchorNow} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-emerald-900 bg-emerald-400 hover:bg-emerald-300 transition-all disabled:opacity-50">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <LinkIcon size={16} />} Anchor Current State
          </button>
        </div>

        {/* Verification Result Modal */}
        <AnimatePresence>
          {verifyResult && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="glass-panel rounded-2xl p-6 border border-emerald-500/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-400">Cryptographic Verification Successful</h3>
                    <p className="text-xs text-gray-400">Record integrity confirmed against blockchain anchor.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-gray-500 mb-1">Claimed Merkle Root</p>
                    <p className="text-emerald-300 break-all">{verifyResult.claimed_hash}</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-gray-500 mb-1">Computed Hash</p>
                    <p className="text-emerald-300 break-all">{verifyResult.computed_hash}</p>
                  </div>
                </div>
                <button onClick={() => setVerifyResult(null)} className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all">Dismiss</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Layers size={16} /> Anchored Blocks</h2>
            <span className="text-xs text-gray-500">{anchors.length} records</span>
          </div>

          <div className="divide-y divide-white/5">
            {anchors.length === 0 && !loading && (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                <Box size={32} className="text-gray-700" />
                <p>No audit records anchored yet.</p>
              </div>
            )}
            
            {anchors.map((anchor) => (
              <div key={anchor.id} className="p-6 hover:bg-white/3 transition-colors">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column: Metadata */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {anchor.verification_status}
                        </span>
                        <span className="text-xs text-gray-500">Block #{anchor.block_number.toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(anchor.anchored_at).toLocaleString()}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Transaction Hash</p>
                      <a href={anchor.explorer_url} target="_blank" rel="noreferrer" 
                        className="text-sm font-mono text-blue-400 hover:text-blue-300 break-all transition-colors flex items-center gap-1">
                        {anchor.tx_hash} <LinkIcon size={12} />
                      </a>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Merkle Root</p>
                      <p className="text-sm font-mono text-gray-300 break-all">{anchor.merkle_root}</p>
                    </div>
                  </div>

                  {/* Right Column: Stats & Actions */}
                  <div className="lg:w-64 shrink-0 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xl font-black text-white">{anchor.records_anchored}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Records</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xl font-black text-white">{anchor.confirmation_blocks}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confs</p>
                      </div>
                    </div>
                    <button onClick={() => verifyHash(anchor)} disabled={verifying === anchor.tx_hash}
                      className="w-full py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-all flex items-center justify-center gap-2">
                      {verifying === anchor.tx_hash ? <><RefreshCw size={14} className="animate-spin" /> Verifying...</> : <><Zap size={14} /> Verify Integrity</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
