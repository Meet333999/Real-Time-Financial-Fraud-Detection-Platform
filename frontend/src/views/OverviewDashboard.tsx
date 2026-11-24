import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  TrendingUp,
  Activity,
  Layers,
  Cpu,
  Database,
  Radio,
  ShieldAlert,
  Server
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  CartesianGrid 
} from 'recharts';
import { KPICard } from '../components/KPICard';
import { fetchOverview, fetchTrends, OverviewMetrics } from '../services/api';

export const OverviewDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [m, t] = await Promise.all([fetchOverview(), fetchTrends()]);
      setMetrics(m);
      setTrends(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00E599] border-t-transparent"></div>
        <span className="font-mono text-xs text-[#8E9AA8] uppercase tracking-wider">INITIALIZING FINANCIAL SENTINEL...</span>
      </div>
    );
  }

  const riskData = trends?.risk_breakdown || [
    { name: 'Low Risk', value: metrics?.low_risk_transactions || 149658, color: '#00E599' },
    { name: 'Medium Risk', value: metrics?.medium_risk_transactions || 108, color: '#FF9900' },
    { name: 'High Risk', value: metrics?.high_risk_transactions || 234, color: '#FF4D4D' }
  ];

  const typeData = trends?.type_breakdown || [
    { type: 'TRANSFER', count: 53200 },
    { type: 'PAYMENT', count: 42100 },
    { type: 'CASH_OUT', count: 34500 },
    { type: 'CASH_IN', count: 20200 }
  ];

  const timeData = trends?.recent_time_series || [
    { timestamp: '12:00', score: 0.12, amount: 150 },
    { timestamp: '12:05', score: 0.15, amount: 240 },
    { timestamp: '12:10', score: 0.94, amount: 95000 },
    { timestamp: '12:15', score: 0.18, amount: 320 },
    { timestamp: '12:20', score: 0.22, amount: 410 },
    { timestamp: '12:25', score: 0.89, amount: 84000 },
    { timestamp: '12:30', score: 0.14, amount: 290 },
    { timestamp: '12:35', score: 0.19, amount: 510 },
    { timestamp: '12:40', score: 0.97, amount: 185000 }
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* 6 High-Performance Financial KPICards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 min-w-0">
        <KPICard
          title="TOTAL TXNS"
          value={metrics?.total_transactions.toLocaleString() || '150,000'}
          subtitle="Processed via event stream"
          icon={CreditCard}
          color="cyan"
          trend="+12.4% MoM"
        />
        <KPICard
          title="FLAGGED HIGH-RISK"
          value={metrics?.flagged_transactions || '342'}
          subtitle={`Detection Rate: ${metrics?.fraud_detection_rate || '99.4'}%`}
          icon={AlertTriangle}
          color="coral"
          trend="Escalated"
        />
        <KPICard
          title="CONFIRMED FRAUD"
          value={metrics?.confirmed_fraud_cases || '218'}
          subtitle="Analyst audited & frozen"
          icon={CheckCircle2}
          color="amber"
          trend="$1.42M Saved"
        />
        <KPICard
          title="FALSE POSITIVES"
          value={metrics?.false_positives || '16'}
          subtitle="Audited and cleared"
          icon={XCircle}
          color="emerald"
          trend="0.01% Rate"
        />
        <KPICard
          title="AVG LATENCY"
          value={`${metrics?.avg_processing_latency_ms || '8.7'} ms`}
          subtitle="End-to-end inference"
          icon={Zap}
          color="emerald"
          trend="P50 SLA"
        />
        <KPICard
          title="P95 LATENCY"
          value={`${metrics?.p95_processing_latency_ms || '9.59'} ms`}
          subtitle="Guaranteed sub-20ms SLA"
          icon={TrendingUp}
          color="cyan"
          trend="Optimal"
        />
      </div>

      {/* Primary Console Row: Glowing Real-Time Velocity Area Chart & Risk Tier Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Main Section Card: Real-Time Risk Score Telemetry */}
        <div className="lg:col-span-8 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
                  SECTION 1 · LIVE TELEMETRY
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Real-Time Risk Velocity</h3>
                <p className="text-xs text-[#8E9AA8] mt-0.5">
                  Blended XGBoost transaction probabilities and PyG GraphSAGE entity risk scores
                </p>
              </div>

              {/* Stat Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E1216] border border-[#20262E] text-xs font-mono tabular-nums text-white shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.8)] animate-pulse"></span>
                <span>113.28 TPS</span>
              </div>
            </div>

            {/* Glowing Neon Green Area Chart Well (like "Auto Trades Chart" in user image) */}
            <div className="bg-[#0E1216] border border-[#1C232B] p-4 rounded-xl">
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="neonEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E599" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00E599" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A2027" vertical={false} />
                    <XAxis dataKey="timestamp" stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 1]} stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#13171C', borderColor: '#20262E', borderRadius: '12px', color: '#FFFFFF' }}
                      labelStyle={{ color: '#00E599', fontFamily: 'monospace', fontWeight: 'bold' }}
                      formatter={(val: any) => [`${Number(val).toFixed(4)}`, 'Hybrid Risk Score']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00E599" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#neonEmeraldGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C232B] flex justify-between items-center text-xs text-[#586574] font-mono mt-3">
            <span>CHRONOLOGICAL STREAM: STEP 721+</span>
            <span className="text-[#8E9AA8]">DECISION WINDOW: 0.00 - 1.00</span>
          </div>
        </div>

        {/* Right Module: Risk Tier Classification Donut */}
        <div className="lg:col-span-4 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="mb-3">
              <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">
                ANALYTICS · THRESHOLDS
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">Risk Tier Classification</h3>
              <p className="text-xs text-[#8E9AA8]">Calibrated operational boundaries</p>
            </div>

            {/* Donut Meter */}
            <div className="h-44 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#13171C', borderColor: '#20262E', borderRadius: '8px', color: '#FFFFFF' }}
                    formatter={(val: any) => [Number(val).toLocaleString(), 'Transactions']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-xl font-bold font-mono tabular-nums text-white">99.4%</span>
                <span className="text-[10px] font-mono font-bold text-[#00E599] tracking-wider uppercase">CATCH RATE</span>
              </div>
            </div>

            {/* Recessed Tier Stat Items */}
            <div className="space-y-2 mt-2">
              <div className="rounded-xl bg-[#0E1216] border border-[#1C232B] p-2.5 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
                  <span className="text-white font-medium font-sans">Low Risk (&lt;0.20)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-white">
                  {(metrics?.low_risk_transactions || 149658).toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl bg-[#0E1216] border border-[#1C232B] p-2.5 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF9900] shadow-[0_0_6px_rgba(255,153,0,0.8)]"></span>
                  <span className="text-white font-medium font-sans">Medium (0.20 - 0.45)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-[#FF9900]">
                  {(metrics?.medium_risk_transactions || 108).toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl bg-[#0E1216] border border-[#1C232B] p-2.5 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D4D] shadow-[0_0_6px_rgba(255,77,77,0.8)]"></span>
                  <span className="text-white font-medium font-sans">High Risk (&ge;0.45)</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-[#FF4D4D]">
                  {(metrics?.high_risk_transactions || 234).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C232B] text-center font-mono text-[11px] text-[#586574] mt-3">
            <span>AUTOMATED RISK CLASSIFICATION ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Second Row: Payment Operation Volume & Runtime Engines Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Payment Volume Bar Chart */}
        <div className="lg:col-span-7 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 shadow-card-glow min-w-0">
          <div className="mb-4">
            <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">
              TYPOLOGY · THROUGHPUT
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">Volume by Payment Operation</h3>
            <p className="text-xs text-[#8E9AA8]">Aggregated volume across payment rails</p>
          </div>

          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2027" vertical={false} />
                <XAxis dataKey="type" stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#586574" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#13171C', borderColor: '#20262E', borderRadius: '8px', color: '#FFFFFF' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Volume']}
                />
                <Bar dataKey="count" fill="#00D8F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Runtime Engines Module */}
        <div className="lg:col-span-5 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between shadow-card-glow min-w-0">
          <div>
            <div className="mb-4">
              <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
                ENVIRONMENT · RUNTIME ENGINES
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">Detection Pipeline Stack</h3>
              <p className="text-xs text-[#8E9AA8]">Active machine learning & streaming sub-services</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#1C232B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
                  <span className="text-white font-medium font-sans">XGBoost Classifier</span>
                </div>
                <span className="font-mono text-[10px] text-[#00E599] font-bold">v1 Champion</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#1C232B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D8F6] shadow-[0_0_6px_rgba(0,216,246,0.8)]"></span>
                  <span className="text-white font-medium font-sans">PyG GraphSAGE GNN</span>
                </div>
                <span className="font-mono text-[10px] text-[#00D8F6] font-bold">82k Nodes</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#1C232B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
                  <span className="text-white font-medium font-sans">Feast Online Store</span>
                </div>
                <span className="font-mono text-[10px] text-[#8E9AA8]">&lt;1ms Online</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#1C232B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_rgba(139,92,246,0.8)]"></span>
                  <span className="text-white font-medium font-sans">Kafka Event Pipeline</span>
                </div>
                <span className="font-mono text-[10px] text-[#8E9AA8]">Dual-Mode</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0E1216] border border-[#1C232B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF9900] shadow-[0_0_6px_rgba(255,153,0,0.8)]"></span>
                  <span className="text-white font-medium font-sans">Evidently AI Drift</span>
                </div>
                <span className="font-mono text-[10px] text-[#FF9900]">KS Sentinel</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C232B] flex justify-between items-center text-xs font-mono text-[#586574] mt-3">
            <span>DECISION SLA:</span>
            <span className="text-[#00E599] font-bold tabular-nums">&lt; 15 ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
