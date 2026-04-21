import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const announcements = [
  '📊 部署平均耗时 2.3min，较上周提升 15%',
  '🏆 恭喜 前端团队 夺得本周 AI 使用冠军！',
  '🎉 万泽宇 今日 Token 使用突破 50,000！',
  '📈 部门整体 AI 采用率达到 78%',
  '🔥 本周 PR 硅含量平均 42%',
  '⚡ 部署平均耗时 2.3min，较上周提升 15%',
];

export const TopBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = `${time.getFullYear()}/${pad(time.getMonth() + 1)}/${pad(time.getDate())}`;

  return (
    <header className="relative z-10">
      {/* Main header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/60" style={{ background: 'rgba(8,14,26,0.95)', backdropFilter: 'blur(12px)' }}>
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
              {isAdmin ? '后台管理系统' : 'AI-NATIVE 效能看板'}
            </h1>
          </div>
        </div>

        {/* Right: Time + Nav */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-mono text-lg font-semibold leading-tight" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>
              {dateStr} {timeStr}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-1 text-xs rounded transition-colors ${isAdmin ? 'text-slate-400 border border-slate-700 hover:bg-slate-800/50' : 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20'}`}
            >
              看板
            </button>
            <button
              onClick={() => navigate('/admin')}
              className={`px-3 py-1 text-xs rounded transition-colors ${isAdmin ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20' : 'text-slate-400 border border-slate-700 hover:bg-slate-800/50'}`}
            >
              后台管理
            </button>
          </div>
        </div>
      </div>

      {/* Ticker/Marquee */}
      <div className="w-full overflow-hidden py-2 border-b border-slate-800/40" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.1) 50%, rgba(0,212,255,0.05) 100%)' }}>
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
          {[...announcements, ...announcements].map((msg, idx) => (
            <span key={idx} className="text-sm text-cyan-300/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {msg}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};
