import React, { useState, useEffect, useCallback } from 'react';
import type { DateRange } from '../App';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface SiliconContentItem {
  id: string;
  rank: number;
  username: string;
  role_category: string;
  silicon_percentage: number;
  ai_lines: number;
  total_lines: number;
}

const PAGE_SIZE = 10;

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const medalBgs = [
  'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40',
  'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40',
  'bg-gradient-to-r from-orange-700/20 to-orange-800/10 border-orange-700/40',
];

const roleColorMap: Record<string, string> = {
  '开发类': '#3b82f6',
  '测试类': '#22c55e',
  '管理类': '#a855f7',
  '安全类': '#ef4444',
  '运维类': '#f59e0b',
  '项目管理类': '#06b6d4',
  '设计类': '#ec4899',
  '产品类': '#8b5cf6',
  '软件开发类': '#14b8a6',
};

const formatLines = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface PRSiliconChartProps {
  dateRange: DateRange;
  siliconThreshold: number;
}

export const PRSiliconChart: React.FC<PRSiliconChartProps> = ({ dateRange, siliconThreshold }) => {
  const [members, setMembers] = useState<SiliconContentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  const displayMembers = members.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const maxPct = members.length > 0 ? members[0].silicon_percentage : 1;
  const totalAILines = members.reduce((s, m) => s + m.ai_lines, 0);
  const qualifiedCount = members.filter(m => m.silicon_percentage >= siliconThreshold).length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      const url = `${API_BASE}/silicon-contents/all${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 0) {
        setMembers(data.data || []);
        setError(null);
      } else {
        setError(data.message || '加载失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // 数据刷新：每60秒
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleDotClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  // 日期范围变化时重置到第一页
  useEffect(() => {
    setCurrentPage(0);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="dashboard-card glow-blue h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
            <h2 className="text-white font-semibold text-base">PR 硅含量</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-slate-500">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card glow-blue h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
            <h2 className="text-white font-semibold text-base">PR 硅含量</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center flex-col gap-2">
          <span className="text-red-400">{error}</span>
          <button onClick={fetchData} className="text-cyan-400 text-sm hover:underline">重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card glow-blue h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
          <h2 className="text-white font-semibold text-base">PR 硅含量</h2>
          <span className="text-slate-500 text-xs">{dateRange.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">LIVE</span>
        </div>
      </div>

      {/* 页码指示器 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mb-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 ${
                i === currentPage ? 'w-4 bg-blue-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`跳转到第 ${i + 1} 页`}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {displayMembers.map((member) => {
          const rank = member.rank;
          const pct = maxPct > 0 ? (member.silicon_percentage / maxPct) * 100 : 0;
          const isTop3 = rank <= 3;
          const isQualified = member.silicon_percentage >= siliconThreshold;
          const roleColor = roleColorMap[member.role_category] || '#64748b';

          return (
            <div
              key={member.id}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 cursor-pointer hover:border-blue-500/50
                ${isTop3 ? medalBgs[rank - 1] : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-800/50'}`}
            >
              {/* Rank */}
              <div className="w-7 text-center flex-shrink-0">
                {isTop3 ? (
                  <span className="text-lg" style={{ color: medalColors[rank - 1], textShadow: `0 0 10px ${medalColors[rank - 1]}` }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono text-sm font-medium">{String(rank).padStart(2, '0')}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: roleColor + '40', border: `1px solid ${roleColor}60` }}>
                {member.username[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium truncate">{member.username}</span>
                  <span className="text-slate-500 text-xs truncate">{member.role_category}</span>
                  {isQualified && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border"
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(59,130,246,0.15) 100%)',
                        borderColor: 'rgba(0,212,255,0.4)',
                        color: '#00d4ff',
                        textShadow: '0 0 6px rgba(0,212,255,0.4)',
                        boxShadow: '0 0 8px rgba(0,212,255,0.15)',
                      }}
                      title={`硅含量 ≥ ${siliconThreshold}%，AI Native 开发人员`}
                    >
                      AI Native
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isTop3 ? 'progress-shimmer' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Silicon % */}
              <div className="flex flex-col items-end flex-shrink-0">
                <span
                  className={`font-mono text-sm font-semibold ${isTop3 ? 'text-cyan-300' : 'text-slate-300'}`}
                  style={isTop3 ? { textShadow: '0 0 8px rgba(0,212,255,0.6)' } : {}}
                >
                  {member.silicon_percentage.toFixed(1)}%
                </span>
                <span className="text-slate-600 text-xs font-mono">{formatLines(member.ai_lines)} / {formatLines(member.total_lines)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <span>
          共 {members.length} 人参与
          {qualifiedCount > 0 && (
            <span className="ml-2 text-blue-400">
              {qualifiedCount} 人达标
            </span>
          )}
          {totalPages > 1 && (
            <span className="ml-2 text-blue-500">
              第 {currentPage + 1}/{totalPages} 页
            </span>
          )}
        </span>
        <span className="font-mono">AI总计：{formatLines(totalAILines)}</span>
      </div>
    </div>
  );
};
