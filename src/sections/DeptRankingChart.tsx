import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { DateRange } from '../App';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface DeptRankingItem {
  dept_name: string;
  dept_level: string;
  member_count: number;
  avg_silicon_pct: number;
  total_ai_lines: number;
  total_lines: number;
  avg_daily_tokens: number;
  total_tokens: number;
  total_cost: number;
  rank: number;
}

interface MemberDetail {
  username: string;
  role_category: string;
  level1_dept: string;
  level2_dept: string;
  level3_dept?: string;
  level4_dept?: string;
  silicon_percentage: number;
  ai_lines: number;
  total_lines: number;
  daily_tokens: number;
  total_tokens: number;
  cost: number;
}

interface BreadcrumbItem {
  level: string;
  name: string;
}

const LEVEL_NAMES: Record<string, string> = {
  level1: '一级部门',
  level2: '二级部门',
  level3: '三级部门',
  level4: '四级部门',
};

const LEVEL_COLORS: Record<string, string> = {
  level1: '#f59e0b',
  level2: '#3b82f6',
  level3: '#22c55e',
  level4: '#a855f7',
  members: '#ef4444',
};

const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const formatLines = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface DeptRankingChartProps {
  dateRange: DateRange;
}

export const DeptRankingChart: React.FC<DeptRankingChartProps> = ({ dateRange }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [siliconData, setSiliconData] = useState<DeptRankingItem[]>([]);
  const [tokenData, setTokenData] = useState<DeptRankingItem[]>([]);
  const [members, setMembers] = useState<MemberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDepth = breadcrumbs.length;
  const isMembersView = currentDepth >= 4;
  const currentLevel = isMembersView ? 'members' : `level${currentDepth + 1}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '10');
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);

      if (isMembersView) {
        const mp = new URLSearchParams();
        breadcrumbs.forEach((b, i) => mp.append(`level${i + 1}`, b.name));
        if (dateRange.startDate) mp.append('start_date', dateRange.startDate);
        if (dateRange.endDate) mp.append('end_date', dateRange.endDate);
        const res = await fetch(`${API_BASE}/department-rankings/members?${mp.toString()}`);
        const data = await res.json();
        if (data.code === 0) setMembers(data.data?.list || []);
        setSiliconData([]);
        setTokenData([]);
      } else {
        const level = `level${currentDepth + 1}`;
        const rp = new URLSearchParams(params.toString());
        rp.append('level', level);
        breadcrumbs.forEach((b, i) => rp.append(`parent_level${i + 1}`, b.name));

        const [siliconRes, tokenRes] = await Promise.all([
          fetch(`${API_BASE}/department-rankings/silicon?${rp.toString()}`),
          fetch(`${API_BASE}/department-rankings/token?${rp.toString()}`),
        ]);

        const siliconJson = await siliconRes.json();
        const tokenJson = await tokenRes.json();

        if (siliconJson.code === 0) setSiliconData(siliconJson.data?.list || []);
        if (tokenJson.code === 0) setTokenData(tokenJson.data?.list || []);
        setMembers([]);
      }
      setError(null);
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [breadcrumbs, currentDepth, isMembersView, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const drillDown = (item: DeptRankingItem) => {
    if (currentDepth >= 4) return;
    setBreadcrumbs(prev => [...prev, { level: currentLevel, name: item.dept_name }]);
  };

  const goToBreadcrumb = (index: number) => {
    setBreadcrumbs(prev => prev.slice(0, index));
  };

  const goRoot = () => setBreadcrumbs([]);

  // ECharts click handler
  const onSiliconChartClick = (params: any) => {
    if (currentDepth >= 4 || !siliconData[params.dataIndex]) return;
    drillDown(siliconData[params.dataIndex]);
  };

  const onTokenChartClick = (params: any) => {
    if (currentDepth >= 4 || !tokenData[params.dataIndex]) return;
    drillDown(tokenData[params.dataIndex]);
  };

  const siliconOption = useMemo(() => {
    if (siliconData.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#475569', fontSize: 13 } },
      };
    }
    const sorted = [...siliconData].sort((a, b) => a.avg_silicon_pct - b.avg_silicon_pct);
    const depts = sorted.map(d => d.dept_name);
    const values = sorted.map(d => parseFloat(d.avg_silicon_pct.toFixed(1)));
    const color = LEVEL_COLORS[currentLevel] || '#3b82f6';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0];
          const d = sorted[p.dataIndex];
          return `<div style="padding:4px 8px">
            <b>${d.dept_name}</b><br/>
            平均硅含量：<b style="color:${color}">${d.avg_silicon_pct.toFixed(1)}%</b><br/>
            人数：<b style="color:#94a3b8">${d.member_count} 人</b><br/>
            AI代码量：<b style="color:#94a3b8">${formatLines(d.total_ai_lines)}</b>
            ${currentDepth < 4 ? '<br/><span style="color:#00d4ff">👆 点击柱状图下钻</span>' : ''}
          </div>`;
        },
      },
      grid: { left: 8, right: 60, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value', max: 100,
        axisLabel: { color: '#475569', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category', data: depts,
        axisLabel: { color: '#94a3b8', fontSize: 11, width: 100, overflow: 'break' },
        axisLine: { lineStyle: { color: '#1e293b' } },
        splitLine: { show: false },
      },
      series: [{
        type: 'bar', barWidth: '55%',
        data: values.map((value) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: color + '60' },
                { offset: 1, color: color },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true, position: 'right',
          formatter: (p: any) => `${p.value}%`,
          color: color, fontSize: 11, fontWeight: 'bold',
        },
      }],
    };
  }, [siliconData, currentLevel, currentDepth]);

  const tokenOption = useMemo(() => {
    if (tokenData.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#475569', fontSize: 13 } },
      };
    }
    const sorted = [...tokenData].sort((a, b) => a.avg_daily_tokens - b.avg_daily_tokens);
    const depts = sorted.map(d => d.dept_name);
    const values = sorted.map(d => d.avg_daily_tokens);
    const color = LEVEL_COLORS[currentLevel] || '#22c55e';
    const maxVal = Math.max(...values);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0];
          const d = sorted[p.dataIndex];
          return `<div style="padding:4px 8px">
            <b>${d.dept_name}</b><br/>
            平均日均Token：<b style="color:${color}">${formatTokens(d.avg_daily_tokens)}</b><br/>
            人数：<b style="color:#94a3b8">${d.member_count} 人</b><br/>
            总Token：<b style="color:#94a3b8">${formatTokens(d.total_tokens)}</b>
            ${currentDepth < 4 ? '<br/><span style="color:#00d4ff">👆 点击柱状图下钻</span>' : ''}
          </div>`;
        },
      },
      grid: { left: 8, right: 70, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value', max: maxVal * 1.15,
        axisLabel: { color: '#475569', fontSize: 10, formatter: (v: number) => formatTokens(v) },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category', data: depts,
        axisLabel: { color: '#94a3b8', fontSize: 11, width: 100, overflow: 'break' },
        axisLine: { lineStyle: { color: '#1e293b' } },
        splitLine: { show: false },
      },
      series: [{
        type: 'bar', barWidth: '55%',
        data: values.map((value) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: color + '60' },
                { offset: 1, color: color },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true, position: 'right',
          formatter: (p: any) => formatTokens(p.value),
          color: color, fontSize: 11, fontWeight: 'bold',
        },
      }],
    };
  }, [tokenData, currentLevel, currentDepth]);

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalBgs = [
    'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40',
    'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40',
    'bg-gradient-to-r from-orange-700/20 to-orange-800/10 border-orange-700/40',
  ];

  const mainColor = LEVEL_COLORS[currentLevel] || '#3b82f6';

  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      {/* Header + 面包屑 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: mainColor, boxShadow: `0 0 8px ${mainColor}` }} />
          <h2 className="text-white font-semibold text-base">
            {isMembersView ? '部门成员详情' : `${LEVEL_NAMES[currentLevel] || '部门'}排行榜`}
          </h2>
          <span className="text-slate-500 text-xs">{dateRange.label}</span>
        </div>
      </div>

      {/* 面包屑导航 */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <button
          onClick={goRoot}
          className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
            breadcrumbs.length === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          全部一级部门
        </button>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="text-slate-600 text-xs">/</span>
            <button
              onClick={() => goToBreadcrumb(idx + 1)}
              className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                idx === breadcrumbs.length - 1 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
        {isMembersView && (
          <>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-300">成员</span>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-2">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={fetchData} className="text-cyan-400 text-xs hover:underline cursor-pointer">重试</button>
        </div>
      ) : isMembersView ? (
        /* 成员列表视图 */
        <div className="flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-sm">该部门暂无成员数据</div>
          ) : (
            <div className="space-y-1.5">
              {members.map((m, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                return (
                  <div
                    key={m.username}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                      isTop3 ? medalBgs[rank - 1] : 'bg-slate-900/50 border-slate-800/60'
                    }`}
                  >
                    <div className="w-7 text-center flex-shrink-0">
                      {isTop3 ? (
                        <span className="text-lg" style={{ color: medalColors[rank - 1] }}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-sm">{String(rank).padStart(2, '0')}</span>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-blue-600 to-cyan-500">
                      {m.username[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{m.username}</span>
                        <span className="text-slate-500 text-xs">{m.role_category}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>硅含量: <span className="text-cyan-300 font-mono">{m.silicon_percentage.toFixed(1)}%</span></span>
                        <span>AI: <span className="text-blue-300 font-mono">{formatLines(m.ai_lines)}</span></span>
                        <span>Token: <span className="text-green-300 font-mono">{formatTokens(m.daily_tokens)}/日</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 部门排行图表 */
        <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
          {/* PR 硅含量排行 */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-slate-300 text-sm font-medium">PR 硅含量</span>
                <span className="text-slate-600 text-xs">Top {siliconData.length}</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {siliconData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">暂无数据</div>
              ) : (
                <ReactECharts
                  option={siliconOption}
                  style={{ height: '100%', minHeight: 200 }}
                  onEvents={{ click: onSiliconChartClick }}
                />
              )}
            </div>
          </div>

          {/* Token 日均排行 */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300 text-sm font-medium">Token 日均</span>
                <span className="text-slate-600 text-xs">Top {tokenData.length}</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {tokenData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">暂无数据</div>
              ) : (
                <ReactECharts
                  option={tokenOption}
                  style={{ height: '100%', minHeight: 200 }}
                  onEvents={{ click: onTokenChartClick }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
