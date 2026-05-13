import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DateRange } from '../App';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface TokenUsageItem {
  id: string;
  rank: number;
  username: string;
  role_category: string;
  total_tokens: number;
  daily_tokens: number;
  request_count: number;
  cost: number;
}

const formatTokens = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const medalBgs = [
  'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40',
  'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40',
  'bg-gradient-to-r from-orange-700/20 to-orange-800/10 border-orange-700/40',
];

const PAGE_SIZE = 10;
const ROTATE_INTERVAL = 5000; // 5秒

interface TokenRankingProps {
  dateRange: DateRange;
}

export const TokenRanking: React.FC<TokenRankingProps> = ({ dateRange }) => {
  const [members, setMembers] = useState<TokenUsageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef<number>(0);
  const rotateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  const displayMembers = members.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const maxTokens = members.length > 0 ? members[0].daily_tokens : 1;
  const totalDailyTokens = members.reduce((s, m) => s + m.daily_tokens, 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);
      const url = `${API_BASE}/token-usages/all${params.toString() ? '?' + params.toString() : ''}`;
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

  // 日期范围变化时重置到第一页
  useEffect(() => {
    setCurrentPage(0);
  }, [dateRange]);

  // 轮播：每5秒翻页（支持暂停）
  useEffect(() => {
    if (members.length <= PAGE_SIZE) return;
    if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
    rotateTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now < pauseUntilRef.current) return;
      setCurrentPage(prev => {
        const next = prev + 1;
        return next >= totalPages ? 0 : next;
      });
    }, ROTATE_INTERVAL);
    return () => {
      if (rotateTimerRef.current) clearInterval(rotateTimerRef.current);
    };
  }, [members.length, totalPages]);

  const handleDotClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    pauseUntilRef.current = Date.now() + 5000; // 点击后暂停轮播5秒
  };

  if (loading && members.length === 0) {
    return (
      <div className="dashboard-card glow-cyan h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
            <h2 className="text-white font-semibold text-base">Token 日均排行榜</h2>
            <span className="text-slate-500 text-xs">{dateRange.label}</span>
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
      <div className="dashboard-card glow-cyan h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
            <h2 className="text-white font-semibold text-base">Token 日均排行榜</h2>
            <span className="text-slate-500 text-xs">{dateRange.label}</span>
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
    <div className="dashboard-card glow-cyan h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
          <h2 className="text-white font-semibold text-base">Token 日均排行榜</h2>
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
                i === currentPage ? 'w-4 bg-cyan-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`跳转到第 ${i + 1} 页`}
            />
          ))}
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {displayMembers.map((member) => {
          const rank = member.rank;
          const pct = maxTokens > 0 ? (member.daily_tokens / maxTokens) * 100 : 0;
          const isTop3 = rank <= 3;

          return (
            <div
              key={member.id}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 cursor-pointer hover:border-cyan-500/50
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
              <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border ${isTop3 ? 'border-yellow-500/50' : 'border-slate-700'}`}>
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                  {member.username[0]}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium">{member.username}</span>
                  <span className="text-slate-500 text-xs truncate">{member.role_category}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isTop3 ? 'progress-shimmer' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Tokens */}
              <div className="flex flex-col items-end flex-shrink-0">
                <span
                  className={`font-mono text-sm font-semibold ${isTop3 ? 'text-cyan-300' : 'text-slate-300'}`}
                  style={isTop3 ? { textShadow: '0 0 8px rgba(0,212,255,0.6)' } : {}}
                >
                  {formatTokens(member.daily_tokens)}
                </span>
                <span className="text-slate-600 text-xs font-mono">{member.request_count.toLocaleString()} 次</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <span>
          共 {members.length} 人参与
          {totalPages > 1 && (
            <span className="ml-2 text-cyan-500">
              第 {currentPage + 1}/{totalPages} 页 · 5s 轮播
            </span>
          )}
        </span>
        <span className="font-mono">日均总计：{formatTokens(totalDailyTokens)}</span>
      </div>
    </div>
  );
};
