import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Cpu, 
  Network, 
  Database, 
  Radio, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  BarChart3, 
  Play, 
  TrendingUp,
  ShieldCheck,
  Search,
  Compass
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
  onNavigateView?: (view: string) => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
  onNavigateView
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'steps' | 'demo'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#13171C] border border-[#20262E] rounded-[22px] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-[#20262E] flex justify-between items-center bg-[#13171C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/15 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] shadow-[0_0_15px_rgba(0,229,153,0.25)]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">DEMO GUIDE</span>
                <span className="text-[#586574] text-xs">/</span>
                <span className="text-xs text-[#8E9AA8]">Real-Time Financial Intelligence</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">FraudGuard AI · System & Demo Guide</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8E9AA8] hover:text-white p-2 rounded-xl bg-[#0E1216] border border-[#20262E] hover:border-[#00E599]/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Strip */}
        <div className="px-6 py-3 border-b border-[#20262E] bg-[#0E1216] flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00E599] text-black font-bold shadow-[0_0_12px_rgba(0,229,153,0.35)]'
                : 'text-[#8E9AA8] hover:text-white hover:bg-[#1A2027]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Platform Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[#00E599] text-black font-bold shadow-[0_0_12px_rgba(0,229,153,0.35)]'
                : 'text-[#8E9AA8] hover:text-white hover:bg-[#1A2027]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. End-to-End Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'steps'
                ? 'bg-[#00E599] text-black font-bold shadow-[0_0_12px_rgba(0,229,153,0.35)]'
                : 'text-[#8E9AA8] hover:text-white hover:bg-[#1A2027]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3. Step-by-Step Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-[#00E599] text-black font-bold shadow-[0_0_12px_rgba(0,229,153,0.35)]'
                : 'text-[#8E9AA8] hover:text-white hover:bg-[#1A2027]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>4. Demo Guide</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#8E9AA8]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-[#0E1216] border border-[#20262E] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <ShieldCheck className="w-5 h-5 text-[#00E599]" />
                  <span>What is FraudGuard AI?</span>
                </div>
                <p className="text-xs leading-relaxed text-[#8E9AA8]">
                  FraudGuard AI is an enterprise-grade <strong>Real-Time Financial Fraud Detection Platform & Operations Console</strong>. 
                  Designed for high-volume payment processors, neobanks, and card networks, it evaluates streaming transactions and assigns fraud probability scores in under <strong>10 milliseconds</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#13171C] border border-[#20262E]">
                    <span className="text-[10px] font-mono text-[#00E599] font-bold block mb-1 uppercase">Sub-10ms SLA</span>
                    <span className="text-white font-bold text-base font-mono">9.59 ms P95</span>
                    <p className="text-[11px] text-[#586574] mt-0.5">Real-time inline payment authorization</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#13171C] border border-[#20262E]">
                    <span className="text-[10px] font-mono text-[#FF9900] font-bold block mb-1 uppercase">Dual AI Engine</span>
                    <span className="text-white font-bold text-base">XGBoost + GNN</span>
                    <p className="text-[11px] text-[#586574] mt-0.5">Behavioral trees + Syndicate graph network</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#13171C] border border-[#20262E]">
                    <span className="text-[10px] font-mono text-[#8B5CF6] font-bold block mb-1 uppercase">Detection Rate</span>
                    <span className="text-white font-bold text-base font-mono">99.4% Catch</span>
                    <p className="text-[11px] text-[#586574] mt-0.5">Prevents mule rings & stolen card cashouts</p>
                  </div>
                </div>
              </div>

              {/* Core Challenges Solved */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Three Major Industry Problems Solved:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center font-mono">1</span>
                    <h5 className="text-white font-semibold text-xs">Organized Syndicate Rings</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Traditional models look at one transaction at a time and miss coordinated rings sharing the same device or bank account. Our Graph Neural Network catches them across multi-hop links.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">2</span>
                    <h5 className="text-white font-semibold text-xs">Training-Serving Skew</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      In typical ML systems, offline training data uses different feature logic than live production. We integrate Feast Feature Store to guarantee identical features in real-time.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-1.5">
                    <span className="w-6 h-6 rounded-lg bg-[#00E599]/10 text-[#00E599] font-bold text-xs flex items-center justify-center font-mono">3</span>
                    <h5 className="text-white font-semibold text-xs">Silent Data & Model Drift</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Fraud tactics evolve constantly. Evidently AI continuously runs two-sample Kolmogorov-Smirnov statistical tests on feature streams and triggers automated model retraining.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE FLOW */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-2">Architectural Ingestion & Decision Flow</h4>
                <p className="text-xs text-[#8E9AA8]">
                  From live packet ingestion to sub-10ms decisioning, here is how a financial transaction traverses the stack:
                </p>
              </div>

              {/* Horizontal Pipeline Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-center gap-4 hover:border-[#00E599]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#00D8F6]/15 text-[#00D8F6] flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Step 1 · Apache Kafka Streaming Bus</span>
                      <span className="font-mono text-[10px] text-[#00D8F6] bg-[#00D8F6]/10 px-2 py-0.5 rounded-full">113.28 TPS</span>
                    </div>
                    <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                      Ingests raw transaction payloads (sender, receiver, amount, card token, hardware device fingerprint).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-center gap-4 hover:border-[#00E599]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Step 2 · Feast Online Feature Store</span>
                      <span className="font-mono text-[10px] text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">&lt; 1 ms Lookup</span>
                    </div>
                    <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                      Instantly enriches transaction with historical velocity (1h, 24h), user average transaction amount, and account balances.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#00E599]/30 bg-[#00E599]/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00E599]/15 text-[#00E599] flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Step 3 · Dual-Engine AI Scoring (Parallel)</span>
                      <span className="font-mono text-[10px] text-[#00E599] bg-[#00E599]/10 px-2 py-0.5 rounded-full">Inference 7.3ms</span>
                    </div>
                    <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                      <strong>XGBoost Model</strong> (2.5ms) scores individual behavioral features, while <strong>PyG GraphSAGE GNN</strong> (4.8ms) embeds the 2-hop entity neighborhood.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-center gap-4 hover:border-[#00E599]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FF9900]/15 text-[#FF9900] flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Step 4 · Hybrid Risk Blender & Tier Classification</span>
                      <span className="font-mono text-[10px] text-[#FF9900] bg-[#FF9900]/10 px-2 py-0.5 rounded-full">Final Score 0-100%</span>
                    </div>
                    <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                      Combines probabilities, applies a 1.25x syndicate boost if connected to a known fraud ring, and routes into Low, Medium, or High Risk.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-center gap-4 hover:border-[#00E599]/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4D4D]/15 text-[#FF4D4D] flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">Step 5 · Analyst Triage & Automated Case Registry</span>
                      <span className="font-mono text-[10px] text-[#FF4D4D] bg-[#FF4D4D]/10 px-2 py-0.5 rounded-full">Case Management</span>
                    </div>
                    <p className="text-[11px] text-[#8E9AA8] mt-0.5">
                      High-risk transactions are preserved in the Case Portfolio for human review, fund freezing, and disposition audit logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STEP BY STEP GUIDE */}
          {activeTab === 'steps' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00E599] text-black font-mono font-bold text-[10px] flex items-center justify-center">1</span>
                    <h5 className="text-white font-bold text-xs">Feature Store Extraction (Feast)</h5>
                  </div>
                  <p className="text-xs text-[#8E9AA8]">
                    When transaction <code>C10000001</code> arrives, Feast retrieves online features: <code>user_avg_amount_7d</code>, <code>tx_velocity_1h</code>, <code>account_age_days</code>, and <code>distinct_cards_count</code> in sub-millisecond time.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00E599] text-black font-mono font-bold text-[10px] flex items-center justify-center">2</span>
                    <h5 className="text-white font-bold text-xs">XGBoost Decision Tree Evaluation</h5>
                  </div>
                  <p className="text-xs text-[#8E9AA8]">
                    Trained on IEEE-CIS / PaySim datasets with scale_pos_weight for severe class imbalance. Computes baseline anomaly risk based on sudden high amount deviations or unusual transaction hours.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00E599] text-black font-mono font-bold text-[10px] flex items-center justify-center">3</span>
                    <h5 className="text-white font-bold text-xs">GraphSAGE Relational Convolution</h5>
                  </div>
                  <p className="text-xs text-[#8E9AA8]">
                    The Graph Neural Network checks whether the current hardware device or destination account is connected to any past flagged fraud cases within 2 network hops.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00E599] text-black font-mono font-bold text-[10px] flex items-center justify-center">4</span>
                    <h5 className="text-white font-bold text-xs">Evidently AI Drift Monitoring & Retraining</h5>
                  </div>
                  <p className="text-xs text-[#8E9AA8]">
                    Monitors streaming data distributions against the reference baseline using Kolmogorov-Smirnov p-values. If drift exceeds 33% of features, the system can trigger automated model retraining.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEMO GUIDE (SELF-GUIDED REVIEWER WALKTHROUGH) */}
          {activeTab === 'demo' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 text-white">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00E599]">Self-Guided Reviewer Demo</h4>
                <p className="text-xs text-[#8E9AA8] mt-1">
                  Follow these 4 interactive steps to test and evaluate the fraud detection platform on your own:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#00E599] text-black font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-white font-semibold text-xs">Test the Real-Time Simulator</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Click <strong>"Simulate Txn"</strong> in the top navigation or use the green button below. First test <em>"Load Normal Merchant Payment"</em> ($45.00) &rarr; observe instant <strong>Low Risk (2.1%)</strong> clearance in 8ms. Next test <em>"Load Fraud Syndicate Extraction"</em> ($280,000 to a mule account) &rarr; observe the hybrid model flag it as <strong>High Risk (98.4%)</strong> with an active 1.25x syndicate multiplier.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#00E599] text-black font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-white font-semibold text-xs">Inspect the Live Streaming Ingestion Feed</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Navigate to <strong>Live Monitor</strong> on the left menu. Watch incoming transactions stream in real time. Click any transaction row to open the deep AI Risk Attribution panel, showing the exact probability split between the XGBoost decision trees and the PyG GraphSAGE network.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#00E599] text-black font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-white font-semibold text-xs">Explore 2-Hop Syndicate Graph Topology</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Navigate to <strong>Graph Syndicates</strong> on the left menu. Inspect the interactive 2-hop entity network where a flagged hardware device hub links 11 accounts into an organized extraction ring with over $217k total fraud exposure.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20262E] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-[#00E599] text-black font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-white font-semibold text-xs">Audit Data Drift & Test Automated Retraining</h5>
                    <p className="text-[11px] text-[#8E9AA8]">
                      Navigate to <strong>Drift & Retraining</strong> on the left menu. Review the live Kolmogorov-Smirnov p-value matrix auditing feature distributions. Click <strong>"Trigger Automated Retraining"</strong> to execute the background retraining workflow and inspect the model validation toast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-4 border-t border-[#20262E] bg-[#0E1216] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#586574]">
            <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse"></span>
            <span>Live Demonstration Environment Active</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (onOpenSimulator) onOpenSimulator();
              }}
              className="px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00cc88] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)] active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Try Simulator Now</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#13171C] border border-[#20262E] text-white hover:bg-[#1A2027] text-xs font-semibold transition-all cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
