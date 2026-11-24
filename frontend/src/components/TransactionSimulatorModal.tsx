import React, { useState } from 'react';
import { X, ShieldAlert, Zap, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { scoreTransactionManual } from '../services/api';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionScored?: (result: any) => void;
}

export const TransactionSimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, onTransactionScored }) => {
  const [formData, setFormData] = useState({
    nameOrig: 'C10000001',
    nameDest: 'M20000001',
    amount: 150.0,
    type: 'PAYMENT',
    oldbalanceOrg: 5000.0,
    newbalanceOrig: 4850.0,
    device_id: 'DEV_100001',
    card_id: 'CARD_1000000001',
    location: 'New York'
  });

  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScoring(true);
    setResult(null);
    try {
      const res = await scoreTransactionManual({
        ...formData,
        amount: Number(formData.amount),
        oldbalanceOrg: Number(formData.oldbalanceOrg),
        newbalanceOrig: Number(formData.newbalanceOrig)
      });
      setResult(res);
      if (onTransactionScored) {
        onTransactionScored(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScoring(false);
    }
  };

  const setFraudPreset = () => {
    setFormData({
      nameOrig: 'C10000002',
      nameDest: 'C_MULE_RING_DEST',
      amount: 280000.0,
      type: 'TRANSFER',
      oldbalanceOrg: 280000.0,
      newbalanceOrig: 0.0,
      device_id: 'DEV_RING_SHRD_01',
      card_id: 'CARD_RING_SHRD_99',
      location: 'Miami'
    });
  };

  const setLegitPreset = () => {
    setFormData({
      nameOrig: 'C10000001',
      nameDest: 'M20000001',
      amount: 45.0,
      type: 'PAYMENT',
      oldbalanceOrg: 3500.0,
      newbalanceOrig: 3455.0,
      device_id: 'DEV_100001',
      card_id: 'CARD_1000000001',
      location: 'New York'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#13171C] border border-[#20262E] rounded-[22px] w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#20262E] bg-[#13171C]">
          <div>
            <div className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase mb-0.5">
              SIMULATION ENGINE · MANUAL INFERENCE
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00E599]" strokeWidth={2.5} />
              <span>Real-Time Scoring Simulator</span>
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-[#8E9AA8] hover:text-white p-1.5 rounded-xl bg-[#0E1216] border border-[#20262E] hover:border-[#00E599]/40 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Presets */}
          <div className="flex gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={setLegitPreset}
              className="px-3.5 py-1.5 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 text-[#00E599] text-xs font-mono font-bold hover:bg-[#00E599]/20 transition-all active:scale-95 cursor-pointer"
            >
              Load Normal Merchant Payment ($45)
            </button>
            <button
              type="button"
              onClick={setFraudPreset}
              className="px-3.5 py-1.5 rounded-xl bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D] text-xs font-mono font-bold hover:bg-[#FF4D4D]/20 transition-all active:scale-95 cursor-pointer"
            >
              Load Fraud Syndicate Extraction ($280k)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Sender Account (nameOrig)</label>
                <input
                  type="text"
                  value={formData.nameOrig}
                  onChange={(e) => setFormData({ ...formData, nameOrig: e.target.value })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono text-white focus:outline-none focus:border-[#00E599] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Destination (nameDest)</label>
                <input
                  type="text"
                  value={formData.nameDest}
                  onChange={(e) => setFormData({ ...formData, nameDest: e.target.value })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono text-white focus:outline-none focus:border-[#00E599] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono tabular-nums font-bold text-white focus:outline-none focus:border-[#00E599] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Transaction Typology</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-sans text-white focus:outline-none focus:border-[#00E599] transition-colors"
                >
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="CASH_OUT">CASH_OUT</option>
                  <option value="DEBIT">DEBIT</option>
                  <option value="CASH_IN">CASH_IN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Origin Old Balance ($)</label>
                <input
                  type="number"
                  value={formData.oldbalanceOrg}
                  onChange={(e) => setFormData({ ...formData, oldbalanceOrg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono tabular-nums text-white focus:outline-none focus:border-[#00E599] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Origin New Balance ($)</label>
                <input
                  type="number"
                  value={formData.newbalanceOrig}
                  onChange={(e) => setFormData({ ...formData, newbalanceOrig: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono tabular-nums text-white focus:outline-none focus:border-[#00E599] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Device Identifier</label>
                <input
                  type="text"
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono text-white focus:outline-none focus:border-[#00E599] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider mb-1">Card Instrument</label>
                <input
                  type="text"
                  value={formData.card_id}
                  onChange={(e) => setFormData({ ...formData, card_id: e.target.value })}
                  className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 font-mono text-white focus:outline-none focus:border-[#00E599] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={scoring}
              className="w-full mt-4 py-3 rounded-xl bg-[#00E599] hover:bg-[#00cc88] disabled:opacity-50 text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_18px_rgba(0,229,153,0.35)] active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>{scoring ? 'Evaluating Hybrid Models...' : 'Execute Live Scoring Pipeline'}</span>
            </button>
          </form>

          {/* Scoring Output Result Well */}
          {result && (
            <div className="bg-[#0E1216] border border-[#20262E] rounded-xl p-4 text-xs font-sans space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#20262E]">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="text-[#8E9AA8] uppercase font-mono text-[10px]">Decision:</span>
                  <span className={result.risk_score >= 0.45 ? 'text-[#FF4D4D] font-bold' : 'text-[#00E599] font-bold'}>{result.decision}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  result.risk_score >= 0.45 
                    ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/35' 
                    : 'bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30'
                }`}>
                  {result.risk_tier}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-sans">
                <div>
                  <span className="text-[#8E9AA8] block text-[10px] font-mono uppercase">XGBoost Score</span>
                  <span className="font-bold font-mono tabular-nums text-[#00D8F6] text-sm">{(result.xgboost_score * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#8E9AA8] block text-[10px] font-mono uppercase">GNN Risk</span>
                  <span className="font-bold font-mono tabular-nums text-[#8B5CF6] text-sm">{(result.gnn_score * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#8E9AA8] block text-[10px] font-mono uppercase">Blended Risk</span>
                  <span className={`font-bold font-mono tabular-nums text-sm ${result.risk_score >= 0.45 ? 'text-[#FF4D4D]' : 'text-[#00E599]'}`}>
                    {(result.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-[#586574] pt-2 border-t border-[#20262E] font-mono">
                <span>Inference Latency: <strong className="text-[#00E599] tabular-nums">{result.latency_ms} ms</strong></span>
                <span>Syndicate Multiplier: <strong className="text-white">{result.syndicate_boost_applied ? '1.25x Active' : '1.00x Base'}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
