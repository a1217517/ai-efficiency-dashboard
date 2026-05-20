import React, { useState, useEffect, useCallback } from 'react';
import type { DateRange } from '../App';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface SiliconStats {
  total_members: number;
  avg_silicon_pct: number;
  total_ai_lines: number;
  total_lines: number;
  overall_silicon_pct: number;
}

interface TeamSaving {
  id: string;
  team_name: string;
  traditional_minutes: number;
  standard_minutes: number;
  minutes: number;
  hours: number;
}


interface TokenUsageItem {
  total_tokens: number;
  daily_tokens: number;
  username: string;
  role_category: string;
}

const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface KPICardsProps {
  dateRange: DateRange;
  thresholdM: number;
  siliconThreshold: number;
}

export const KPICards: React.FC<KPICardsProps> = ({ dateRange, thresholdM, siliconThreshold }) => {
  const [siliconStats, setSiliconStats] = useState<SiliconStats | null>(null);
  const [teamSavings, setTeamSavings] = useState<TeamSaving[]>([]);
  const [tokenUsages, setTokenUsages] = useState<TokenUsageItem[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const tokenParams = new URLSearchParams();
      if (dateRange.startDate) tokenParams.append('start_date', dateRange.startDate);
      if (dateRange.endDate) tokenParams.append('end_date', dateRange.endDate);
      const tokenUrl = `${API_BASE}/token-usages/all${tokenParams.toString() ? '?' + tokenParams.toString() : ''}`;

      const siliconParams = new URLSearchParams();
      if (dateRange.startDate) siliconParams.append('start_date', dateRange.startDate);
      if (dateRange.endDate) siliconParams.append('end_date', dateRange.endDate);
      const siliconUrl = `${API_BASE}/silicon-contents/stats${siliconParams.toString() ? '?' + siliconParams.toString() : ''}`;

      const [siliconRes, savingsRes, tokenRes] = await Promise.all([
        fetch(siliconUrl),
        fetch(`${API_BASE}/team-savings/all`),
        fetch(tokenUrl),
      ]);
      const siliconData = await siliconRes.json();
      const savingsData = await savingsRes.json();
      const tokenData = await tokenRes.json();

      if (siliconData.code === 0) {
        setSiliconStats(siliconData.data);
      }
      if (savingsData.code === 0) {
        setTeamSavings(savingsData.data || []);
      }
      if (tokenData.code === 0) {
        setTokenUsages(tokenData.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 60000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  const avgMultiplier = teamSavings.length > 0
    ? teamSavings.reduce((sum, t) => {
        const ratio = t.standard_minutes > 0 ? t.traditional_minutes / t.standard_minutes : 0;
        return sum + ratio;
      }, 0) / teamSavings.length
    : 0;
  const multiplierDisplay = avgMultiplier >= 1
    ? `${avgMultiplier.toFixed(2)}倍`
    : `${avgMultiplier.toFixed(2)}倍`;

  const totalDailyTokens = tokenUsages.reduce((s, t) => s + (t.daily_tokens || 0), 0);

  const siliconMeetsThreshold = siliconStats ? siliconStats.overall_silicon_pct >= siliconThreshold : false;
  const tokenQualifiedCount = tokenUsages.filter(t => (t.daily_tokens || 0) >= thresholdM * 1_000_000).length;

  const kpiData = [
    {
      label: '整体硅含量',
      value: siliconStats ? `${siliconStats.overall_silicon_pct.toFixed(1)}%` : '--',
      change: siliconStats ? `共 ${siliconStats.total_members} 人${siliconMeetsThreshold ? ' · ✅ 已达标' : ''}` : '',
      changeType: siliconMeetsThreshold ? 'up' as const : 'down' as const,
      subLabel: `AI 代码占比 (阈值: ${siliconThreshold}%)`,
      color: siliconMeetsThreshold ? 'cyan' as const : 'emerald' as const,
      glow: siliconMeetsThreshold ? 'rgba(0,212,255,0.5)' : 'rgba(16,185,129,0.5)',
    },
    {
      label: 'Token 日均使用量',
      value: tokenUsages.length > 0 ? formatTokens(totalDailyTokens) : '--',
      change: tokenUsages.length > 0 ? `${tokenUsages.length} 人${tokenQualifiedCount > 0 ? ` · ${tokenQualifiedCount} 人达标` : ''}` : '',
      changeType: 'up' as const,
      subLabel: dateRange.label + ` (阈值: ${thresholdM}M)`,
      color: 'blue' as const,
      glow: 'rgba(59,130,246,0.5)',
    },
    {
      label: '各团队平均效率提升倍数',
      value: teamSavings.length > 0 ? multiplierDisplay : '--',
      change: teamSavings.length > 0 ? `${teamSavings.length} 个团队` : '',
      changeType: 'up' as const,
      subLabel: '标准化部署收益',
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
