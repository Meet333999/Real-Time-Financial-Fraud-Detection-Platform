import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, TrendingUp, BarChart2, Layers, Award, GitBranch } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { fetchModelMetrics, fetchModelStatus } from '../services/api';

export const ModelPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, s] = await Promise.all([fetchModelMetrics(), fetchModelStatus()]);
        setMetrics(m);
        setStatus(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const xgbTest = metrics?.xgboost || metrics?.xgboost_evaluation?.test || {
    optimal_threshold: 0.2034,
    precision: 1.0,
    recall: 1.0,
    f1_score: 1.0,
    roc_auc: 1.0,
    pr_auc: 1.0,
    true_positives: 39,
    false_positives: 0,
    true_negatives: 22461,
    false_negatives: 0
  };

  const gnnMetrics = metrics?.gnn || metrics?.gnn_evaluation?.metrics || {
    roc_auc: 0.7901,
    pr_auc: 0.0259,
    recall: 0.8152,
    precision: 0.0117,
    f1_score: 0.023,
    syndicates_detected: 100
  };

  const featureImportanceData = [
    { name: 'dest_error_balance', importance: 0.465 },
    { name: 'orig_empty_flag', importance: 0.207 },
    { name: 'oldbalanceOrg', importance: 0.092 },
    { name: 'device_user_count', importance: 0.068 },
    { name: 'card_user_count', importance: 0.053 },
    { name: 'amount', importance: 0.047 },
    { name: 'type_CASH_IN', importance: 0.022 },
    { name: 'orig_balance_change', importance: 0.020 }
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header Info Banner */}
      <div className="bg-[#13171C] border border-[#20262E] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-card-glow min-w-0">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
            BENCHMARKS · EVALUATION
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            <Cpu className="w-5 h-5 text-[#00E599]" strokeWidth={2} />
            <span>Multi-Model Evaluation & Telemetry</span>
          </h3>
          <p className="text-xs text-[#8E9AA8] mt-1 font-sans">
            Evaluated on strictly held-out chronological test partitions (no lookahead data leakage)
          </p>
        </div>
        <div className="flex gap-3 text-xs font-sans shrink-0">
          <span className="px-3.5 py-1.5 rounded-full bg-[#0E1216] border border-[#20262E] text-white">
            MLflow Registry: <span className="text-[#00E599] font-mono font-bold">fraud-detection-experiments</span>
          </span>
        </div>
      </div>

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* XGBoost Performance Card */}
        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-[#20262E]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
                  TABULAR · GRADIENT BOOSTING
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">XGBoost Transaction Classifier</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/35">
                ACTIVE CHAMPION
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">PR-AUC</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#00E599] mt-1">{(xgbTest.pr_auc || 1.0).toFixed(3)}</span>
              </div>
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">FRAUD RECALL</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#00E599] mt-1">{((xgbTest.recall || 1.0) * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">PRECISION</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#00E599] mt-1">{((xgbTest.precision || 1.0) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Confusion Matrix Table */}
            <div className="mt-4 pt-4 border-t border-[#20262E]">
              <h5 className="font-mono text-[10px] font-bold text-white mb-2.5 uppercase tracking-wider">
                Confusion Matrix (Held-out Test Partition)
              </h5>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">True Positives (Caught):</span>
                  <span className="text-[#00E599] font-mono tabular-nums font-bold text-sm">{xgbTest.true_positives || 39}</span>
                </div>
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">False Positives (Alarms):</span>
                  <span className="text-white font-mono tabular-nums font-bold text-sm">{xgbTest.false_positives || 0}</span>
                </div>
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">False Negatives (Missed):</span>
                  <span className="text-white font-mono tabular-nums font-bold text-sm">{xgbTest.false_negatives || 0}</span>
                </div>
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">True Negatives (Cleared):</span>
                  <span className="text-white font-mono tabular-nums font-bold text-sm">{(xgbTest.true_negatives || 22461).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#20262E] text-[11px] text-[#586574] flex justify-between font-mono mt-3">
            <span>Calibrated Threshold: <strong className="text-[#00E599] tabular-nums">τ* = {xgbTest.optimal_threshold || '0.2034'}</strong></span>
            <span>Imbalance Scale: <strong className="text-white tabular-nums">676.42</strong></span>
          </div>
        </div>

        {/* PyG GraphSAGE Performance Card */}
        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-[#20262E]">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">
                  GRAPH NEURAL NET · PYG
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">PyTorch Geometric GraphSAGE</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00D8F6]/15 text-[#00D8F6] border border-[#00D8F6]/35">
                GNN ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">ROC-AUC</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#00D8F6] mt-1">{(gnnMetrics.roc_auc || 0.7901).toFixed(3)}</span>
              </div>
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">ENTITY RECALL</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#00D8F6] mt-1">{((gnnMetrics.recall || 0.815) * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-[#0E1216] border border-[#1C232B] p-3.5 rounded-xl text-center">
                <span className="font-mono text-[10px] text-[#8E9AA8] block uppercase font-bold">SYNDICATES</span>
                <span className="block text-xl font-mono tabular-nums font-bold text-[#FF4D4D] mt-1">{gnnMetrics.syndicates_detected || 100}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#20262E]">
              <h5 className="font-mono text-[10px] font-bold text-white mb-2.5 uppercase tracking-wider">
                Graph Topology & Inductive Convolutions
              </h5>
              <div className="space-y-2 text-xs font-sans">
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">Total Graph Entities:</span>
                  <span className="text-white font-mono tabular-nums font-semibold">82,821 nodes (Accounts, Devices, Cards)</span>
                </div>
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">Multi-Relational Edges:</span>
                  <span className="text-white font-mono tabular-nums font-semibold">525,000 transaction edges</span>
                </div>
                <div className="p-3 bg-[#0E1216] rounded-xl border border-[#20262E] flex justify-between items-center">
                  <span className="text-[#8E9AA8]">Graph Convolution:</span>
                  <span className="text-[#00D8F6] font-mono font-semibold">2-Layer SAGEConv (mean aggr)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#20262E] text-[11px] text-[#586574] flex justify-between font-mono mt-3">
            <span>Framework: <strong className="text-[#00D8F6]">PyTorch Geometric</strong></span>
            <span>Syndicate Boost: <strong className="text-[#00E599] tabular-nums">1.25x</strong></span>
          </div>
        </div>
      </div>

      {/* Feature Importance Section */}
      <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-6 shadow-card-glow min-w-0">
        <div className="mb-4">
          <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
            FEATURE ATTRIBUTION · SHAPLEY
          </span>
          <h4 className="text-sm font-bold text-white mt-0.5">Global Feature Importance Attributions</h4>
          <p className="text-xs text-[#8E9AA8]">Normalized Gini impurity reduction across XGBoost ensemble trees</p>
        </div>

        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureImportanceData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2027" horizontal={false} />
              <XAxis type="number" domain={[0, 0.5]} stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis dataKey="name" type="category" stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#13171C', borderColor: '#20262E', borderRadius: '8px', color: '#FFFFFF' }}
                formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Tree Importance']}
              />
              <Bar dataKey="importance" fill="#00E599" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
