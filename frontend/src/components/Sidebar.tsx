import React from 'react';
import { 
  Activity, 
  Radio, 
  AlertTriangle, 
  FolderLock, 
  Share2, 
  Cpu, 
  ShieldAlert, 
  Server,
  ShieldCheck,
  TrendingUp,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  alertCount: number;
  onOpenGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onSelectView, 
  alertCount,
  onOpenGuide 
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity, count: '150k' },
    { id: 'live-monitor', label: 'Live Monitor', icon: Radio, pulse: true },
    { id: 'alerts', label: 'Fraud Alerts', icon: AlertTriangle, badge: alertCount || 4 },
    { id: 'cases', label: 'Investigation Cases', icon: FolderLock, count: '3' },
    { id: 'graph', label: 'Graph Intelligence', icon: Share2, count: '100' },
    { id: 'models', label: 'Model Performance', icon: Cpu, count: 'v1.0' },
    { id: 'drift', label: 'Drift Monitoring', icon: ShieldAlert },
    { id: 'system', label: 'System Status', icon: Server, statusLed: true },
  ];

  return (
    <aside className="w-64 bg-[#0B0E11] border-r border-[#20262E] flex flex-col justify-between select-none shrink-0 h-full">
      <div>
        {/* Brand Header with Live Green Dot (like User Image) */}
        <div className="h-16 flex items-center px-6 border-b border-[#20262E] gap-3">
          <div className="w-9 h-9 bg-[#00E599]/15 border border-[#00E599]/35 rounded-xl flex items-center justify-center text-[#00E599] shadow-[0_0_15px_rgba(0,229,153,0.25)]">
            <ShieldCheck className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 leading-none">
              FraudGuard <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E599]/20 text-[#00E599] font-bold font-mono border border-[#00E599]/35">AI</span>
            </h1>
            <p className="text-[10px] text-[#8E9AA8] mt-1 leading-none font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
              <span>Finance Sentinel</span>
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3">
          <div className="px-3 mb-2 font-mono text-[10px] font-bold tracking-wider text-[#586574] uppercase">
            OPERATIONS CONSOLE
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#13171C] text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border-l-2 border-[#00E599] font-semibold'
                      : 'text-[#8E9AA8] hover:text-white hover:bg-[#13171C]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00E599]' : 'text-[#8E9AA8]'}`} strokeWidth={isActive ? 2.2 : 1.75} />
                    <span className="leading-none text-xs">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.pulse && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]"></span>
                      </span>
                    )}
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold tabular-nums rounded-full bg-red-500/20 text-red-400 border border-red-500/35">
                        {item.badge}
                      </span>
                    )}
                    {item.count && !item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-mono tabular-nums rounded-full bg-[#0E1216] text-[#8E9AA8] border border-[#20262E]">
                        {item.count}
                      </span>
                    )}
                    {item.statusLed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] shadow-[0_0_6px_rgba(0,229,153,0.8)]"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Gauge Widget (Inspired by 480/500 Arc in User Image) */}
      <div className="p-3 border-t border-[#20262E]">
        <div className="p-3 rounded-2xl bg-[#13171C] border border-[#20262E] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-bold font-mono">113 / 150 TPS</span>
            <span className="text-[10px] font-mono font-bold text-[#00E599] bg-[#00E599]/15 px-2 py-0.5 rounded-full border border-[#00E599]/30">
              OPTIMAL
            </span>
          </div>

          {/* Progress bar with neon green gradient */}
          <div className="w-full bg-[#0E1216] h-1.5 rounded-full overflow-hidden border border-[#20262E]">
            <div className="bg-gradient-to-r from-[#00E599] to-[#00D8F6] h-full rounded-full w-[75%] shadow-[0_0_8px_rgba(0,229,153,0.6)]"></div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#586574] font-mono">
            <span>P95: 9.59 ms</span>
            <span>Target: &lt; 20 ms</span>
          </div>
        </div>

        {/* Quick Guide Trigger button in sidebar as well */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-[#0E1216] hover:bg-[#13171C] border border-[#20262E] text-xs font-medium text-[#8E9AA8] hover:text-[#00E599] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Demo Guide</span>
          </button>
        )}
      </div>
    </aside>
  );
};
