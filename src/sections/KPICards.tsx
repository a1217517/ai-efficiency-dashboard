import React from 'react';

const kpiData = [
  {
    label: '今日活跃成员',
    value: '10',
    change: '+12%',
    changeType: 'up',
    subLabel: '较昨日',
    color: 'cyan',
  },
  {
    label: '今日 TOKEN 总量',
    value: '1.2M',
    change: '+8%',
    changeType: 'up',
    subLabel: '较昨日',
    color: 'blue',
  },
  {
    label: 'AI 采用率',
    value: '56%',
    change: '+5%',
    changeType: 'up',
    subLabel: '较上周',
    color: 'emerald',
  },
];

export const KPICards: React.FC = () => {
  return (
    <div className="px-4 py-3 grid grid-cols-3 gap-4">
      {kpiData.map((kpi, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-xl p-4 border border-slate-800/60"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,14,26,0.95) 100%)',
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${
                kpi.color === 'cyan' ? '#00d4ff' : kpi.color === 'blue' ? '#3b82f6' : '#10b981'
              } 0%, transparent 70%)`,
            }}
          />
          
          <div className="relative z-10">
            <div className="text-slate-400 text-sm mb-1">{kpi.label}</div>
            <div className="flex items-end gap-3">
              <div
                className="text-3xl font-bold font-mono"
                style={{
                  color: kpi.color === 'cyan' ? '#00d4ff' : kpi.color === 'blue' ? '#60a5fa' : '#34d399',
                  textShadow: `0 0 20px ${
                    kpi.color === 'cyan' ? 'rgba(0,212,255,0.5)' : kpi.color === 'blue' ? 'rgba(59,130,246,0.5)' : 'rgba(16,185,129,0.5)'
                  }`,
                }}
              >
                {kpi.value}
              </div>
              <div className="flex items-center gap-1 pb-1">
                <span className={kpi.changeType === 'up' ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                  {kpi.changeType === 'up' ? '↑' : '↓'} {kpi.change}
                </span>
                <span className="text-slate-600 text-xs">{kpi.subLabel}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};