import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const API_BASE = 'http://47.103.58.81:8082/api/v1';

interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  phone: string;
  role: string;
  status: number;
  created_at: string;
  last_login: string | null;
}

interface TeamSaving {
  id: string;
  team_name: string;
  traditional_minutes: number;
  standard_minutes: number;
  minutes: number;
  hours: number;
  sort_order: number;
  created_at: string;
}

interface TokenUsage {
  id: string;
  rank: number;
  username: string;
  role_category: string;
  total_tokens: number;
  daily_tokens: number;
  request_count: number;
  cost: number;
  import_batch: string;
  date: string;
  created_at: string;
}

interface SiliconContent {
  id: string;
  rank: number;
  username: string;
  role_category: string;
  silicon_percentage: number;
  ai_lines: number;
  total_lines: number;
  date: string;
  created_at: string;
}

interface ImportResult {
  success_count: number;
  fail_count: number;
  errors: string[];
  batch_id: string;
}

const formatTokens = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'team-savings' | 'token-usages' | 'silicon-contents'>('users');
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(!token);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // User states
  const [users, setUsers] = useState<User[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize] = useState(20);
  const [userKeyword, setUserKeyword] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [isUserCreateOpen, setIsUserCreateOpen] = useState(false);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [isUserDeleteOpen, setIsUserDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCreateForm, setUserCreateForm] = useState({ username: '', email: '', password: '', nickname: '', phone: '', role: 'user' });
  const [userEditForm, setUserEditForm] = useState({ nickname: '', phone: '', role: 'user', status: 1 });

  // TeamSaving states
  const [savings, setSavings] = useState<TeamSaving[]>([]);
  const [savingTotal, setSavingTotal] = useState(0);
  const [savingPage, setSavingPage] = useState(1);
  const [savingPageSize] = useState(20);
  const [savingKeyword, setSavingKeyword] = useState('');
  const [savingLoading, setSavingLoading] = useState(false);
  const [isSavingCreateOpen, setIsSavingCreateOpen] = useState(false);
  const [isSavingEditOpen, setIsSavingEditOpen] = useState(false);
  const [isSavingDeleteOpen, setIsSavingDeleteOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<TeamSaving | null>(null);
  const [savingCreateForm, setSavingCreateForm] = useState({ team_name: '', traditional_minutes: 0, standard_minutes: 0, sort_order: 0 });
  const [savingEditForm, setSavingEditForm] = useState({ team_name: '', traditional_minutes: 0, standard_minutes: 0, sort_order: 0 });

  // TokenUsage states
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([]);
  const [tokenUsageTotal, setTokenUsageTotal] = useState(0);
  const [tokenUsagePage, setTokenUsagePage] = useState(1);
  const [tokenUsagePageSize] = useState(20);
  const [tokenUsageKeyword, setTokenUsageKeyword] = useState('');
  const [tokenUsageLoading, setTokenUsageLoading] = useState(false);
  const [tokenUsageBatchID, setTokenUsageBatchID] = useState('');
  const [batches, setBatches] = useState<string[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDate, setImportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImportResultOpen, setIsImportResultOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SiliconContent states
  const [siliconContents, setSiliconContents] = useState<SiliconContent[]>([]);
  const [siliconTotal, setSiliconTotal] = useState(0);
  const [siliconPage, setSiliconPage] = useState(1);
  const [siliconPageSize] = useState(20);
  const [siliconKeyword, setSiliconKeyword] = useState('');
  const [siliconLoading, setSiliconLoading] = useState(false);
  const [isSiliconImportOpen, setIsSiliconImportOpen] = useState(false);
  const [siliconImportFile, setSiliconImportFile] = useState<File | null>(null);
  const [siliconImportDate, setSiliconImportDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [siliconImportLoading, setSiliconImportLoading] = useState(false);
  const [siliconImportResult, setSiliconImportResult] = useState<ImportResult | null>(null);
  const [isSiliconImportResultOpen, setIsSiliconImportResultOpen] = useState(false);
  const siliconFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setUsers([]);
    setSavings([]);
    setTokenUsages([]);
    setSiliconContents([]);
    setIsLoginOpen(true);
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.code === 0) {
        localStorage.setItem('admin_token', data.data.token);
        setToken(data.data.token);
        setIsLoginOpen(false);
      } else {
        alert(data.message || '登录失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  // User CRUD
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setUserLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users?page=${userPage}&page_size=${userPageSize}&keyword=${encodeURIComponent(userKeyword)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setUsers(data.data.list);
        setUserTotal(data.data.total);
      } else if (data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserLoading(false);
    }
  }, [token, userPage, userPageSize, userKeyword]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserCreate = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(userCreateForm),
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsUserCreateOpen(false);
        setUserCreateForm({ username: '', email: '', password: '', nickname: '', phone: '', role: 'user' });
        fetchUsers();
      } else {
        alert(data.message || '创建失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleUserEdit = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(userEditForm),
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsUserEditOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.message || '更新失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsUserDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  // TeamSaving CRUD
  const fetchSavings = useCallback(async () => {
    if (!token) return;
    setSavingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/team-savings?page=${savingPage}&page_size=${savingPageSize}&keyword=${encodeURIComponent(savingKeyword)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setSavings(data.data.list);
        setSavingTotal(data.data.total);
      } else if (data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLoading(false);
    }
  }, [token, savingPage, savingPageSize, savingKeyword]);

  useEffect(() => { if (activeTab === 'team-savings') fetchSavings(); }, [fetchSavings, activeTab]);

  const handleSavingCreate = async () => {
    try {
      const res = await fetch(`${API_BASE}/team-savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(savingCreateForm),
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsSavingCreateOpen(false);
        setSavingCreateForm({ team_name: '', traditional_minutes: 0, standard_minutes: 0, sort_order: 0 });
        fetchSavings();
      } else {
        alert(data.message || '创建失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleSavingEdit = async () => {
    if (!selectedSaving) return;
    try {
      const res = await fetch(`${API_BASE}/team-savings/${selectedSaving.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(savingEditForm),
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsSavingEditOpen(false);
        setSelectedSaving(null);
        fetchSavings();
      } else {
        alert(data.message || '更新失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleSavingDelete = async () => {
    if (!selectedSaving) return;
    try {
      const res = await fetch(`${API_BASE}/team-savings/${selectedSaving.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setIsSavingDeleteOpen(false);
        setSelectedSaving(null);
        fetchSavings();
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  // TokenUsage CRUD
  const fetchBatches = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/token-usages/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setBatches(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchTokenUsages = useCallback(async () => {
    if (!token) return;
    setTokenUsageLoading(true);
    try {
      let url = `${API_BASE}/token-usages?page=${tokenUsagePage}&page_size=${tokenUsagePageSize}&keyword=${encodeURIComponent(tokenUsageKeyword)}`;
      if (tokenUsageBatchID) {
        url += `&batch_id=${encodeURIComponent(tokenUsageBatchID)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setTokenUsages(data.data.list);
        setTokenUsageTotal(data.data.total);
      } else if (data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTokenUsageLoading(false);
    }
  }, [token, tokenUsagePage, tokenUsagePageSize, tokenUsageKeyword, tokenUsageBatchID]);

  useEffect(() => {
    if (activeTab === 'token-usages') {
      fetchTokenUsages();
      fetchBatches();
    }
  }, [fetchTokenUsages, fetchBatches, activeTab]);

  const handleImport = async () => {
    if (!importFile) {
      alert('请选择文件');
      return;
    }
    if (!importDate) {
      alert('请选择数据日期');
      return;
    }
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('date', importDate);
      const res = await fetch(`${API_BASE}/token-usages/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.code === 0) {
        setImportResult(data.data);
        setIsImportOpen(false);
        setImportFile(null);
        setIsImportResultOpen(true);
        fetchTokenUsages();
        fetchBatches();
      } else {
        alert(data.message || '导入失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setImportLoading(false);
    }
  };

  const handleTokenUsageDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      const res = await fetch(`${API_BASE}/token-usages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        fetchTokenUsages();
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const openUserEdit = (user: User) => {
    setSelectedUser(user);
    setUserEditForm({ nickname: user.nickname, phone: user.phone, role: user.role, status: user.status });
    setIsUserEditOpen(true);
  };

  const openUserDelete = (user: User) => {
    setSelectedUser(user);
    setIsUserDeleteOpen(true);
  };

  const openSavingEdit = (s: TeamSaving) => {
    setSelectedSaving(s);
    setSavingEditForm({ team_name: s.team_name, traditional_minutes: s.traditional_minutes, standard_minutes: s.standard_minutes, sort_order: s.sort_order });
    setIsSavingEditOpen(true);
  };

  const openSavingDelete = (s: TeamSaving) => {
    setSelectedSaving(s);
    setIsSavingDeleteOpen(true);
  };

  const userTotalPages = Math.ceil(userTotal / userPageSize);
  const savingTotalPages = Math.ceil(savingTotal / savingPageSize);
  const tokenUsageTotalPages = Math.ceil(tokenUsageTotal / tokenUsagePageSize);
  const siliconTotalPages = Math.ceil(siliconTotal / siliconPageSize);

  // SiliconContent CRUD
  const fetchSiliconContents = useCallback(async () => {
    if (!token) return;
    setSiliconLoading(true);
    try {
      const res = await fetch(`${API_BASE}/silicon-contents?page=${siliconPage}&page_size=${siliconPageSize}&keyword=${encodeURIComponent(siliconKeyword)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        setSiliconContents(data.data.list);
        setSiliconTotal(data.data.total);
      } else if (data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSiliconLoading(false);
    }
  }, [token, siliconPage, siliconPageSize, siliconKeyword]);

  useEffect(() => {
    if (activeTab === 'silicon-contents') fetchSiliconContents();
  }, [fetchSiliconContents, activeTab]);

  const handleSiliconImport = async () => {
    if (!siliconImportFile) {
      alert('请选择文件');
      return;
    }
    if (!siliconImportDate) {
      alert('请选择数据日期');
      return;
    }
    setSiliconImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', siliconImportFile);
      formData.append('date', siliconImportDate);
      const res = await fetch(`${API_BASE}/silicon-contents/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.code === 0) {
        setSiliconImportResult(data.data);
        setIsSiliconImportOpen(false);
        setSiliconImportFile(null);
        setIsSiliconImportResultOpen(true);
        fetchSiliconContents();
      } else {
        alert(data.message || '导入失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSiliconImportLoading(false);
    }
  };

  const handleSiliconDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      const res = await fetch(`${API_BASE}/silicon-contents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.code === 0) {
        fetchSiliconContents();
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1a' }}>
      <div className="scanline" />

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-white">管理员登录</DialogTitle>
            <DialogDescription className="text-slate-400">请输入管理员账号密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">用户名/邮箱</label>
              <Input value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" placeholder="admin" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">密码</label>
              <Input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" placeholder="admin123" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleLogin} className="bg-cyan-600 hover:bg-cyan-500 text-white">登录</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-cyan-400 rounded-full" />
              <h2 className="text-white font-semibold text-xl">
                {activeTab === 'users' ? '用户管理' : activeTab === 'team-savings' ? '部署效率对比' : activeTab === 'token-usages' ? 'Token 使用量数据' : '硅含量数据'}
              </h2>
              <span className="text-slate-500 text-sm">
                共 {activeTab === 'users' ? userTotal : activeTab === 'team-savings' ? savingTotal : activeTab === 'token-usages' ? tokenUsageTotal : siliconTotal} 条
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-[#1a2235] rounded-md border border-slate-700 overflow-hidden">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-1.5 text-sm transition-colors ${activeTab === 'users' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  用户管理
                </button>
                <button
                  onClick={() => setActiveTab('team-savings')}
                  className={`px-4 py-1.5 text-sm transition-colors ${activeTab === 'team-savings' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  部署效率对比
                </button>
                <button
                  onClick={() => setActiveTab('token-usages')}
                  className={`px-4 py-1.5 text-sm transition-colors ${activeTab === 'token-usages' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Token 数据
                </button>
                <button
                  onClick={() => setActiveTab('silicon-contents')}
                  className={`px-4 py-1.5 text-sm transition-colors ${activeTab === 'silicon-contents' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  硅含量
                </button>
              </div>
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 text-white">登出</Button>
            </div>
          </div>

          {/* User Management */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Input
                  placeholder="搜索用户名/邮箱/昵称"
                  value={userKeyword}
                  onChange={e => setUserKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setUserPage(1)}
                  className="w-64 bg-[#1a2235] border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button onClick={() => setUserPage(1)} className="bg-slate-700 hover:bg-slate-600 text-white">搜索</Button>
                <Button onClick={() => setIsUserCreateOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white">+ 新增用户</Button>
              </div>

              <div className="dashboard-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">用户名</TableHead>
                      <TableHead className="text-slate-400">邮箱</TableHead>
                      <TableHead className="text-slate-400">昵称</TableHead>
                      <TableHead className="text-slate-400">角色</TableHead>
                      <TableHead className="text-slate-400">状态</TableHead>
                      <TableHead className="text-slate-400">创建时间</TableHead>
                      <TableHead className="text-slate-400">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">加载中...</TableCell></TableRow>
                    ) : users.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">暂无数据</TableCell></TableRow>
                    ) : (
                      users.map(user => (
                        <TableRow key={user.id} className="border-slate-800/60 hover:bg-[#111827]/50">
                          <TableCell className="text-white font-medium">{user.username}</TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell className="text-slate-300">{user.nickname || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                              user.role === 'viewer' ? 'bg-slate-500/20 text-slate-300' :
                              'bg-cyan-500/20 text-cyan-300'
                            }`}>{user.role}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              user.status === 1 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>{user.status === 1 ? '启用' : '禁用'}</span>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openUserEdit(user)} className="text-cyan-400 hover:text-cyan-300 text-sm">编辑</button>
                              {user.role !== 'admin' && (
                                <button onClick={() => openUserDelete(user)} className="text-red-400 hover:text-red-300 text-sm">删除</button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {userTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
                    <span className="text-slate-500 text-sm">第 {userPage} / {userTotalPages} 页</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage <= 1} className="border-slate-700 text-slate-300 hover:bg-slate-800">上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))} disabled={userPage >= userTotalPages} className="border-slate-700 text-slate-300 hover:bg-slate-800">下一页</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TeamSaving Management */}
          {activeTab === 'team-savings' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Input
                  placeholder="搜索团队名称"
                  value={savingKeyword}
                  onChange={e => setSavingKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setSavingPage(1)}
                  className="w-64 bg-[#1a2235] border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button onClick={() => setSavingPage(1)} className="bg-slate-700 hover:bg-slate-600 text-white">搜索</Button>
                <Button onClick={() => setIsSavingCreateOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white">+ 新增数据</Button>
              </div>

              <div className="dashboard-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">团队名称</TableHead>
                      <TableHead className="text-slate-400">传统部署耗时（分钟）</TableHead>
                      <TableHead className="text-slate-400">标准化部署耗时（分钟）</TableHead>
                      <TableHead className="text-slate-400">节省时间（分钟）</TableHead>
                      <TableHead className="text-slate-400">节省时间（小时）</TableHead>
                      <TableHead className="text-slate-400">排序</TableHead>
                      <TableHead className="text-slate-400">创建时间</TableHead>
                      <TableHead className="text-slate-400">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-slate-500 py-8">加载中...</TableCell></TableRow>
                    ) : savings.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-slate-500 py-8">暂无数据</TableCell></TableRow>
                    ) : (
                      savings.map(s => (
                        <TableRow key={s.id} className="border-slate-800/60 hover:bg-[#111827]/50">
                          <TableCell className="text-white font-medium">{s.team_name}</TableCell>
                          <TableCell className="text-amber-300 font-mono">{s.traditional_minutes}</TableCell>
                          <TableCell className="text-green-300 font-mono">{s.standard_minutes}</TableCell>
                          <TableCell className="text-cyan-300 font-mono">{s.minutes}</TableCell>
                          <TableCell className="text-purple-300 font-mono">{s.hours.toFixed(2)}h</TableCell>
                          <TableCell className="text-slate-300">{s.sort_order}</TableCell>
                          <TableCell className="text-slate-400 text-sm">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openSavingEdit(s)} className="text-cyan-400 hover:text-cyan-300 text-sm">编辑</button>
                              <button onClick={() => openSavingDelete(s)} className="text-red-400 hover:text-red-300 text-sm">删除</button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {savingTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
                    <span className="text-slate-500 text-sm">第 {savingPage} / {savingTotalPages} 页</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSavingPage(p => Math.max(1, p - 1))} disabled={savingPage <= 1} className="border-slate-700 text-slate-300 hover:bg-slate-800">上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setSavingPage(p => Math.min(savingTotalPages, p + 1))} disabled={savingPage >= savingTotalPages} className="border-slate-700 text-slate-300 hover:bg-slate-800">下一页</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TokenUsage Management */}
          {activeTab === 'token-usages' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Input
                  placeholder="搜索用户名"
                  value={tokenUsageKeyword}
                  onChange={e => setTokenUsageKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setTokenUsagePage(1)}
                  className="w-48 bg-[#1a2235] border-slate-700 text-white placeholder:text-slate-500"
                />
                <select
                  value={tokenUsageBatchID}
                  onChange={e => { setTokenUsageBatchID(e.target.value); setTokenUsagePage(1); }}
                  className="h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm"
                >
                  <option value="">所有批次</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
                <Button onClick={() => setTokenUsagePage(1)} className="bg-slate-700 hover:bg-slate-600 text-white">搜索</Button>
                <Button onClick={() => setIsImportOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white">📥 导入 Excel</Button>
              </div>

              <div className="dashboard-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">排名</TableHead>
                      <TableHead className="text-slate-400">用户名</TableHead>
                      <TableHead className="text-slate-400">职类</TableHead>
                      <TableHead className="text-slate-400">Total Tokens</TableHead>
                      <TableHead className="text-slate-400">日均 Tokens</TableHead>
                      <TableHead className="text-slate-400">请求次数</TableHead>
                      <TableHead className="text-slate-400">费用</TableHead>
                      <TableHead className="text-slate-400">数据日期</TableHead>
                      <TableHead className="text-slate-400">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokenUsageLoading ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-slate-500 py-8">加载中...</TableCell></TableRow>
                    ) : tokenUsages.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-slate-500 py-8">暂无数据，请先导入 Excel</TableCell></TableRow>
                    ) : (
                      tokenUsages.map(item => (
                        <TableRow key={item.id} className="border-slate-800/60 hover:bg-[#111827]/50">
                          <TableCell className="text-white font-mono font-medium">{item.rank}</TableCell>
                          <TableCell className="text-white font-medium">{item.username}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.role_category === '开发类' ? 'bg-blue-500/20 text-blue-300' :
                              item.role_category === '测试类' ? 'bg-green-500/20 text-green-300' :
                              item.role_category === '管理类' ? 'bg-purple-500/20 text-purple-300' :
                              item.role_category === '安全类' ? 'bg-red-500/20 text-red-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>{item.role_category}</span>
                          </TableCell>
                          <TableCell className="text-cyan-300 font-mono">{formatTokens(item.total_tokens)}</TableCell>
                          <TableCell className="text-slate-300 font-mono">{formatTokens(item.daily_tokens)}</TableCell>
                          <TableCell className="text-slate-300 font-mono">{item.request_count.toLocaleString()}</TableCell>
                          <TableCell className="text-amber-300 font-mono">¥{item.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <button onClick={() => handleTokenUsageDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm">删除</button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {tokenUsageTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
                    <span className="text-slate-500 text-sm">第 {tokenUsagePage} / {tokenUsageTotalPages} 页</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTokenUsagePage(p => Math.max(1, p - 1))} disabled={tokenUsagePage <= 1} className="border-slate-700 text-slate-300 hover:bg-slate-800">上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setTokenUsagePage(p => Math.min(tokenUsageTotalPages, p + 1))} disabled={tokenUsagePage >= tokenUsageTotalPages} className="border-slate-700 text-slate-300 hover:bg-slate-800">下一页</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* SiliconContent Management */}
          {activeTab === 'silicon-contents' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Input
                  placeholder="搜索用户名"
                  value={siliconKeyword}
                  onChange={e => setSiliconKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setSiliconPage(1)}
                  className="w-48 bg-[#1a2235] border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button onClick={() => setSiliconPage(1)} className="bg-slate-700 hover:bg-slate-600 text-white">搜索</Button>
                <Button onClick={() => setIsSiliconImportOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white">📥 导入 Excel</Button>
              </div>

              <div className="dashboard-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">排名</TableHead>
                      <TableHead className="text-slate-400">用户名</TableHead>
                      <TableHead className="text-slate-400">职类</TableHead>
                      <TableHead className="text-slate-400">硅基含量</TableHead>
                      <TableHead className="text-slate-400">AI 代码量</TableHead>
                      <TableHead className="text-slate-400">总代码量</TableHead>
                      <TableHead className="text-slate-400">数据日期</TableHead>
                      <TableHead className="text-slate-400">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siliconLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">加载中...</TableCell></TableRow>
                    ) : siliconContents.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">暂无数据，请先导入 Excel</TableCell></TableRow>
                    ) : (
                      siliconContents.map(item => (
                        <TableRow key={item.id} className="border-slate-800/60 hover:bg-[#111827]/50">
                          <TableCell className="text-white font-mono font-medium">{item.rank}</TableCell>
                          <TableCell className="text-white font-medium">{item.username}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.role_category === '开发类' ? 'bg-blue-500/20 text-blue-300' :
                              item.role_category === '测试类' ? 'bg-green-500/20 text-green-300' :
                              item.role_category === '管理类' ? 'bg-purple-500/20 text-purple-300' :
                              item.role_category === '安全类' ? 'bg-red-500/20 text-red-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>{item.role_category}</span>
                          </TableCell>
                          <TableCell className="text-cyan-300 font-mono">{item.silicon_percentage.toFixed(2)}%</TableCell>
                          <TableCell className="text-slate-300 font-mono">{item.ai_lines.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-300 font-mono">{item.total_lines.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <button onClick={() => handleSiliconDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm">删除</button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {siliconTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
                    <span className="text-slate-500 text-sm">第 {siliconPage} / {siliconTotalPages} 页</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSiliconPage(p => Math.max(1, p - 1))} disabled={siliconPage <= 1} className="border-slate-700 text-slate-300 hover:bg-slate-800">上一页</Button>
                      <Button variant="outline" size="sm" onClick={() => setSiliconPage(p => Math.min(siliconTotalPages, p + 1))} disabled={siliconPage >= siliconTotalPages} className="border-slate-700 text-slate-300 hover:bg-slate-800">下一页</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Silicon Import Dialog */}
      <Dialog open={isSiliconImportOpen} onOpenChange={setIsSiliconImportOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">导入硅含量数据</DialogTitle>
            <DialogDescription className="text-slate-400">
              上传 Excel 文件（.xlsx），要求包含列：排名、用户名、职类、硅基含量、硅基代码量、总代码量
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">数据日期 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={siliconImportDate}
                onChange={e => setSiliconImportDate(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm"
              />
              <p className="text-slate-600 text-xs mt-1">此 Excel 文件代表的是哪一天的硅含量数据</p>
            </div>
            <div
              className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
              onClick={() => siliconFileInputRef.current?.click()}
            >
              <input
                ref={siliconFileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={e => setSiliconImportFile(e.target.files?.[0] || null)}
              />
              {siliconImportFile ? (
                <div className="space-y-1">
                  <div className="text-cyan-400 font-medium">{siliconImportFile.name}</div>
                  <div className="text-slate-500 text-sm">{(siliconImportFile.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-slate-400">点击选择或拖拽 Excel 文件</div>
                  <div className="text-slate-600 text-sm">支持 .xlsx 格式</div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsSiliconImportOpen(false); setSiliconImportFile(null); }} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleSiliconImport} disabled={!siliconImportFile || siliconImportLoading} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              {siliconImportLoading ? '导入中...' : '导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silicon Import Result Dialog */}
      <Dialog open={isSiliconImportResultOpen} onOpenChange={setIsSiliconImportResultOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">导入结果</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-green-400 text-2xl font-bold">{siliconImportResult?.success_count || 0}</div>
                <div className="text-slate-500 text-sm">成功</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-2xl font-bold">{siliconImportResult?.fail_count || 0}</div>
                <div className="text-slate-500 text-sm">失败</div>
              </div>
            </div>
            {siliconImportResult && siliconImportResult.errors && siliconImportResult.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="text-red-400 text-sm font-medium mb-2">错误详情：</div>
                {siliconImportResult.errors.map((err, i) => (
                  <div key={i} className="text-red-300 text-xs">{err}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSiliconImportResultOpen(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">导入 Token 使用量数据</DialogTitle>
            <DialogDescription className="text-slate-400">
              上传 Excel 文件（.xlsx），要求包含列：排名、用户名、职类、Total Tokens、日均 Tokens、请求次数、费用
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">数据日期 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={importDate}
                onChange={e => setImportDate(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm"
              />
              <p className="text-slate-600 text-xs mt-1">此 Excel 文件代表的是哪一天的 Token 使用量数据</p>
            </div>
            <div
              className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
              />
              {importFile ? (
                <div className="space-y-1">
                  <div className="text-cyan-400 font-medium">{importFile.name}</div>
                  <div className="text-slate-500 text-sm">{(importFile.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-slate-400">点击选择或拖拽 Excel 文件</div>
                  <div className="text-slate-600 text-sm">支持 .xlsx 格式</div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleImport} disabled={!importFile || importLoading} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              {importLoading ? '导入中...' : '导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={isImportResultOpen} onOpenChange={setIsImportResultOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">导入结果</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-green-400 text-2xl font-bold">{importResult?.success_count || 0}</div>
                <div className="text-slate-500 text-sm">成功</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-2xl font-bold">{importResult?.fail_count || 0}</div>
                <div className="text-slate-500 text-sm">失败</div>
              </div>
              <div className="text-center">
                <div className="text-cyan-400 text-2xl font-bold">{importResult?.batch_id || '-'}</div>
                <div className="text-slate-500 text-sm">批次</div>
              </div>
            </div>
            {importResult && importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="text-red-400 text-sm font-medium mb-2">错误详情：</div>
                {importResult.errors.map((err, i) => (
                  <div key={i} className="text-red-300 text-xs">{err}</div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsImportResultOpen(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white">确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Create Dialog */}
      <Dialog open={isUserCreateOpen} onOpenChange={setIsUserCreateOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">新增用户</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {['username', 'email', 'password', 'nickname', 'phone'].map(field => (
              <div key={field}>
                <label className="text-sm text-slate-400 mb-1 block">
                  {field === 'username' ? '用户名' : field === 'email' ? '邮箱' : field === 'password' ? '密码' : field === 'nickname' ? '昵称' : '手机号'}
                  {field !== 'nickname' && field !== 'phone' && <span className="text-red-400">*</span>}
                </label>
                <Input type={field === 'password' ? 'password' : 'text'} value={(userCreateForm as any)[field]} onChange={e => setUserCreateForm({ ...userCreateForm, [field]: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" />
              </div>
            ))}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">角色</label>
              <select value={userCreateForm.role} onChange={e => setUserCreateForm({ ...userCreateForm, role: e.target.value })} className="w-full h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm">
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="viewer">viewer</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserCreateOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleUserCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isUserEditOpen} onOpenChange={setIsUserEditOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">编辑用户 - {selectedUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm text-slate-400 mb-1 block">昵称</label><Input value={userEditForm.nickname} onChange={e => setUserEditForm({ ...userEditForm, nickname: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
            <div><label className="text-sm text-slate-400 mb-1 block">手机号</label><Input value={userEditForm.phone} onChange={e => setUserEditForm({ ...userEditForm, phone: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">角色</label>
              <select value={userEditForm.role} onChange={e => setUserEditForm({ ...userEditForm, role: e.target.value })} className="w-full h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm">
                <option value="user">user</option><option value="admin">admin</option><option value="viewer">viewer</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">状态</label>
              <select value={userEditForm.status} onChange={e => setUserEditForm({ ...userEditForm, status: Number(e.target.value) })} className="w-full h-9 rounded-md border border-slate-700 bg-[#1a2235] text-white px-3 text-sm">
                <option value={1}>启用</option><option value={0}>禁用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserEditOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleUserEdit} className="bg-cyan-600 hover:bg-cyan-500 text-white">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Delete Dialog */}
      <Dialog open={isUserDeleteOpen} onOpenChange={setIsUserDeleteOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">确认删除</DialogTitle>
            <DialogDescription className="text-slate-400">确定要删除用户 <span className="text-red-400 font-medium">{selectedUser?.username}</span> 吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDeleteOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleUserDelete} className="bg-red-600 hover:bg-red-500 text-white">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TeamSaving Create Dialog */}
      <Dialog open={isSavingCreateOpen} onOpenChange={setIsSavingCreateOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">新增部署效率数据</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">团队名称 <span className="text-red-400">*</span></label>
              <Input value={savingCreateForm.team_name} onChange={e => setSavingCreateForm({ ...savingCreateForm, team_name: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">传统部署AI开发环境耗时（分钟） <span className="text-red-400">*</span></label>
              <Input type="number" step="0.1" value={savingCreateForm.traditional_minutes || ''} onChange={e => setSavingCreateForm({ ...savingCreateForm, traditional_minutes: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">标准化AI开发环境耗时（分钟） <span className="text-red-400">*</span></label>
              <Input type="number" step="0.1" value={savingCreateForm.standard_minutes || ''} onChange={e => setSavingCreateForm({ ...savingCreateForm, standard_minutes: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">排序 <span className="text-slate-500">（数字越小越靠前）</span></label>
              <Input type="number" value={savingCreateForm.sort_order} onChange={e => setSavingCreateForm({ ...savingCreateForm, sort_order: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingCreateOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleSavingCreate} className="bg-cyan-600 hover:bg-cyan-500 text-white">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TeamSaving Edit Dialog */}
      <Dialog open={isSavingEditOpen} onOpenChange={setIsSavingEditOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">编辑部署效率 - {selectedSaving?.team_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm text-slate-400 mb-1 block">团队名称</label><Input value={savingEditForm.team_name} onChange={e => setSavingEditForm({ ...savingEditForm, team_name: e.target.value })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
            <div><label className="text-sm text-slate-400 mb-1 block">传统部署AI开发环境耗时（分钟）</label><Input type="number" step="0.1" value={savingEditForm.traditional_minutes || ''} onChange={e => setSavingEditForm({ ...savingEditForm, traditional_minutes: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
            <div><label className="text-sm text-slate-400 mb-1 block">标准化AI开发环境耗时（分钟）</label><Input type="number" step="0.1" value={savingEditForm.standard_minutes || ''} onChange={e => setSavingEditForm({ ...savingEditForm, standard_minutes: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
            <div><label className="text-sm text-slate-400 mb-1 block">排序</label><Input type="number" value={savingEditForm.sort_order} onChange={e => setSavingEditForm({ ...savingEditForm, sort_order: Number(e.target.value) })} className="bg-[#1a2235] border-slate-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingEditOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleSavingEdit} className="bg-cyan-600 hover:bg-cyan-500 text-white">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TeamSaving Delete Dialog */}
      <Dialog open={isSavingDeleteOpen} onOpenChange={setIsSavingDeleteOpen}>
        <DialogContent className="bg-[#0f1629] border border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">确认删除</DialogTitle>
            <DialogDescription className="text-slate-400">确定要删除 <span className="text-red-400 font-medium">{selectedSaving?.team_name}</span> 的数据吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingDeleteOpen(false)} className="border-slate-700 text-slate-300">取消</Button>
            <Button onClick={handleSavingDelete} className="bg-red-600 hover:bg-red-500 text-white">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
