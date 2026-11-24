import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate' | 'coral';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'slate'
}) => {
  const colorMap = {
    emerald: {
      text: 'text-[#00E599]',
      bg: 'bg-[#00E599]/10',
      border: 'border-[#00E599]/30',
      stroke: '#00E599',
      glow: 'shadow-[0_0_12px_rgba(0,229,153,0.2)]'
    },
    amber: {
      text: 'text-[#FF9900]',
      bg: 'bg-[#FF9900]/10',
      border: 'border-[#FF9900]/30',
      stroke: '#FF9900',
      glow: 'shadow-[0_0_12px_rgba(255,153,0,0.2)]'
    },
    rose: {
      text: 'text-[#FF4D4D]',
      bg: 'bg-[#FF4D4D]/10',
      border: 'border-[#FF4D4D]/30',
      stroke: '#FF4D4D',
      glow: 'shadow-[0_0_12px_rgba(255,77,77,0.2)]'
    },
    coral: {
      text: 'text-[#FF4D4D]',
      bg: 'bg-[#FF4D4D]/10',
      border: 'border-[#FF4D4D]/30',
      stroke: '#FF4D4D',
      glow: 'shadow-[0_0_12px_rgba(255,77,77,0.2)]'
    },
    cyan: {
      text: 'text-[#00D8F6]',
      bg: 'bg-[#00D8F6]/10',
      border: 'border-[#00D8F6]/30',
      stroke: '#00D8F6',
      glow: 'shadow-[0_0_12px_rgba(0,216,246,0.2)]'
    },
    slate: {
      text: 'text-[#8E9AA8]',
      bg: 'bg-[#0E1216]',
      border: 'border-[#20262E]',
      stroke: '#8E9AA8',
      glow: ''
    }
  };

  const scheme = colorMap[color] || colorMap.slate;

  return (
    <div className="bg-[#13171C] border border-[#20262E] hover:border-[#2C3642] rounded-2xl p-4 flex flex-col justify-between transition-all min-w-0 relative overflow-hidden group">
      
      {/* Top Header: Title & Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] font-bold text-[#8E9AA8] tracking-wider uppercase pr-2">
          {title}
        </span>
        <div className={`w-7 h-7 rounded-lg border ${scheme.bg} ${scheme.border} ${scheme.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
      </div>

      {/* Middle Figure & Mini Sparkline Row */}
      <div className="flex items-end justify-between mt-1">
        <div className="min-w-0">
          <span className="text-xl font-bold font-mono tabular-nums tracking-tight text-white block">
            {value}
          </span>
          {trend ? (
            <span className={`text-[11px] font-mono tabular-nums font-semibold ${scheme.text}`}>
              {trend}
            </span>
          ) : null}
        </div>

        {/* Decorative Glowing Sparkline (similar to user's finance dashboard image) */}
        <div className="w-16 h-8 shrink-0 flex items-center justify-end opacity-80 group-hover:opacity-100 transition-opacity">
          <svg className="w-full h-full" viewBox="0 0 60 30" fill="none">
            <path
              d="M2 24 C 15 22, 25 10, 38 16 C 48 20, 52 6, 58 4"
              stroke={scheme.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Subtitle / Footer */}
      {subtitle && (
        <p className="mt-2 text-[11px] text-[#586574] font-sans truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
