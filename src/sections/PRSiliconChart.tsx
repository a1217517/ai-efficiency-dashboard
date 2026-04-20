import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { prSiliconData } from '../data/mockData';

export const PRSiliconChart: React.FC = () => {
  const total = prSiliconData.aiLines + prSiliconData.nonAiLines;
  const aiPct = ((prSiliconData.aiLines / total) * 100).toFixed(1);

  const option = useMemo(() => ({
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
      bottom: '4%',
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        name: 'PR 硅含量',
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'rgba(10,14,26,0.8)',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
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
            value: prSiliconData.aiLines,
            name: 'AI 协助 (硅含量)',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#00d4ff' },
                  { offset: 1, color: '#0066cc' },
                ],
              },
            },
          },
          {
            value: prSiliconData.nonAiLines,
            name: '人工编写',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#334155' },
                  { offset: 1, color: '#1e293b' },
                ],
              },
            },
          },
        ],
      },
    ],
  }), []);

  return (
    <div className="dashboard-card glow-blue h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">PR 硅含量</h2>
          <span className="text-slate-500 text-xs">近 30 天</span>
        </div>
        <span className="text-slate-600 text-xs">[AI] 标签识别</span>
      </div>
      
      {/* Center stat */}
      <div className="relative flex-1">
        <ReactECharts option={option} style={{ height: '100%', minHeight: 180 }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '10%' }}>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-cyan-300" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>
              {aiPct}%
            </div>
            <div className="text-slate-400 text-xs mt-0.5">硅含量</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-center">
          <div className="text-cyan-400 font-mono text-sm font-semibold">{(prSiliconData.aiLines / 1000).toFixed(1)}K</div>
          <div className="text-slate-500 text-xs">AI 行数</div>
        </div>
        <div className="bg-slate-700/30 border border-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-slate-400 font-mono text-sm font-semibold">{(prSiliconData.nonAiLines / 1000).toFixed(1)}K</div>
          <div className="text-slate-500 text-xs">人工行数</div>
        </div>
      </div>
    </div>
  );
};
