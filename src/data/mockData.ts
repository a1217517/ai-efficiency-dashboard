// Mock data for the AI-Native dashboard

export interface Member {
  id: string;
  name: string;
  avatar: string;
  team: string;
  tokens: number;
  change: 'up' | 'down' | 'same';
  prevRank: number;
}

export interface TeamUsage {
  team: string;
  aiUsers: number;
  totalUsers: number;
}

export interface DeployMetric {
  time: string;
  'AI-Env-Prod-01': number;
  'AI-Env-Prod-02': number;
  'AI-Env-Dev-01': number;
}

export interface ProjectEfficiency {
  name: string;
  phases: {
    phase: string;
    ai: number;
    traditional: number;
  }[];
}

// Generate avatar URL
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=0d1117`;

// Token ranking mock data
export const generateTokenRanking = (): Member[] => [
  { id: '1', name: '张伟', avatar: avatarUrl('zhangwei'), team: '基础架构组', tokens: 284756, change: 'same', prevRank: 1 },
  { id: '2', name: '李娜', avatar: avatarUrl('lina'), team: '前端工程组', tokens: 251340, change: 'up', prevRank: 3 },
  { id: '3', name: '王强', avatar: avatarUrl('wangqiang'), team: '后端工程组', tokens: 218920, change: 'down', prevRank: 2 },
  { id: '4', name: '赵雪', avatar: avatarUrl('zhaoxue'), team: 'AI 应用组', tokens: 198450, change: 'up', prevRank: 6 },
  { id: '5', name: '陈明', avatar: avatarUrl('chenming'), team: '基础架构组', tokens: 187230, change: 'down', prevRank: 4 },
  { id: '6', name: '刘洋', avatar: avatarUrl('liuyang'), team: '测试工程组', tokens: 165890, change: 'up', prevRank: 8 },
  { id: '7', name: '杨帆', avatar: avatarUrl('yangfan'), team: '前端工程组', tokens: 154320, change: 'down', prevRank: 5 },
  { id: '8', name: '黄琳', avatar: avatarUrl('huanglin'), team: 'AI 应用组', tokens: 143670, change: 'same', prevRank: 8 },
  { id: '9', name: '吴昊', avatar: avatarUrl('wuhao'), team: '后端工程组', tokens: 132890, change: 'up', prevRank: 11 },
  { id: '10', name: '徐静', avatar: avatarUrl('xujing'), team: '基础架构组', tokens: 121450, change: 'up', prevRank: 12 },
  { id: '11', name: '孙磊', avatar: avatarUrl('sunlei'), team: '测试工程组', tokens: 112340, change: 'down', prevRank: 9 },
  { id: '12', name: '周鑫', avatar: avatarUrl('zhouxin'), team: '前端工程组', tokens: 98760, change: 'down', prevRank: 10 },
  { id: '13', name: '马超', avatar: avatarUrl('machao'), team: 'AI 应用组', tokens: 87540, change: 'up', prevRank: 15 },
  { id: '14', name: '朱婷', avatar: avatarUrl('zhuting'), team: '后端工程组', tokens: 76230, change: 'same', prevRank: 14 },
  { id: '15', name: '郑宇', avatar: avatarUrl('zhengyu'), team: '基础架构组', tokens: 65890, change: 'down', prevRank: 13 },
];

// PR silicon content
export const prSiliconData = {
  aiLines: 128540,
  nonAiLines: 87320,
};

// Team AI usage
export const teamAIUsageData: TeamUsage[] = [
  { team: '基础架构组', aiUsers: 18, totalUsers: 22 },
  { team: 'AI 应用组', aiUsers: 15, totalUsers: 16 },
  { team: '前端工程组', aiUsers: 20, totalUsers: 28 },
  { team: '后端工程组', aiUsers: 16, totalUsers: 25 },
  { team: '测试工程组', aiUsers: 8, totalUsers: 18 },
];

// Deploy metrics
export const generateDeployMetrics = (): DeployMetric[] => {
  const times = ['03-24', '03-25', '03-26', '03-27', '03-28', '03-29', '03-30'];
  return times.map(time => ({
    time,
    'AI-Env-Prod-01': Math.floor(90 + Math.random() * 60),
    'AI-Env-Prod-02': Math.floor(80 + Math.random() * 50),
    'AI-Env-Dev-01': Math.floor(60 + Math.random() * 40),
  }));
};

// Project efficiency
export const projectEfficiencyData: ProjectEfficiency[] = [
  {
    name: 'AI 代码审查平台',
    phases: [
      { phase: '需求', ai: 1.5, traditional: 3 },
      { phase: '设计', ai: 2, traditional: 4 },
      { phase: '编码', ai: 5, traditional: 15 },
      { phase: '测试', ai: 2, traditional: 6 },
      { phase: '端到端', ai: 10.5, traditional: 28 },
    ],
  },
  {
    name: '智能运维巡检系统',
    phases: [
      { phase: '需求', ai: 1, traditional: 2.5 },
      { phase: '设计', ai: 1.5, traditional: 3.5 },
      { phase: '编码', ai: 6, traditional: 18 },
      { phase: '测试', ai: 2.5, traditional: 7 },
      { phase: '端到端', ai: 11, traditional: 31 },
    ],
  },
  {
    name: 'LLM 对话机器人',
    phases: [
      { phase: '需求', ai: 0.5, traditional: 2 },
      { phase: '设计', ai: 1, traditional: 3 },
      { phase: '编码', ai: 4, traditional: 12 },
      { phase: '测试', ai: 1.5, traditional: 5 },
      { phase: '端到端', ai: 7, traditional: 22 },
    ],
  },
  {
    name: 'AI-Native 效能看板',
    phases: [
      { phase: '需求', ai: 0.5, traditional: 1.5 },
      { phase: '设计', ai: 0.5, traditional: 2 },
      { phase: '编码', ai: 3, traditional: 10 },
      { phase: '测试', ai: 1, traditional: 4 },
      { phase: '端到端', ai: 5, traditional: 17.5 },
    ],
  },
];

export const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};
