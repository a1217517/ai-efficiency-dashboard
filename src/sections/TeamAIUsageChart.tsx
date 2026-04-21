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
      formatter: (params: { name: string; value: number }[]) => {
        return `<div style="padding:4px 8px"><b>${params[0]?.name}</b><br/>AI 采用率：${params[0]?.value}%</div>`;
      },
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
      data: ['AI 采用率'],
    },
    grid: { left: 60, right: 12, top: 40, bottom: 60, containLabel: false },
    xAxis: {
      type: 'category',
      data: teamAIUsageData.map(d => d.team),
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        rotate: 30,
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#1e293b' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        formatter: '{value}%' 
      },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'AI 采用率',
        type: 'bar',
        barMaxWidth: 24,
        barGap: '30%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#00d4ff' },
              { offset: 1, color: '#0066cc' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: { 
            shadowBlur: 10, 
            shadowColor: 'rgba(0,212,255,0.5)',
          },
        },
        data: teamAIUsageData.map(d => ({
          value: Math.round((d.aiUsers / d.totalUsers) * 100),
          total: d.totalUsers,
        })),
        label: {
          show: true,
          position: 'top',
          color: '#00d4ff',
          fontSize: 10,
          fontFamily: 'Fira Code',
          formatter: (p: { value: number }) => `${p.value}%`,
        },
      },
    ],
  }), []);

  const avgRate = Math.round(
    teamAIUsageData.reduce((s, d) => s + (d.aiUsers / d.totalUsers) * 100, 0) / teamAIUsageData.length
  );
  // 部门平均采用率
  console.log('部门平均AI采用率:', avgRate + '%');

  return (
    <div className="dashboard-card glow-purple h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-cyan-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">团队 AI 占比</h2>
        </div>
        <span className="px-2 py-0.5 text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded">今日</span>
      </div>
      <div className="flex-1">
        <ReactECharts option={option} style={{ height: '100%', minHeight: 200 }} />
      </div>
    </div>
  );
};
