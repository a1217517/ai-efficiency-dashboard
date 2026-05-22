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


type DeptLevel = 'level1' | 'level2' | 'level3' | 'level4';

const LEVEL_LABELS: Record<DeptLevel, string> = {
  level1: '一级部门',
  level2: '二级部门',
  level3: '三级部门',
  level4: '四级部门',
};

const LEVEL_COLORS: Record<DeptLevel, string> = {
  level1: '#f59e0b',
  level2: '#3b82f6',
  level3: '#22c55e',
  level4: '#a855f7',
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
  const [activeLevel, setActiveLevel] = useState<DeptLevel>('level2');
  const [siliconData, setSiliconData] = useState<DeptRankingItem[]>([]);
  const [tokenData, setTokenData] = useState<DeptRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('level', activeLevel);
      params.append('limit', '10');
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);

      const [siliconRes, tokenRes] = await Promise.all([
        fetch(`${API_BASE}/department-rankings/silicon?${params.toString()}`),
        fetch(`${API_BASE}/department-rankings/token?${params.toString()}`),
      ]);

      const siliconJson = await siliconRes.json();
      const tokenJson = await tokenRes.json();

      if (siliconJson.code === 0) {
        setSiliconData(siliconJson.data?.list || []);
      }
      if (tokenJson.code === 0) {
        setTokenData(tokenJson.data?.list || []);
      }
      setError(null);
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [activeLevel, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const mainColor = LEVEL_COLORS[activeLevel];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0];
          const idx = p.dataIndex;
          const d = sorted[idx];
          return `<div style="padding:4px 8px">
            <b>${d.dept_name}</b><br/>
            平均硅含量：<b style="color:${mainColor}">${d.avg_silicon_pct.toFixed(1)}%</b><br/>
            人数：<b style="color:#94a3b8">${d.member_count} 人</b><br/>
            AI代码量：<b style="color:#94a3b8">${formatLines(d.total_ai_lines)}</b><br/>
            总代码量：<b style="color:#94a3b8">${formatLines(d.total_lines)}</b>
          </div>`;
        },
      },
      grid: { left: 8, right: 60, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#475569', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: depts,
        axisLabel: { color: '#94a3b8', fontSize: 11, width: 100, overflow: 'break' },
        axisLine: { lineStyle: { color: '#1e293b' } },
        splitLine: { show: false },
      },
      series: [{
        type: 'bar',
        barWidth: '55%',
        data: values.map((value) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: mainColor + '60' },
                { offset: 1, color: mainColor },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => `${p.value}%`,
          color: mainColor,
          fontSize: 11,
          fontWeight: 'bold',
        },
      }],
    };
  }, [siliconData, activeLevel]);

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
    const mainColor = LEVEL_COLORS[activeLevel];
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
          const idx = p.dataIndex;
          const d = sorted[idx];
          return `<div style="padding:4px 8px">
            <b>${d.dept_name}</b><br/>
            平均日均Token：<b style="color:${mainColor}">${formatTokens(d.avg_daily_tokens)}</b><br/>
            人数：<b style="color:#94a3b8">${d.member_count} 人</b><br/>
            总Token：<b style="color:#94a3b8">${formatTokens(d.total_tokens)}</b><br/>
            总费用：<b style="color:#94a3b8">¥${d.total_cost.toFixed(2)}</b>
          </div>`;
        },
      },
      grid: { left: 8, right: 70, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        max: maxVal * 1.15,
        axisLabel: {
          color: '#475569',
          fontSize: 10,
          formatter: (v: number) => formatTokens(v),
        },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: depts,
        axisLabel: { color: '#94a3b8', fontSize: 11, width: 100, overflow: 'break' },
        axisLine: { lineStyle: { color: '#1e293b' } },
        splitLine: { show: false },
      },
      series: [{
        type: 'bar',
        barWidth: '55%',
        data: values.map((value) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: mainColor + '60' },
                { offset: 1, color: mainColor },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => formatTokens(p.value),
          color: mainColor,
          fontSize: 11,
          fontWeight: 'bold',
        },
      }],
    };
  }, [tokenData, activeLevel]);

  const hasData = siliconData.length > 0 || tokenData.length > 0;

  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: LEVEL_COLORS[activeLevel], boxShadow: `0 0 8px ${LEVEL_COLORS[activeLevel]}` }}
          />
          <h2 className="text-white font-semibold text-base">
            {LEVEL_LABELS[activeLevel]}排行榜
          </h2>
          <span className="text-slate-500 text-xs">{dateRange.label}</span>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1">
          {(Object.keys(LEVEL_LABELS) as DeptLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeLevel === level
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={
                activeLevel === level
                  ? { backgroundColor: LEVEL_COLORS[level] + '30', border: `1px solid ${LEVEL_COLORS[level]}50` }
                  : {}
              }
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-2">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={fetchData} className="text-cyan-400 text-xs hover:underline cursor-pointer">
            重试
          </button>
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-slate-600 text-sm">该层级暂无部门数据</span>
        </div>
      ) : (
        <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', minHeight: 0 }}>
          {/* PR 硅含量排行 */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-slate-300 text-sm font-medium">PR 硅含量</span>
              <span className="text-slate-600 text-xs">Top {siliconData.length}</span>
            </div>
            <div className="flex-1 min-h-0">
              <ReactECharts option={siliconOption} style={{ height: '100%', minHeight: 200 }} />
            </div>
          </div>

          {/* Token 日均排行 */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300 text-sm font-medium">Token 日均</span>
              <span className="text-slate-600 text-xs">Top {tokenData.length}</span>
            </div>
            <div className="flex-1 min-h-0">
              <ReactECharts option={tokenOption} style={{ height: '100%', minHeight: 200 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
