import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { teamAIUsageData } from '../data/mockData';

export const TeamAIUsageChart: React.FC = () => {
  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: '#1e3a5f',
      textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Fira Sans' },
      formatter: (params: { name: string; seriesName: string; value: number; data: { total: number } }[]) => {
        const total = params[0]?.data?.total ?? 0;
        return `<div style="padding:4px 8px"><b>${params[0]?.name}</b><br/>` +
          params.map(p => `${p.seriesName}：${p.value} 人`).join('<br/>') +
          `<br/>共 ${total} 人</div>`;
      },
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: 8, right: 12, top: 32, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#475569', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: teamAIUsageData.map(d => d.team),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '使用 AI',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 20,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#0066cc' },
              { offset: 1, color: '#00d4ff' },
            ],
          },
          borderRadius: [0, 0, 0, 0],
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,212,255,0.4)' },
        },
        data: teamAIUsageData.map(d => ({
          value: Math.round((d.aiUsers / d.totalUsers) * 100),
          total: d.totalUsers,
          raw: d.aiUsers,
        })),
        label: {
          show: true,
          position: 'insideRight',
          color: '#fff',
          fontSize: 10,
          fontFamily: 'Fira Code',
          formatter: (p: { value: number }) => p.value > 15 ? `${p.value}%` : '',
        },
      },
      {
        name: '未使用',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 20,
        itemStyle: {
          color: 'rgba(51,65,85,0.6)',
          borderRadius: [0, 4, 4, 0],
        },
        data: teamAIUsageData.map(d => ({
          value: Math.round(((d.totalUsers - d.aiUsers) / d.totalUsers) * 100),
          total: d.totalUsers,
        })),
        label: {
          show: false,
        },
      },
    ],
  }), []);

  const totalAI = teamAIUsageData.reduce((s, d) => s + d.aiUsers, 0);
  const totalAll = teamAIUsageData.reduce((s, d) => s + d.totalUsers, 0);

  return (
    <div className="dashboard-card glow-purple h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-purple-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">各团队 AI 使用比例</h2>
        </div>
        <div className="text-right">
          <div className="text-purple-300 font-mono text-sm font-semibold">{totalAI}/{totalAll}</div>
          <div className="text-slate-600 text-xs">≥1万Token</div>
        </div>
      </div>
      <div className="flex-1">
        <ReactECharts option={option} style={{ height: '100%', minHeight: 160 }} />
      </div>
    </div>
  );
};
