import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface TeamSaving {
  id: string;
  team_name: string;
  minutes: number;
  hours: number;
  sort_order: number;
}

export const DeployMetricsChart: React.FC = () => {
  const [data, setData] = useState<TeamSaving[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/team-savings/all`)
      .then(res => res.json())
      .then(result => {
        if (result.code === 0) {
          setData(result.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const teams = data.map(d => d.team_name);
  const savedMinutes = data.map(d => d.minutes);
  const savedHours = data.map(d => d.hours);

  const option = useMemo(() => {
    if (data.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#475569', fontSize: 14 }
        }
      };
    }
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: '#1e3a5f',
        textStyle: { color: '#e2e8f0', fontSize: 12, fontFamily: 'Fira Sans' },
        formatter: (params: any[]) => {
          const p = params[0];
          const idx = p.dataIndex;
          return `<div style="padding:4px 8px">
            <b>${teams[idx]}</b><br/>
            节省时间：<b style="color:#00f0ff">${savedMinutes[idx]} 分钟</b><br/>
            折合：<b style="color:#ff00ff">${savedHours[idx].toFixed(2)} 小时</b>
          </div>`;
        },
      },
      grid: { left: 8, right: 16, top: 40, bottom: 80, containLabel: true },
      xAxis: {
        type: 'category',
        data: teams,
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 'bold',
          rotate: 45,
          interval: 0,
          overflow: 'break',
          width: 80,
        },
        axisLine: { lineStyle: { color: '#1e293b' } },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '节省时间（分钟）',
        nameTextStyle: { color: '#475569', fontSize: 10 },
        axisLabel: { color: '#475569', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLine: { show: false },
      },
      series: [{
        name: '节省时间',
        type: 'bar',
        barWidth: '50%',
        data: savedMinutes.map((value, idx) => ({
          value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `hsl(${180 + idx * 30}, 100%, 60%)` },
                { offset: 1, color: `hsl(${180 + idx * 30}, 80%, 30%)` },
              ],
            },
            borderRadius: [4, 4, 0, 0],
            shadowColor: `hsl(${180 + idx * 30}, 100%, 50%)`,
            shadowBlur: 12,
          },
        })),
        label: {
          show: true,
          position: 'top',
          formatter: (p: any) => `${savedHours[p.dataIndex].toFixed(2)}h`,
          color: '#e2e8f0',
          fontSize: 11,
          fontWeight: 'bold',
          textShadowColor: 'rgba(0,240,255,0.5)',
          textShadowBlur: 4,
        },
      }],
    };
  }, [data, teams, savedMinutes, savedHours]);

  const totalSaved = data.reduce((sum, d) => sum + d.minutes, 0);
  const totalHours = (totalSaved / 60).toFixed(2);

  return (
    <div className="dashboard-card h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-cyan-400 rounded-full" />
          <h2 className="text-white font-semibold text-base">采用标准化部署后各团队节省时间</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-cyan-300 font-mono text-sm font-semibold">{totalHours}h</span>
            <span className="text-slate-600 text-xs ml-1">总计</span>
          </div>
        </div>
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">加载中...</div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', minHeight: 160 }} />
        )}
      </div>
    </div>
  );
};
