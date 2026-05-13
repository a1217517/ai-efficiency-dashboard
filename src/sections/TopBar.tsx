import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { DateRange } from '../App';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface SiliconStats {
  total_members: number;
  overall_silicon_pct: number;
  role_distribution?: { role_category: string; avg_silicon_pct: number; count: number }[];
}

interface TeamSaving {
  team_name: string;
  minutes: number;
  hours: number;
}

interface TokenUsage {
  total_tokens: number;
  username: string;
  role_category: string;
}

interface TopBarProps {
  dateRange?: DateRange;
}

export const TopBar: React.FC<TopBarProps> = ({ dateRange }) => {
  const [time, setTime] = useState(new Date());
  const [announcements, setAnnouncements] = useState<string[]>([
    '📊 正在加载实时数据...',
    '⚡ AI-Native 效能看板运行中',
  ]);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchTickerData = useCallback(async () => {
    try {
      const tokenParams = new URLSearchParams();
      if (dateRange?.startDate) tokenParams.append('start_date', dateRange.startDate);
      if (dateRange?.endDate) tokenParams.append('end_date', dateRange.endDate);
      const tokenUrl = `${API_BASE}/token-usages/all${tokenParams.toString() ? '?' + tokenParams.toString() : ''}`;

      const [siliconRes, savingsRes, tokenRes] = await Promise.all([
        fetch(`${API_BASE}/silicon-contents/stats`).catch(() => null),
        fetch(`${API_BASE}/team-savings/all`).catch(() => null),
        fetch(tokenUrl).catch(() => null),
      ]);

      const msgs: string[] = [];

      // 硅含量数据
      if (siliconRes) {
        const siliconData = await siliconRes.json();
        if (siliconData.code === 0) {
          const stats: SiliconStats = siliconData.data;
          msgs.push(`🔬 全员硅含量 ${stats.overall_silicon_pct.toFixed(1)}%，${stats.total_members} 人参与`);
          if (stats.role_distribution) {
            const topRole = stats.role_distribution.reduce((a, b) =>
              a.avg_silicon_pct > b.avg_silicon_pct ? a : b
            );
            msgs.push(`🏆 ${topRole.role_category} 平均硅含量最高 ${topRole.avg_silicon_pct.toFixed(1)}%（${topRole.count} 人）`);
          }
        }
      }

      // 节省时间数据
      if (savingsRes) {
        const savingsData = await savingsRes.json();
        if (savingsData.code === 0) {
          const teams: TeamSaving[] = savingsData.data || [];
          const totalMin = teams.reduce((s, t) => s + t.minutes, 0);
          const totalH = (totalMin / 60).toFixed(1);
          msgs.push(`⏱️ 标准化部署累计节省 ${totalH} 小时，${teams.length} 个团队受益`);
          const topTeam = teams.reduce((a, b) => (a.minutes > b.minutes ? a : b), teams[0]);
          if (topTeam) {
            msgs.push(`🚀 ${topTeam.team_name} 节省最多 ${topTeam.minutes} 分钟（${topTeam.hours.toFixed(2)}h）`);
          }
        }
      }

      // Token 数据
      if (tokenRes) {
        const tokenData = await tokenRes.json();
        if (tokenData.code === 0) {
          const items: TokenUsage[] = tokenData.data || [];
          const totalTokens = items.reduce((s, t) => s + (t.total_tokens || 0), 0);
          const fmt = (n: number) => {
            if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
            if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
            return String(n);
          };
          msgs.push(`🤖 Token 总使用量 ${fmt(totalTokens)}，${items.length} 人参与`);
          if (items.length > 0) {
            const top = items[0];
            msgs.push(`👑 ${top.username} 位居 Token 榜首（${fmt(top.total_tokens)}）`);
          }
        }
      }

      if (msgs.length > 0) {
        setAnnouncements(msgs);
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTickerData();
    const timer = setInterval(fetchTickerData, 60000);
    return () => clearInterval(timer);
  }, [fetchTickerData]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = `${time.getFullYear()}/${pad(time.getMonth() + 1)}/${pad(time.getDate())}`;

  const tickerItems = [...announcements, ...announcements, ...announcements];

  return (
    <header className="relative z-10">
      {/* Main header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60" style={{ background: 'rgba(8,14,26,0.95)', backdropFilter: 'blur(12px)' }}>
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(0,212,255,0.5)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              {isAdmin ? '后台管理系统' : 'AI-NATIVE 效能看板'}
            </h1>
          </div>
        </div>

        {/* Right: Time + Nav */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-mono text-lg font-semibold leading-tight" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              {dateStr} {timeStr}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1 text-xs rounded transition-colors ${isAdmin ? 'text-slate-400 border border-slate-700 hover:bg-slate-800/50' : 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20'}`}
            >
              看板
            </button>
            <button
              onClick={() => navigate('/admin')}
              className={`px-3 py-1 text-xs rounded transition-colors ${isAdmin ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20' : 'text-slate-400 border border-slate-700 hover:bg-slate-800/50'}`}
            >
              后台管理
            </button>
          </div>
        </div>
      </div>

      {/* Ticker/Marquee */}
      <div className="w-full overflow-hidden py-2 border-b border-slate-800/40" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.1) 50%, rgba(0,212,255,0.05) 100%)' }}>
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
          {tickerItems.map((msg, idx) => (
            <span key={idx} className="text-sm text-cyan-300/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {msg}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};
