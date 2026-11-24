import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle2, Clock, Filter, Eye, UserCheck, Shield } from 'lucide-react';
import { fetchAlerts, FraudAlert } from '../services/api';

export const FraudAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await fetchAlerts(filterStatus === 'ALL' ? undefined : filterStatus);
      setAlerts(res.alerts || []);
      if (res.alerts && res.alerts.length > 0 && !selectedAlert) {
        setSelectedAlert(res.alerts[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 4000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#13171C] border border-[#20262E] p-4 rounded-2xl shadow-card-glow min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[10px] font-bold text-[#8E9AA8] tracking-wider uppercase">FILTER · STATUS:</span>
          <div className="flex items-center gap-1 bg-[#0E1216] border border-[#20262E] p-1 rounded-full text-xs font-sans">
            {['ALL', 'NEW', 'UNDER_REVIEW', 'RESOLVED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1 rounded-full transition-all text-xs font-medium cursor-pointer ${
                  filterStatus === s
                    ? 'bg-[#1A2027] text-[#00E599] font-bold border border-[#00E599]/40'
                    : 'text-[#8E9AA8] hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Alerts' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-sans text-[#8E9AA8]">
          Queue: <span className="text-white font-mono tabular-nums font-bold">{alerts.length}</span> active alerts
        </span>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
        {/* Table: xl:col-span-8 */}
        <div className="xl:col-span-8 bg-[#13171C] border border-[#20262E] rounded-2xl overflow-hidden flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="px-6 py-4 border-b border-[#20262E] flex justify-between items-center bg-[#13171C]">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#FF4D4D] tracking-wider uppercase">TRIAGE · QUEUE</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" strokeWidth={2} />
                <span>Flagged Suspicious Transactions</span>
              </h3>
            </div>
            <span className="text-xs text-[#FF4D4D] font-mono font-bold bg-[#FF4D4D]/10 px-2.5 py-0.5 rounded-full border border-[#FF4D4D]/30">
              CRITICAL SEVERITY
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto min-w-0">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#0E1216] border-b border-[#20262E] text-[#8E9AA8] sticky top-0 font-medium">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-3">Transaction</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Risk Score</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20262E] font-sans">
                {alerts.map((a) => {
                  const isSelected = selectedAlert?.alert_id === a.alert_id;
                  return (
                    <tr
                      key={a.alert_id}
                      onClick={() => setSelectedAlert(a)}
                      className={`cursor-pointer transition-colors hover:bg-[#1A2027]/70 ${
                        isSelected ? 'bg-[#1A2027] border-l-4 border-[#00E599]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#FF4D4D]">{a.alert_id}</td>
                      <td className="py-3 px-3 font-mono text-white">{a.transaction_id}</td>
                      <td className="py-3 px-3 font-mono text-[#00D8F6] font-medium">{a.account_id}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-white">
                        ${a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#FF4D4D]">
                        {a.combined_risk_score.toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/35">
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide ${
                          a.status === 'RESOLVED'
                            ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/35'
                            : 'bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/35'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Alert Details: xl:col-span-4 */}
        <div className="xl:col-span-4 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#20262E]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">EVIDENCE · AUDIT</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  <Shield className="w-4 h-4 text-[#00E599]" strokeWidth={2} />
                  <span>Alert Deep Analysis</span>
                </h3>
              </div>
              {selectedAlert && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/30">
                  {selectedAlert.severity} SEVERITY
                </span>
              )}
            </div>

            {selectedAlert ? (
              <div className="mt-4 space-y-4">
                <div className="bg-[#0E1216] border border-[#1C232B] p-4 rounded-xl text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Alert Identifier:</span>
                    <span className="text-white font-mono font-bold">{selectedAlert.alert_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Transaction ID:</span>
                    <span className="text-white font-mono">{selectedAlert.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Flagged Account:</span>
                    <span className="text-[#00D8F6] font-mono font-medium">{selectedAlert.account_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Transaction Volume:</span>
                    <span className="text-white font-mono tabular-nums font-bold">${selectedAlert.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Hybrid Risk Score:</span>
                    <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">{selectedAlert.combined_risk_score.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Current Status:</span>
                    <span className="text-[#FF9900] font-bold">{selectedAlert.status}</span>
                  </div>
                </div>

                {selectedAlert.notes && (
                  <div className="p-3.5 bg-[#0E1216] rounded-xl border border-[#20262E] text-xs text-white leading-relaxed font-sans">
                    <span className="block text-[#8E9AA8] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">Analyst Audit Reason</span>
                    {selectedAlert.notes}
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-white mb-2 font-sans">Flagged Contributing Factors</h4>
                  <div className="space-y-1.5">
                    {selectedAlert.contributing_features && selectedAlert.contributing_features.length > 0 ? (
                      selectedAlert.contributing_features.map((f: any, i: number) => (
                        <div key={i} className="flex justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#20262E] text-xs">
                          <span className="font-mono text-white">{f.feature}</span>
                          <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">+{Number(f.contribution || f.risk_contribution || 0).toFixed(3)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#586574] font-sans">No anomalous feature deviations recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#586574] mt-4 font-sans">Select an alert from the queue to inspect evidence.</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#20262E] mt-3">
            <span className="text-[11px] text-[#586574] font-sans">Alerts automatically synchronize into analyst investigation cases.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
