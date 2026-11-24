import React, { useEffect, useState } from 'react';
import { Share2, ShieldAlert, Cpu, Network, Layers, Info, ShieldCheck } from 'lucide-react';
import { fetchFraudRings, FraudRing } from '../services/api';

export const GraphIntelligence: React.FC = () => {
  const [rings, setRings] = useState<FraudRing[]>([]);
  const [selectedRing, setSelectedRing] = useState<FraudRing | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchFraudRings();
        setRings(res.rings || []);
        if (res.rings && res.rings.length > 0) {
          setSelectedRing(res.rings[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Overview Header Banner */}
      <div className="bg-[#13171C] border border-[#20262E] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-card-glow min-w-0">
        <div>
          <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase">
            GRAPH.INTELLIGENCE · MULTI-HOP
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            <Network className="w-5 h-5 text-[#00D8F6]" strokeWidth={2} />
            <span>Graph Neural Network & Fraud Ring Clusters</span>
          </h3>
          <p className="text-xs text-[#8E9AA8] mt-1 font-sans">
            PyTorch Geometric GraphSAGE detects multi-account coordinated syndicates, mule hubs, and recycled cards
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-sans shrink-0">
          <div className="px-3.5 py-1.5 rounded-full bg-[#0E1216] border border-[#20262E] flex items-center gap-1.5">
            <span className="text-[#8E9AA8]">Total Syndicates:</span>
            <span className="text-[#00D8F6] font-mono tabular-nums font-bold">{rings.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-[#0E1216] border border-[#20262E] flex items-center gap-1.5">
            <span className="text-[#8E9AA8]">Architecture:</span>
            <span className="text-[#00E599] font-mono font-semibold">PyG GraphSAGE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Syndicate Selector + SVG Graph Visualizer + Details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
        {/* Left Column: Rings List (xl:col-span-3) */}
        <div className="xl:col-span-3 bg-[#13171C] border border-[#20262E] rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-card-glow min-w-0">
          <div className="p-4 border-b border-[#20262E] bg-[#13171C]">
            <span className="font-mono text-[10px] font-bold text-[#8E9AA8] tracking-wider uppercase">
              DETECTED FRAUD SYNDICATES
            </span>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-[#20262E]">
            {rings.map((r) => {
              const isSelected = selectedRing?.ring_id === r.ring_id;
              return (
                <button
                  key={r.ring_id}
                  onClick={() => {
                    setSelectedRing(r);
                    setSelectedNode(null);
                  }}
                  className={`w-full p-4 text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
                    isSelected ? 'bg-[#1A2027] border-l-4 border-[#00E599]' : 'hover:bg-[#161B22]'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{r.ring_id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF4D4D]/15 text-[#FF4D4D] border border-[#FF4D4D]/30">
                      {(r.risk_score * 100).toFixed(0)}% RISK
                    </span>
                  </div>
                  <span className="text-xs text-[#8E9AA8] font-medium font-sans truncate">{r.ring_name}</span>
                  <div className="flex justify-between text-[11px] text-[#586574] font-mono">
                    <span>{r.pattern_type.replace('_', ' ')}</span>
                    <span className="tabular-nums">{r.member_count} entities</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Interactive SVG Graph Subgraph Canvas (xl:col-span-6) */}
        <div className="xl:col-span-6 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between h-[650px] shadow-card-glow min-w-0">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-[#20262E] flex-wrap gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#00D8F6] tracking-wider uppercase">
                  TOPOLOGY · 2-HOP SUBGRAPH
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedRing?.ring_name || 'Syndicate Topology'}</h4>
                <p className="text-xs text-[#8E9AA8] mt-0.5 font-sans">
                  Pattern: {selectedRing?.pattern_type} • Primary Hub: <span className="font-mono text-[#00D8F6]">{selectedRing?.primary_hub}</span>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#00D8F6]/15 text-[#00D8F6] border border-[#00D8F6]/30">
                Interactive Network
              </span>
            </div>

            {/* SVG Interactive Topology Canvas */}
            <div className="mt-4 bg-[#0E1216] border border-[#1C232B] h-[470px] relative overflow-hidden flex items-center justify-center rounded-xl">
              {selectedRing ? (
                <svg className="w-full h-full" viewBox="0 0 600 450">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2E3846" />
                    </marker>
                  </defs>

                  {/* Render Edges */}
                  {selectedRing.subgraph.edges.map((e, idx) => {
                    const totalNodes = selectedRing.subgraph.nodes.length - 1;
                    const angle = ((idx % Math.max(1, totalNodes)) / Math.max(1, totalNodes)) * 2 * Math.PI;
                    const cx = 300;
                    const cy = 225;
                    const r = 160;
                    const targetX = cx + r * Math.cos(angle);
                    const targetY = cy + r * Math.sin(angle);

                    return (
                      <line
                        key={`edge-${idx}`}
                        x1={cx}
                        y1={cy}
                        x2={targetX}
                        y2={targetY}
                        stroke="#20262E"
                        strokeWidth="1.5"
                        strokeDasharray={e.type === 'uses_device' ? '4 4' : 'none'}
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}

                  {/* Center Primary Hub Node */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedNode({ id: selectedRing.primary_hub, type: selectedRing.hub_type, is_hub: true })}
                  >
                    <circle cx={300} cy={225} r={28} fill="#FF4D4D" stroke="#FFFFFF" strokeWidth={2.5} className="animate-pulse" />
                    <text x={300} y={229} textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                      HUB
                    </text>
                  </g>

                  {/* Satellite Member Nodes */}
                  {selectedRing.subgraph.nodes.filter(n => !n.is_hub).map((node, idx, arr) => {
                    const angle = (idx / arr.length) * 2 * Math.PI;
                    const cx = 300 + 160 * Math.cos(angle);
                    const cy = 225 + 160 * Math.sin(angle);
                    const isFraud = node.is_fraud;

                    return (
                      <g
                        key={`node-${node.id}`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedNode(node)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={18}
                          fill={isFraud ? '#FF4D4D' : '#161B22'}
                          stroke={isFraud ? '#FF7A7A' : '#2E3846'}
                          strokeWidth={2}
                        />
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace">
                          {node.id.substring(0, 4)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : null}

              {/* Legend overlay */}
              <div className="absolute bottom-3 left-3 bg-[#13171C]/95 border border-[#20262E] p-3 rounded-xl text-[11px] font-sans space-y-1 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]"></span>
                  <span className="text-[#8E9AA8]">Central Hub (Device/Card/Mule)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]/60 border border-[#FF4D4D]"></span>
                  <span className="text-[#8E9AA8]">Confirmed Fraud Entity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#161B22] border border-[#2E3846]"></span>
                  <span className="text-[#8E9AA8]">Connected Account</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 text-xs font-sans text-[#586574] flex justify-between">
            <span>Graph Extraction: 2-Hop Network Neighborhood</span>
            <span className="text-[#00D8F6] font-medium">Click any node to inspect telemetry</span>
          </div>
        </div>

        {/* Right Column: Node & Ring Metrics (xl:col-span-3) */}
        <div className="xl:col-span-3 bg-[#13171C] border border-[#20262E] rounded-2xl p-6 flex flex-col justify-between h-[650px] shadow-card-glow min-w-0">
          <div>
            <div className="pb-3 border-b border-[#20262E]">
              <span className="font-mono text-[10px] font-bold text-[#8E9AA8] tracking-wider uppercase">
                TELEMETRY · SYNDICATE
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">Syndicate Risk Metrics</h4>
            </div>

            {selectedRing ? (
              <div className="mt-4 space-y-4">
                <div className="bg-[#0E1216] border border-[#1C232B] p-4 rounded-xl text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Ring Identifier:</span>
                    <span className="text-[#FF4D4D] font-mono font-bold">{selectedRing.ring_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Typology:</span>
                    <span className="text-white">{selectedRing.pattern_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Severity:</span>
                    <span className="text-[#FF4D4D] font-bold">{selectedRing.severity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Syndicate Risk:</span>
                    <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">{(selectedRing.risk_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Member Entities:</span>
                    <span className="text-white font-mono tabular-nums font-bold">{selectedRing.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Confirmed Frauds:</span>
                    <span className="text-[#FF4D4D] font-mono tabular-nums font-bold">{selectedRing.confirmed_fraud_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E9AA8]">Total Volume:</span>
                    <span className="text-white font-mono tabular-nums font-bold">${selectedRing.total_transaction_volume.toLocaleString()}</span>
                  </div>
                </div>

                {/* Selected Node Details */}
                {selectedNode ? (
                  <div className="p-3.5 bg-[#0E1216] rounded-xl border border-[#00E599]/30 text-xs font-sans space-y-1.5">
                    <span className="text-[#00E599] font-bold block text-[10px] font-mono uppercase tracking-wide">Selected Node Entity</span>
                    <div className="flex justify-between">
                      <span className="text-[#8E9AA8]">ID:</span>
                      <span className="text-white font-mono font-bold">{selectedNode.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9AA8]">Type:</span>
                      <span className="text-white capitalize">{selectedNode.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9AA8]">Fraud Flag:</span>
                      <span className={selectedNode.is_fraud ? 'text-[#FF4D4D] font-bold' : 'text-[#00E599] font-bold'}>
                        {selectedNode.is_fraud ? 'CONFIRMED FRAUD' : 'BENIGN MEMBER'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#586574] font-sans p-3 bg-[#0E1216] rounded-xl border border-[#1C232B]">
                    Click any node in the graph canvas to inspect individual entity attributes.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="pt-3 border-t border-[#1C232B] text-[11px] text-[#586574] font-sans">
            <span>Dynamic 1.25x syndicate score boost applied on ring members.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
