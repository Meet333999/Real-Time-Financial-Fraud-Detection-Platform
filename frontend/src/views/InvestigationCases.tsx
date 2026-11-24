import React, { useEffect, useState } from 'react';
import { FolderLock, CheckCircle2, XCircle, AlertCircle, Clock, Send, MessageSquare, Shield } from 'lucide-react';
import { fetchCases, updateCaseReview, InvestigationCase } from '../services/api';

export const InvestigationCases: React.FC = () => {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [newStatus, setNewStatus] = useState<string>('CONFIRMED_FRAUD');
  const [notesInput, setNotesInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadCases = async () => {
    try {
      const res = await fetchCases(filterStatus === 'ALL' ? undefined : filterStatus);
      setCases(res.cases || []);
      if (res.cases && res.cases.length > 0 && !selectedCase) {
        setSelectedCase(res.cases[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 5000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleReviewSubmit = async () => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await updateCaseReview(selectedCase.case_id, newStatus, notesInput);
      setNotesInput('');
      await loadCases();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#13171C] border border-[#20262E] p-4 rounded-2xl shadow-card-glow min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[10px] font-bold text-[#8E9AA8] tracking-wider uppercase">CASE · STATUS:</span>
          <div className="flex items-center gap-1 bg-[#0E1216] border border-[#20262E] p-1 rounded-full text-xs font-sans">
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1 rounded-full transition-all text-xs font-medium cursor-pointer ${
                  filterStatus === s
                    ? 'bg-[#1A2027] text-[#00E599] font-bold border border-[#00E599]/40'
                    : 'text-[#8E9AA8] hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Cases' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs font-sans text-[#8E9AA8]">
          Registry: <span className="text-white font-mono tabular-nums font-bold">{cases.length}</span> investigation cases
        </span>
      </div>

      {/* Main Grid: Cases Table + Interactive Review Workflow Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
        <div className="xl:col-span-8 bg-[#13171C] border border-[#20262E] rounded-2xl overflow-hidden flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="px-6 py-4 border-b border-[#20262E] flex justify-between items-center bg-[#13171C]">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">REGISTRY · PORTFOLIO</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <FolderLock className="w-4 h-4 text-[#00D8F6]" strokeWidth={2} />
                <span>Active Investigation Portfolio</span>
              </h3>
            </div>
            <span className="text-xs text-[#586574] font-mono">AUDIT TRAIL</span>
          </div>

          <div className="overflow-x-auto max-h-[620px] overflow-y-auto min-w-0">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#0E1216] border-b border-[#20262E] text-[#8E9AA8] sticky top-0 font-medium">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-3">Transaction</th>
                  <th className="py-3 px-3">Subject Account</th>
                  <th className="py-3 px-3 text-center">Risk Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Assigned Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20262E] font-sans">
                {cases.map((c) => {
                  const isSelected = selectedCase?.case_id === c.case_id;
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => {
                        setSelectedCase(c);
                        setNewStatus(c.status);
                      }}
                      className={`cursor-pointer transition-colors hover:bg-[#1A2027]/70 ${
                        isSelected ? 'bg-[#1A2027] border-l-4 border-[#00E599]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">{c.case_id}</td>
                      <td className="py-3 px-3 font-mono text-[#8E9AA8]">{c.transaction_id}</td>
                      <td className="py-3 px-3 font-mono text-[#00D8F6] font-medium">{c.account_id}</td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#FF4D4D]">{c.risk_score.toFixed(3)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide ${
                          c.status === 'CONFIRMED_FRAUD'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/35'
                            : c.status === 'FALSE_POSITIVE'
                            ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/35'
                            : 'bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/35'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{c.assigned_analyst}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Case Resolution Panel: xl:col-span-4 */}
        <div className="xl:col-span-4 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#20262E]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">ACTION · DISPOSITION</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00E599]" strokeWidth={2} />
                  <span>Analyst Case Action</span>
                </h3>
              </div>
              {selectedCase && (
                <span className="text-xs font-mono font-bold text-[#00D8F6]">{selectedCase.case_id}</span>
              )}
            </div>

            {selectedCase ? (
              <div className="mt-4 space-y-4">
                <div className="bg-[#0E1216] border border-[#1C232B] p-4 rounded-xl text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Transaction ID:</span>
                    <span className="text-white font-mono">{selectedCase.transaction_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Account:</span>
                    <span className="text-[#00D8F6] font-mono font-medium">{selectedCase.account_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Hybrid Risk Score:</span>
                    <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">{selectedCase.risk_score.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Current Status:</span>
                    <span className="text-[#FF9900] font-semibold">{selectedCase.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Audit Trail & Notes */}
                <div>
                  <h4 className="text-xs font-semibold text-white mb-2 font-sans">Investigation Evidence Log</h4>
                  <div className="p-3.5 bg-[#0E1216] rounded-xl border border-[#20262E] text-xs text-[#8E9AA8] max-h-36 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                    {selectedCase.notes || 'No prior notes recorded.'}
                  </div>
                </div>

                {/* Status Update Controls */}
                <div>
                  <h4 className="text-xs font-semibold text-white mb-2 font-sans">Update Disposition</h4>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 text-xs font-sans text-white focus:outline-none focus:border-[#00E599] transition-colors"
                  >
                    <option value="OPEN">OPEN (Pending Review)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW (In Progress)</option>
                    <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD (Block Account & Freeze Funds)</option>
                    <option value="FALSE_POSITIVE">FALSE POSITIVE (Verified Legitimate Customer)</option>
                    <option value="RESOLVED">RESOLVED (Case Closed)</option>
                  </select>
                </div>

                {/* Add Investigation Note */}
                <div>
                  <h4 className="text-xs font-semibold text-white mb-2 font-sans">Analyst Audit Remarks</h4>
                  <textarea
                    rows={3}
                    placeholder="Document audit evidence, customer contact, or decision rationale..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full bg-[#0E1216] border border-[#20262E] rounded-xl p-2.5 text-xs font-sans text-white placeholder-[#586574] focus:outline-none focus:border-[#00E599] transition-colors"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#586574] mt-4 font-sans">Select a case from the portfolio to review details.</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#20262E] mt-3">
            <button
              onClick={handleReviewSubmit}
              disabled={submitting || !selectedCase}
              className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#00E599] hover:bg-[#00cc88] disabled:opacity-50 text-black font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)] active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{submitting ? 'Recording Decision...' : 'Commit Case Decision'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
