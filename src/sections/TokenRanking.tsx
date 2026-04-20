import React, { useState, useEffect, useRef } from 'react';
import { generateTokenRanking, formatTokens, type Member } from '../data/mockData';

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
const medalBgs = [
  'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40',
  'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40',
  'bg-gradient-to-r from-orange-700/20 to-orange-800/10 border-orange-700/40',
];

const RankChange = ({ change, prevRank, rank }: { change: Member['change']; prevRank: number; rank: number }) => {
  const diff = prevRank - rank;
  if (change === 'up') return <span className="text-green-400 text-xs font-mono flex items-center gap-0.5">▲{diff}</span>;
  if (change === 'down') return <span className="text-red-400 text-xs font-mono flex items-center gap-0.5">▼{Math.abs(diff)}</span>;
  return <span className="text-slate-500 text-xs">—</span>;
};

export const TokenRanking: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(generateTokenRanking());
  const maxTokens = members[0]?.tokens ?? 1;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMembers(prev => {
        const updated = prev.map(m => ({
          ...m,
          tokens: m.tokens + Math.floor(Math.random() * 800),
        }));
        updated.sort((a, b) => b.tokens - a.tokens);
        return updated;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-card glow-cyan h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 8px #00d4ff' }} />
          <h2 className="text-white font-semibold text-base">Token 实时排行榜</h2>
          <span className="text-slate-500 text-xs">今日累计</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">LIVE</span>
          <span className="text-slate-600 text-xs ml-2">60s 刷新</span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {members.map((member, idx) => {
          const rank = idx + 1;
          const pct = (member.tokens / maxTokens) * 100;
          const isTop3 = rank <= 3;

          return (
            <div
              key={member.id}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 cursor-pointer hover:border-cyan-500/50
                ${isTop3 ? medalBgs[rank - 1] : 'bg-slate-900/50 border-slate-800/60 hover:bg-slate-800/50'}`}
            >
              {/* Rank */}
              <div className="w-7 text-center flex-shrink-0">
                {isTop3 ? (
                  <span className="text-lg" style={{ color: medalColors[rank - 1], textShadow: `0 0 10px ${medalColors[rank - 1]}` }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono text-sm font-medium">{String(rank).padStart(2, '0')}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border ${isTop3 ? 'border-yellow-500/50' : 'border-slate-700'}`}>
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                  {member.name[0]}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium">{member.name}</span>
                  <span className="text-slate-500 text-xs truncate">{member.team}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isTop3 ? 'progress-shimmer' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Tokens */}
              <div className="flex flex-col items-end flex-shrink-0">
                <span
                  className={`font-mono text-sm font-semibold key count-up ${isTop3 ? 'text-cyan-300' : 'text-slate-300'}`}
                  style={isTop3 ? { textShadow: '0 0 8px rgba(0,212,255,0.6)' } : {}}
                >
                  {formatTokens(member.tokens)}
                </span>
                <RankChange change={member.change} prevRank={member.prevRank} rank={rank} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-600">
        <span>共 {members.length} 人参与</span>
        <span className="font-mono">今日总计：{formatTokens(members.reduce((s, m) => s + m.tokens, 0))}</span>
      </div>
    </div>
  );
};
