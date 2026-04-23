import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

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

interface RoleStat {
  role_category: string;
  count: number;
  avg_silicon_pct: number;
  total_ai_lines: number;
  total_lines: number;
}

interface SiliconStats {
  total_members: number;
  avg_silicon_pct: number;
  total_ai_lines: number;
  total_lines: number;
  overall_silicon_pct: number;
  role_distribution: RoleStat[];
}

const PAGE_SIZE = 12;
const ROTATE_INTERVAL = 6000;

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

export const PRSiliconChart: React.FC = () => {
  const [members, setMembers] = useState<SiliconContentItem[]>([]);
  const [stats, setStats] = useState<SiliconStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeView, setActiveView] = useState<'overview' | 'ranking'>('overview');

  const totalPages = Math.ceil(members.length / PAGE_SIZE);
  const displayMembers = members.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const maxPct = members.length > 0 ? members[0].silicon_percentage : 1;

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/silicon-contents/all`),
        fetch(`${API_BASE}/silicon-contents/stats`),
      ]);
      const membersData = await membersRes.json();
      const statsData = await statsRes.json();

      if (membersData.code === 0) {
        setMembers(membersData.data || []);
      } else {
        setError(membersData.message || '加载失败');
      }

      if (statsData.code === 0) {
        setStats(statsData.data);
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // 轮播
  useEffect(() => {
    if (members.length <= PAGE_SIZE || activeView !== 'ranking') return;
    const timer = setInterval(() => {
      setCurrentPage(prev => {
        const next = prev + 1;
        return next >= totalPages ? 0 : next;
      });
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [members.length, totalPages, activeView]);

  useEffect(() => {
    setCurrentPage(0);
  }, [members.length]);

  // 环形图配置
  const pieOption = useMemo(() => {
    if (!stats) return {};
    const aiLines = stats.total_ai_lines;
    const totalLines = stats.total_lines;
    const nonAiLines = totalLines - aiLines;
    const pct = totalLines > 0 ? ((aiLines / totalLines) * 100).toFixed(1) : '0.0';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Fira Sans' },
        formatter: (p: { name: string; value: number; percent: number }) =>
          `<div style="padding:4px 8px"><b>${p.name}</b><br/>行数：${p.value.toLocaleString()}<br/>占比：${p.percent}%</div>`,
      },
      legend: {
        bottom: '2%',
        textStyle: { color: '#94a3b8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          name: 'PR 硅含量',
          type: 'pie',
          radius: ['45%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'rgba(10,14,26,0.8)',
            borderWidth: 2,
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: '#e2e8f0',
              fontFamily: 'Fira Code',
            },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,212,255,0.4)',
            },
          },
          labelLine: { show: false },
          data: [
            {
              value: aiLines,
              name: 'AI 协助 (硅含量)',
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                  colorStops: [{ offset: 0, color: '#00d4ff' }, { offset: 1, color: '#0066cc' }],
                },
              },
            },
            {
              value: nonAiLines,
              name: '人工编写',
              itemStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                  colorStops: [{ offset: 0, color: '#334155' }, { offset: 1, color: '#1e293b' }],
                },
              },
            },
          ],
        },
      ],
    };
  }, [stats]);

  // 职类分布柱状图
  const barOption = useMemo(() => {
    if (!stats || !stats.role_distribution) return {};
    const data = stats.role_distribution;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0];
          const role = data[p.dataIndex];
          return `<div style="padding:4px 8px"><b>${p.name}</b><br/>人数：${role.count}<br/>平均硅含量：${role.avg_silicon_pct.toFixed(1)}%<br/>AI行数：${role.total_ai_lines.toLocaleString()}</div>`;
        },
      },
      grid: { left: '12%', right: '8%', top: '10%', bottom: '15%' },
      xAxis: {
        type: 'category',
        data: data.map(d => d.role_category),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 20 },
      },
      yAxis: {
        type: 'value',
        name: '平均硅含量 %',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' },
      },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: d.avg_silicon_pct,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#00d4ff' },
                { offset: 1, color: '#0066cc' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          color: '#00d4ff',
          fontSize: 10,
          formatter: '{c}%',
        },
      }],
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="dashboard-card glow-blue h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-400 rounded-full" />
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-400 rounded-full" />
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">PR 硅含量</h2>
          <span className="text-slate-500 text-xs">全员统计</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${activeView === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveView('ranking')}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${activeView === 'ranking' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            排行
          </button>
        </div>
      </div>

      {activeView === 'overview' ? (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
              <div className="text-blue-400 font-mono text-sm font-semibold">{stats?.total_members || 0}</div>
              <div className="text-slate-500 text-xs">参与人数</div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
              <div className="text-cyan-400 font-mono text-sm font-semibold">{stats?.overall_silicon_pct.toFixed(1) || '0.0'}%</div>
              <div className="text-slate-500 text-xs">整体硅含量</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-center">
              <div className="text-purple-400 font-mono text-sm font-semibold">{formatLines(stats?.total_ai_lines || 0)}</div>
              <div className="text-slate-500 text-xs">AI 代码行</div>
            </div>
          </div>

          {/* 环形图 */}
          <div className="relative flex-1 min-h-[140px]">
            <ReactECharts option={pieOption} style={{ height: '100%', minHeight: 140 }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '8%' }}>
              <div className="text-center">
                <div className="text-xl font-bold font-mono text-cyan-300" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>
                  {stats?.overall_silicon_pct.toFixed(1) || '0.0'}%
                </div>
                <div className="text-slate-400 text-xs mt-0.5">硅含量</div>
              </div>
            </div>
          </div>

          {/* 职类分布 */}
          <div className="mt-2 flex-1 min-h-[120px]">
            <div className="text-slate-500 text-xs mb-1">各职类平均硅含量</div>
            <ReactECharts option={barOption} style={{ height: '100%', minHeight: 120 }} />
          </div>
        </>
      ) : (
        <>
          {/* 页码指示器 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-1 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 ${
                    i === currentPage ? 'w-4 bg-blue-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          )}

          {/* 排行榜 */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {displayMembers.map((member) => {
              const rank = member.rank;
              const pct = maxPct > 0 ? (member.silicon_percentage / maxPct) * 100 : 0;
              const isTop3 = rank <= 3;
              const roleColor = roleColorMap[member.role_category] || '#64748b';

              return (
                <div
                  key={member.id}
                  className={`relative flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-500
                    ${isTop3 ? medalBgs[rank - 1] : 'bg-slate-900/50 border-slate-800/60'}`}
                >
                  <div className="w-7 text-center flex-shrink-0">
                    {isTop3 ? (
                      <span className="text-lg" style={{ color: medalColors[rank - 1], textShadow: `0 0 10px ${medalColors[rank - 1]}` }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-sm font-medium">{String(rank).padStart(2, '0')}</span>
                    )}
                  </div>

                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: roleColor + '40', border: `1px solid ${roleColor}60` }}>
                    {member.username[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-medium truncate">{member.username}</span>
                      <span className="text-slate-500 text-xs truncate">{member.role_category}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-700 to-cyan-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`font-mono text-sm font-semibold ${isTop3 ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {member.silicon_percentage.toFixed(1)}%
                    </span>
                    <span className="text-slate-600 text-xs font-mono">{formatLines(member.ai_lines)} / {formatLines(member.total_lines)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
            <span>
              共 {members.length} 人
              {totalPages > 1 && (
                <span className="ml-2 text-blue-500">第 {currentPage + 1}/{totalPages} 页</span>
              )}
            </span>
            <span className="font-mono">AI总计：{formatLines(stats?.total_ai_lines || 0)}</span>
          </div>
        </>
      )}
    </div>
  );
};
