import React, { useState, useEffect } from 'react';

const announcements = [
  '🎯 本周 AI 开发挑战赛正式开始，Top 3 获奖励！',
  '📢 请在 GitLab MR 标题中添加 [AI] 标签以统计硅含量',
  '⚡ Token 使用量突破 10,000 即视为有效 AI 使用',
  '🚀 AI-Native 效能看板已上线，数据每 60 秒实时刷新',
  '💡 使用 Costrict 进行 AI 辅助开发，让数据说话！',
];

export const TopBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % announcements.length), 5000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800/60" style={{ background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(12px)' }}>
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(0,212,255,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
            AI-Native 效能看板
          </h1>
          <p className="text-slate-500 text-xs">AI Development Observatory</p>
        </div>
      </div>

      {/* Center: Announcements ticker */}
      <div className="flex-1 mx-8 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 bg-cyan-400/10 border border-cyan-400/30 rounded flex-shrink-0">公告</span>
          <div className="overflow-hidden flex-1">
            <div key={msgIdx} className="text-slate-400 text-sm fade-in-up truncate">
              {announcements[msgIdx]}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Time + Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>MOCK DATA</span>
        </div>
        <div className="text-right">
          <div className="text-white font-mono text-lg font-semibold leading-tight" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
            {timeStr}
          </div>
          <div className="text-slate-500 text-xs">{dateStr}</div>
        </div>
      </div>
    </header>
  );
};
