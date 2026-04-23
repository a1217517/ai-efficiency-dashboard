import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface SiliconStats {
  total_members: number;
  avg_silicon_pct: number;
  total_ai_lines: number;
  total_lines: number;
  overall_silicon_pct: number;
}

const formatLines = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export const KPICards: React.FC = () => {
  const [siliconStats, setSiliconStats] = useState<SiliconStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/silicon-contents/stats`);
      const data = await res.json();
      if (data.code === 0) {
        setSiliconStats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 60000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  const kpiData = [
    {
      label: '整体硅含量',
      value: siliconStats ? `${siliconStats.overall_silicon_pct.toFixed(1)}%` : '--',
      change: siliconStats ? `共 ${siliconStats.total_members} 人` : '',
      changeType: 'up' as const,
      subLabel: 'AI 代码占比',
      color: 'cyan' as const,
      glow: 'rgba(0,212,255,0.5)',
    },
    {
      label: '今日 TOKEN 总量',
      value: '1.2M',
      change: '+8%',
      changeType: 'up' as const,
      subLabel: '较昨日',
      color: 'blue' as const,
      glow: 'rgba(59,130,246,0.5)',
    },
    {
      label: 'AI 采用率',
      value: '56%',
      change: '+5%',
      changeType: 'up' as const,
      subLabel: '较上周',
      color: 'emerald' as const,
      glow: 'rgba(16,185,129,0.5)',
    },
  ];

  return (
    <div className="px-4 py-3 grid grid-cols-3 gap-4">
      {kpiData.map((kpi, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-xl p-4 border border-slate-800/60"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,14,26,0.95) 100%)',
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${
                kpi.color === 'cyan' ? '#00d4ff' : kpi.color === 'blue' ? '#3b82f6' : '#10b981'
              } 0%, transparent 70%)`,
            }}
          />
          
          <div className="relative z-10">
            <div className="text-slate-400 text-sm mb-1">{kpi.label}</div>
            <div className="flex items-end gap-3">
              <div
                className="text-3xl font-bold font-mono"
                style={{
                  color: kpi.color === 'cyan' ? '#00d4ff' : kpi.color === 'blue' ? '#60a5fa' : '#34d399',
                  textShadow: `0 0 20px ${kpi.glow}`,
                }}
              >
                {kpi.value}
              </div>
              <div className="flex items-center gap-1 pb-1">
                <span className={kpi.changeType === 'up' ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                  {kpi.changeType === 'up' ? '↑' : '↓'} {kpi.change}
                </span>
                <span className="text-slate-600 text-xs">{kpi.subLabel}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
