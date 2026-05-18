import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import type { DateRange } from '../App';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

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
  dateRange: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  thresholdM?: number;
  onThresholdChange?: (val: number) => void;
}

const presets = [
  { label: '最近7天', days: 7 },
  { label: '最近15天', days: 15 },
  { label: '最近30天', days: 30 },
  { label: '最近90天', days: 90 },
];

export const TopBar: React.FC<TopBarProps> = ({ dateRange, onDateRangeChange, thresholdM = 1, onThresholdChange }) => {
  const [time, setTime] = useState(new Date());
  const [announcements, setAnnouncements] = useState<string[]>([
    '📊 正在加载实时数据...',
    '⚡ AI-Native 效能看板运行中',
  ]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);
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

  const applyPreset = (days: number, label: string) => {
    if (!onDateRangeChange) return;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const range = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label,
    };
    onDateRangeChange(range);
    setCustomStart(range.startDate);
    setCustomEnd(range.endDate);
    setPopoverOpen(false);
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (onThresholdChange) {
      onThresholdChange(isNaN(val) || val < 0 ? 0 : val);
    }
  };

  const applyCustom = () => {
    if (!onDateRangeChange || !customStart || !customEnd) return;
    onDateRangeChange({
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} ~ ${customEnd}`,
    });
    setPopoverOpen(false);
  };

  const isPresetActive = (label: string) => dateRange.label === label;

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

        {/* Right: DateFilter + Time + Nav */}
        <div className="flex items-center gap-4">
          {/* Token 达标阈值 */}
          {!isAdmin && onThresholdChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">达标阈值</span>
              <div className="relative w-[72px]">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={thresholdM}
                  onChange={handleThresholdChange}
                  className="w-full h-7 rounded-md border border-slate-700 bg-[#0f1629] px-2 pr-5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-mono">M</span>
              </div>
            </div>
          )}
          {/* Date Range Picker — 仅看板页面显示 */}
          {!isAdmin && onDateRangeChange && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 h-8 rounded-md border border-slate-700 bg-[#0f1629] px-3 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors">
                  <CalendarIcon className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="max-w-[120px] truncate">{dateRange.label}</span>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto border border-slate-700 bg-[#0f1629] p-3 text-white"
                align="end"
                sideOffset={6}
              >
                {/* Presets */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.days, p.label)}
                      className={`rounded px-2.5 py-1 text-xs transition-colors ${
                        isPresetActive(p.label)
                          ? 'bg-cyan-600 text-white'
                          : 'bg-[#1a2235] text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom date inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 rounded border border-slate-700 bg-[#1a2235] text-white px-2 text-xs"
                  />
                  <span className="text-slate-500 text-xs">~</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 rounded border border-slate-700 bg-[#1a2235] text-white px-2 text-xs"
                  />
                  <button
                    onClick={applyCustom}
                    className="h-8 px-3 rounded bg-cyan-600 text-xs text-white hover:bg-cyan-500 transition-colors"
                  >
                    确定
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}

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
