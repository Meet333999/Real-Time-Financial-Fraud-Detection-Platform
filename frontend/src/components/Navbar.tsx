import React, { useState } from 'react';
import { Play, Square, Shield, Zap, Activity, HelpCircle, Sparkles } from 'lucide-react';
import { startStreaming, stopStreaming } from '../services/api';

interface NavbarProps {
  currentView: string;
  isStreaming: boolean;
  onStreamingToggle: (active: boolean) => void;
  onOpenSimulator: () => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  isStreaming,
  onStreamingToggle,
  onOpenSimulator,
  onOpenGuide
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggleStream = async () => {
    setLoading(true);
    try {
      if (isStreaming) {
        await stopStreaming();
        onStreamingToggle(false);
      } else {
        await startStreaming(0.08, 1000);
        onStreamingToggle(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<string, { kicker: string; title: string; subtitle: string }> = {
    overview: {
      kicker: 'OPS.CONSOLE',
      title: 'Fraud Operations Console',
      subtitle: 'Real-time hybrid risk scoring & platform telemetry'
    },
    'live-monitor': {
      kicker: 'STREAM.INGESTION',
      title: 'Real-Time Transaction Stream',
      subtitle: 'Live packet ingestion with millisecond risk categorization'
    },
    alerts: {
      kicker: 'SUSPICIOUS.EVENTS',
      title: 'High-Risk Fraud Alerts',
      subtitle: 'Flagged transactions escalated for analyst investigation'
    },
    cases: {
      kicker: 'ANALYST.WORKFLOW',
      title: 'Case Management Portfolio',
      subtitle: 'Investigation evidence logs and disposition registry'
    },
    graph: {
      kicker: 'GRAPH.INTELLIGENCE',
      title: 'Graph Neural Network Syndicates',
      subtitle: 'PyG GraphSAGE multi-hop network & fraud ring clusters'
    },
    models: {
      kicker: 'ML.BENCHMARKS',
      title: 'Multi-Model Performance Telemetry',
      subtitle: 'XGBoost and Graph Neural Network validation benchmarks'
    },
    drift: {
      kicker: 'DATA.SENTINEL',
      title: 'Evidently AI Statistical Drift Monitor',
      subtitle: 'Two-sample Kolmogorov-Smirnov distribution audit'
    },
    system: {
      kicker: 'INFRA.TELEMETRY',
      title: 'Hardware & Pipeline Telemetry',
      subtitle: 'Kafka brokers, Feast store, and sub-10ms decision latencies'
    }
  };

  const currentMeta = titles[currentView] || {
    kicker: 'SYSTEM',
    title: 'Operations Console',
    subtitle: 'Financial risk intelligence'
  };

  return (
    <header className="h-16 bg-[#13171C] border-b border-[#20262E] px-4 lg:px-6 flex items-center justify-between select-none min-w-0 overflow-hidden shrink-0">
      {/* View Title & Kicker */}
      <div className="min-w-0 pr-3 truncate flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-[#00E599] tracking-wider uppercase whitespace-nowrap">
            {currentMeta.kicker}
          </span>
          <span className="text-[#586574] text-xs">/</span>
          <h2 className="text-sm font-bold text-white tracking-tight leading-none truncate">
            {currentMeta.title}
          </h2>
        </div>
        <p className="text-[11px] text-[#8E9AA8] mt-1 leading-none font-sans truncate hidden sm:block">
          {currentMeta.subtitle}
        </p>
      </div>

      {/* Right-hand Controls & Stat Badges */}
      <div className="flex items-center gap-2 shrink-0 flex-nowrap">
        {/* Topbar Stat Pill 1: Throughput */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E1216] border border-[#20262E] text-xs text-[#8E9AA8] font-mono tabular-nums whitespace-nowrap shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#00E599]" />
          <span className="text-white font-bold">113.28</span> TPS
        </div>

        {/* Topbar Stat Pill 2: P95 Latency */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E1216] border border-[#20262E] text-xs text-[#8E9AA8] font-mono tabular-nums whitespace-nowrap shrink-0">
          <Activity className="w-3.5 h-3.5 text-[#00D8F6]" />
          <span className="text-white font-bold">9.59 ms</span> P95
        </div>

        {/* Hardware LED Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E1216] border border-[#20262E] text-xs text-white font-sans whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.7)] animate-pulse"></span>
          <span className="font-medium text-[11px]">Stream Active</span>
        </div>

        {/* NEW: Demo Guide Popup Button */}
        <button
          onClick={onOpenGuide}
          className="tactile-btn px-3 py-1.5 rounded-xl bg-[#00E599]/10 hover:bg-[#00E599]/20 border border-[#00E599]/30 hover:border-[#00E599]/60 text-[#00E599] text-xs font-semibold tracking-wide transition-all shadow-[0_0_12px_rgba(0,229,153,0.15)] flex items-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          title="Open Step-by-Step Architecture & Demo Guide"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Guide</span>
        </button>

        {/* Emphasized CTA: Simulate Txn */}
        <button
          onClick={onOpenSimulator}
          className="tactile-btn px-3.5 py-1.5 rounded-xl bg-[#00E599] hover:bg-[#00cc88] text-black text-xs font-bold tracking-wide transition-all shadow-[0_0_16px_rgba(0,229,153,0.3)] flex items-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Simulate Txn</span>
        </button>

        {/* Stream Replay Toggle Button */}
        <button
          onClick={handleToggleStream}
          disabled={loading}
          className={`tactile-btn px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
            isStreaming
              ? 'bg-red-500/15 text-red-400 border-red-500/40 hover:bg-red-500/25'
              : 'bg-[#0E1216] hover:bg-[#1A2027] text-[#8E9AA8] hover:text-white border-[#20262E]'
          }`}
        >
          {isStreaming ? (
            <>
              <Square className="w-3 h-3 fill-current" strokeWidth={2} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" strokeWidth={2} />
              <span className="hidden sm:inline">Stream Replay</span>
              <span className="sm:hidden">Replay</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
