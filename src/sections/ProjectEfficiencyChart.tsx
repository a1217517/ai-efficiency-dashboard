import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { projectEfficiencyData } from '../data/mockData';

export const ProjectEfficiencyChart: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const project = projectEfficiencyData[currentIdx];
  const total = projectEfficiencyData.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIdx(i => (i + 1) % total);
        setIsFading(false);
      }, 400);
    }, 10000);
    return () => clearInterval(timer);
  }, [total]);

  const handleDot = (idx: number) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIdx(idx);
      setIsFading(false);
    }, 300);
  };

  const totalAI = project.phases.reduce((s, p) => s + p.ai, 0);
  const totalTrad = project.phases.reduce((s, p) => s + p.traditional, 0);
  const savings = Math.round(((totalTrad - totalAI) / totalTrad) * 100);

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,14,26,0.95)',
      borderColor: '#1e3a5f',
      textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Fira Sans' },
      formatter: (params: { name: string; seriesName: string; value: number }[]) =>
        `<div style="padding:4px 8px"><b>${params[0]?.name} 阶段</b><br/>` +
        params.map(p => `${p.seriesName}：<b>${p.value} 人天</b>`).join('<br/>') +
        `<br/>提效：${params[1] && params[0] ? Math.round(((params[1].value - params[0].value) / params[1].value) * 100) : 0}%</div>`,
    },
    legend: {
      top: 4,
      right: 8,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: 8, right: 16, top: 32, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: project.phases.map(p => p.phase),
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1e293b' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '人天',
      nameTextStyle: { color: '#475569', fontSize: 10 },
      axisLabel: { color: '#475569', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [
      {
        name: 'AI 协助',
        type: 'bar',
        barGap: '10%',
        barCategoryGap: '35%',
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
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,212,255,0.4)' },
        },
        label: {
          show: true,
          position: 'top',
          color: '#00d4ff',
          fontSize: 10,
          fontFamily: 'Fira Code',
          formatter: '{c}天',
        },
        data: project.phases.map(p => p.ai),
      },
      {
        name: '传统方式',
        type: 'bar',
        itemStyle: {
          color: 'rgba(71,85,105,0.7)',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontSize: 10,
          fontFamily: 'Fira Code',
          formatter: '{c}天',
        },
        data: project.phases.map(p => p.traditional),
      },
    ],
  }), [project]);

  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-green-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">项目提效估算</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Dots nav */}
          <div className="flex gap-1.5">
            {projectEfficiencyData.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDot(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === currentIdx ? 'w-4 h-2 bg-cyan-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <div className="text-right">
            <span className="text-green-400 font-mono text-sm font-semibold">节省 {savings}%</span>
          </div>
        </div>
      </div>

      {/* Project name */}
      <div className={`mb-2 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-semibold text-sm">{project.name}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
          <span className="text-slate-500 text-xs">
            AI: <span className="text-cyan-400 font-mono">{totalAI}</span>天 vs 传统: <span className="text-slate-400 font-mono">{totalTrad}</span>天
          </span>
        </div>
      </div>

      <div className={`flex-1 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <ReactECharts option={option} style={{ height: '100%', minHeight: 160 }} />
      </div>
    </div>
  );
};
