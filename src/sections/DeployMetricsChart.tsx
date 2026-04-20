import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { generateDeployMetrics } from '../data/mockData';

const metrics = generateDeployMetrics();
const envColors: Record<string, string> = {
  'AI-Env-Prod-01': '#00d4ff',
  'AI-Env-Prod-02': '#7c3aed',
  'AI-Env-Dev-01': '#f59e0b',
};

export const DeployMetricsChart: React.FC = () => {
  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: '#1e3a5f',
      textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Fira Sans' },
      formatter: (params: { seriesName: string; value: number; color: string }[]) =>
        `<div style="padding:4px 8px"><b>${params[0] ? metrics[params[0] as unknown as number]?.time ?? '' : ''}</b><br/>` +
        params.map(p => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px"></span>${p.seriesName}：<b>${p.value}s</b>`).join('<br/>') +
        '</div>',
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 16,
      itemHeight: 2,
    },
    grid: { left: 8, right: 16, top: 32, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: metrics.map(d => d.time),
      axisLabel: { color: '#475569', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1e293b' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '秒',
      nameTextStyle: { color: '#475569', fontSize: 10 },
      axisLabel: { color: '#475569', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLine: { show: false },
      min: 40,
    },
    series: Object.entries(envColors).map(([envName, color]) => ({
      name: envName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color, width: 2 },
      itemStyle: { color, borderWidth: 2, borderColor: '#0a0e1a' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color.replace(')', ',0.2)').replace('rgb', 'rgba') },
            { offset: 1, color: color.replace(')', ',0)').replace('rgb', 'rgba') },
          ],
        },
      },
      data: metrics.map(d => d[envName as keyof typeof d]),
    })),
  }), []);

  const avgDeploy = Math.round(
    metrics.reduce((s, m) => s + (m['AI-Env-Prod-01'] + m['AI-Env-Prod-02'] + m['AI-Env-Dev-01']) / 3, 0) / metrics.length
  );

  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-amber-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">AI 开发环境部署耗时</h2>
          <span className="text-slate-500 text-xs">近 7 天</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-amber-300 font-mono text-sm font-semibold">{avgDeploy}s</span>
            <span className="text-slate-600 text-xs ml-1">均值</span>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <ReactECharts option={option} style={{ height: '100%', minHeight: 160 }} />
      </div>
    </div>
  );
};
