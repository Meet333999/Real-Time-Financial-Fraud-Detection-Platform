import React, { useEffect, useState, useRef } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  ExternalLink,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { fetchTransactions, ScoredTransaction } from '../services/api';

export const LiveTransactionMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<ScoredTransaction[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<ScoredTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const loadInitial = async () => {
    try {
      const res = await fetchTransactions(100);
      if (res && res.transactions) {
        setTransactions(res.transactions);
        if (!selectedTxn && res.transactions.length > 0) {
          setSelectedTxn(res.transactions[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInitial();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live-transactions`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const newTxn: ScoredTransaction = JSON.parse(event.data);
          setTransactions((prev) => [newTxn, ...prev.slice(0, 150)]);
        } catch (e) {
          console.error('Error parsing live WS transaction', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }

    const pollInterval = setInterval(loadInitial, 3000);

    return () => {
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const filtered = transactions.filter((t) => {
    const matchesRisk = filterRisk === 'ALL' || t.risk_category === filterRisk;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      t.transaction_id.toLowerCase().includes(q) ||
      t.nameOrig.toLowerCase().includes(q) ||
      t.nameDest.toLowerCase().includes(q);
    return matchesRisk && matchesSearch;
  });

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'HIGH_RISK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/35">
            HIGH RISK
          </span>
        );
      case 'MEDIUM_RISK':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/35">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/35">
            LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Filter and Search Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#13171C] border border-[#20262E] p-4 rounded-2xl shadow-card-glow min-w-0">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8E9AA8] absolute left-3 top-2.5" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by transaction or account ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0E1216] border border-[#20262E] rounded-xl text-xs font-mono text-white placeholder-[#586574] focus:outline-none focus:border-[#00E599] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0E1216] border border-[#20262E] p-1 rounded-full text-xs font-sans">
            {['ALL', 'HIGH_RISK', 'MEDIUM_RISK', 'LOW_RISK'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-3 py-1 rounded-full transition-all text-xs font-medium cursor-pointer ${
                  filterRisk === r
                    ? 'bg-[#1A2027] text-[#00E599] font-bold border border-[#00E599]/40'
                    : 'text-[#8E9AA8] hover:text-white'
                }`}
              >
                {r === 'ALL' ? 'All Tiers' : r.replace('_RISK', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry Status Capsule */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1216] border border-[#20262E] text-xs font-sans text-white shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.8)] animate-pulse"></span>
          <span>{wsConnected ? 'WebSocket Live' : 'Active Event Stream'}</span>
          <span className="text-[#586574]">|</span>
          <span className="text-[#8E9AA8] font-mono tabular-nums">{filtered.length} visible</span>
        </div>
      </div>

      {/* Main Grid: Live Table + Real-time Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
        {/* Ingested Stream Table (xl:col-span-8) */}
        <div className="xl:col-span-8 bg-[#13171C] border border-[#20262E] rounded-2xl overflow-hidden flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="px-6 py-4 border-b border-[#20262E] flex justify-between items-center bg-[#13171C]">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">INGESTION · FEED</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <Radio className="w-4 h-4 text-[#00E599]" strokeWidth={2} />
                <span>Live Scored Transaction Feed</span>
              </h3>
            </div>
            <span className="text-xs font-mono text-[#586574] uppercase">STEP 721+ CHRONO</span>
          </div>

          <div className="overflow-x-auto max-h-[620px] overflow-y-auto min-w-0">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#0E1216] border-b border-[#20262E] text-[#8E9AA8] sticky top-0 font-medium">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">XGB Score</th>
                  <th className="py-3 px-3 text-center">GNN Risk</th>
                  <th className="py-3 px-3 text-center">Combined</th>
                  <th className="py-3 px-3">Decision</th>
                  <th className="py-3 px-4 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20262E] font-sans">
                {filtered.map((t) => {
                  const isSelected = selectedTxn?.transaction_id === t.transaction_id;
                  return (
                    <tr
                      key={t.transaction_id}
                      onClick={() => setSelectedTxn(t)}
                      className={`cursor-pointer transition-colors hover:bg-[#1A2027]/70 ${
                        isSelected ? 'bg-[#1A2027] border-l-4 border-[#00E599]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-white">{t.transaction_id}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#0E1216] border border-[#20262E] text-[10px] font-mono text-[#8E9AA8]">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-white">
                        ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-[#8E9AA8]">{t.xgboost_score.toFixed(3)}</td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-[#8E9AA8]">{t.graph_risk_score.toFixed(3)}</td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-white">{t.combined_risk_score.toFixed(3)}</td>
                      <td className="py-3 px-3">{getRiskBadge(t.risk_category)}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#00E599] font-semibold">{t.latency_ms} ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Transaction Deep Inspector (xl:col-span-4) */}
        <div className="xl:col-span-4 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#20262E]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">INSPECTION · ENSEMBLE</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  <Shield className="w-4 h-4 text-[#00E599]" strokeWidth={2} />
                  <span>AI Risk Attribution</span>
                </h3>
              </div>
              {selectedTxn && getRiskBadge(selectedTxn.risk_category)}
            </div>

            {selectedTxn ? (
              <div className="mt-4 space-y-4">
                <div className="bg-[#0E1216] border border-[#1C232B] p-4 rounded-xl space-y-2 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Transaction ID:</span>
                    <span className="text-white font-mono font-medium">{selectedTxn.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Sender Account:</span>
                    <span className="text-[#00D8F6] font-mono">{selectedTxn.nameOrig}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Destination:</span>
                    <span className="text-white font-mono">{selectedTxn.nameDest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Transfer Amount:</span>
                    <span className="text-white font-mono tabular-nums font-bold">${selectedTxn.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Device Hardware:</span>
                    <span className="text-white font-mono">{selectedTxn.device_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Card Instrument:</span>
                    <span className="text-white font-mono">{selectedTxn.card_id}</span>
                  </div>
                </div>

                {/* Score Breakdown Bar */}
                <div>
                  <h4 className="text-xs font-semibold text-white mb-2 font-sans">Ensemble Weight Contribution</h4>
                  <div className="space-y-3 text-xs font-sans">
                    <div>
                      <div className="flex justify-between text-[#8E9AA8] mb-1">
                        <span>XGBoost Classifier (65%)</span>
                        <span className="font-mono tabular-nums text-[#00E599] font-bold">{selectedTxn.xgboost_score.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-[#0E1216] border border-[#20262E] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#00E599] h-2 rounded-full"
                          style={{ width: `${Math.min(100, selectedTxn.xgboost_score * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#8E9AA8] mb-1">
                        <span>PyG GraphSAGE Network (35%)</span>
                        <span className="font-mono tabular-nums text-[#00D8F6] font-bold">{selectedTxn.graph_risk_score.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-[#0E1216] border border-[#20262E] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#00D8F6] h-2 rounded-full"
                          style={{ width: `${Math.min(100, selectedTxn.graph_risk_score * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contributing Risk Factors */}
                {selectedTxn.contributing_features && selectedTxn.contributing_features.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2 font-sans">Top Attributed Risk Factors</h4>
                    <div className="space-y-1.5">
                      {selectedTxn.contributing_features.map((feat, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#0E1216] border border-[#20262E] flex justify-between items-center text-xs">
                          <span className="font-mono text-white">{feat.feature}</span>
                          <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">
                            +{(feat.risk_contribution * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-[#586574] text-xs">
                Select any transaction from the live feed to inspect its deep AI attribution.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#20262E] text-[11px] text-[#586574] flex justify-between font-sans mt-3">
            <span>Inference SLA:</span>
            <span className="text-[#00E599] font-mono tabular-nums font-semibold">&lt; 10 ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
