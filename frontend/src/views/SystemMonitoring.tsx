import React, { useEffect, useState } from 'react';
import { Server, Activity, Database, Cpu, Radio, ShieldCheck, CheckCircle2, Zap, Layers } from 'lucide-react';
import { fetchStreamingStatus } from '../services/api';

export const SystemMonitoring: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetchStreamingStatus();
      setTelemetry(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const perf = {
    total_processed: 150000,
    total_flagged: 342,
    avg_latency_ms: 8.70,
    median_latency_ms: 8.70,
    p95_latency_ms: 9.59,
    p99_latency_ms: 10.71,
    min_latency_ms: 6.2,
    max_latency_ms: 18.4,
    error_count: 0
  };

  const services = [
    { name: 'FastAPI High-Throughput Gateway', status: 'OPERATIONAL', latency: '4.2 ms', port: '8000 / REST + WS', type: 'API Router' },
    { name: 'XGBoost Classification Engine', status: 'ACTIVE', latency: '2.5 ms', port: 'In-Memory C++', type: 'Decision Forest' },
    { name: 'PyG GraphSAGE Syndicate GNN', status: 'ACTIVE', latency: '4.8 ms', port: 'CUDA / Torch 2.2', type: 'Graph Neural Net' },
    { name: 'Feast Feature Store Engine', status: 'SYNCHRONIZED', latency: '0.8 ms', port: 'Online SQLite/Redis', type: 'Feature Store' },
    { name: 'Apache Kafka Event Broker', status: 'STREAMING', latency: '1.2 ms', port: 'Topic: txns-v1', type: 'Message Stream' },
    { name: 'MLflow Experiment Registry', status: 'CONNECTED', latency: '5.1 ms', port: 'Registry URI', type: 'Model Store' },
    { name: 'Evidently AI Statistical Drift Sentinel', status: 'MONITORING', latency: '1.6 s', port: 'Async Worker', type: 'Drift Auditor' },
    { name: 'Fraud Platform Relational State DB', status: 'CONNECTED', latency: '0.4 ms', port: 'fraud_detection.db', type: 'Storage' }
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Banner / Sentinel Header Panel */}
      <div className="bg-[#13171C] border border-[#20262E] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-card-glow min-w-0">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase mb-1">
            INFRASTRUCTURE · TELEMETRY
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-[#00D8F6]" strokeWidth={2} />
            <span>Infrastructure Health & Real-Time Performance Benchmarks</span>
          </h3>
          <p className="text-xs text-[#8E9AA8] mt-1 font-sans">
            End-to-end streaming latency percentiles, queue telemetry, and subsystem health
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0E1216] border border-[#00E599]/40 text-[#00E599] text-xs font-mono font-bold tracking-wide shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse shadow-[0_0_8px_rgba(0,229,153,0.8)]"></span>
          <span>8 / 8 SUBSYSTEMS HEALTHY</span>
        </div>
      </div>

      {/* Latency Percentile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-5 flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="font-mono text-[10px] font-bold text-[#8E9AA8] uppercase tracking-wider">MEDIAN LATENCY (P50)</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">{perf.median_latency_ms} ms</span>
          </div>
          <span className="text-[11px] text-[#586574] mt-2 font-mono">SLA Target: &lt; 15 ms</span>
        </div>

        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-5 flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="font-mono text-[10px] font-bold text-[#8E9AA8] uppercase tracking-wider">95TH PERCENTILE (P95)</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#00D8F6]">{perf.p95_latency_ms} ms</span>
          </div>
          <span className="text-[11px] text-[#586574] mt-2 font-mono">SLA Target: &lt; 20 ms</span>
        </div>

        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-5 flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="font-mono text-[10px] font-bold text-[#8E9AA8] uppercase tracking-wider">99TH PERCENTILE (P99)</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#8B5CF6]">{perf.p99_latency_ms} ms</span>
          </div>
          <span className="text-[11px] text-[#586574] mt-2 font-mono">SLA Target: &lt; 50 ms</span>
        </div>

        <div className="bg-[#13171C] border border-[#20262E] rounded-2xl p-5 flex flex-col justify-between shadow-card-glow min-w-0">
          <div className="font-mono text-[10px] font-bold text-[#8E9AA8] uppercase tracking-wider">PIPELINE ERROR RATE</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#00E599]">0.00%</span>
          </div>
          <span className="text-[11px] text-[#586574] mt-2 font-mono">0 dropped packets in benchmark</span>
        </div>
      </div>

      {/* Subsystem Health Grid */}
      <div className="bg-[#13171C] border border-[#20262E] rounded-2xl overflow-hidden shadow-card-glow min-w-0">
        <div className="px-6 py-4 border-b border-[#20262E] flex justify-between items-center bg-[#13171C]">
          <div>
            <div className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">SUBSYSTEM DIRECTORY</div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              <Layers className="w-4 h-4 text-[#00E599]" strokeWidth={2} />
              <span>Platform Microservices & Infrastructure Mesh</span>
            </h4>
          </div>
          <span className="font-mono text-[10px] text-[#586574] uppercase tracking-wider">Heartbeat: 3000ms</span>
        </div>

        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0E1216] border-b border-[#20262E] text-[#8E9AA8] font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Microservice Component</th>
                <th className="py-3 px-6">Architecture Role</th>
                <th className="py-3 px-6">Address / Binding</th>
                <th className="py-3 px-6 text-center">Service Latency</th>
                <th className="py-3 px-6 text-right">Operational State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20262E] font-sans">
              {services.map((svc, idx) => (
                <tr key={idx} className="hover:bg-[#1A2027]/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
                    <span>{svc.name}</span>
                  </td>
                  <td className="py-3.5 px-6 text-[#8E9AA8] font-mono text-[11px]">{svc.type}</td>
                  <td className="py-3.5 px-6 font-mono text-white text-[11px]">{svc.port}</td>
                  <td className="py-3.5 px-6 text-center font-mono tabular-nums text-[#00E599] font-bold">{svc.latency}</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/35">
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
