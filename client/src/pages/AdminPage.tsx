import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Tags,
  Megaphone,
  BarChart2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import type { AdminStats, Announcement, Category } from '../types';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'categories' | 'announcements'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // New Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'tip'>('info');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Admin stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Admin users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDefaultCategories();
      setDefaultCategories(data);
    } catch (err) {
      console.error('Admin categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Admin announcements error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'categories') loadDefaultCategories();
    if (activeTab === 'announcements') loadAnnouncements();
  }, [activeTab]);

  const handleToggleUser = async (userId: number) => {
    try {
      const res = await api.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, is_active: res.is_active } : u)));
    } catch (err: any) {
      setError(err.message || 'Failed to toggle user status');
    }
  };

  const handleAdminResetPassword = async (userId: number) => {
    if (confirm('Reset this user\'s password to "password123"?')) {
      try {
        const res = await api.adminResetPassword(userId);
        alert(res.message);
      } catch (err: any) {
        alert(err.message || 'Failed to reset password');
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newCat = await api.createAdminDefaultCategory({
        name: newCatName,
        type: newCatType,
        color: newCatColor
      });
      setDefaultCategories((prev) => [...prev, newCat]);
      setNewCatName('');
      setSuccessMsg('Default category added successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add default category');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (confirm('Delete this default category? Existing transactions using this category will be affected.')) {
      try {
        await api.deleteAdminDefaultCategory(catId);
        setDefaultCategories((prev) => prev.filter((c) => c.category_id !== catId));
      } catch (err: any) {
        alert(err.message || 'Failed to delete default category');
      }
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newAnn = await api.createAnnouncement({ title: annTitle, content: annContent, type: annType });
      setAnnouncements((prev) => [newAnn, ...prev]);
      setAnnTitle('');
      setAnnContent('');
      setSuccessMsg('Announcement published successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (confirm('Delete this system announcement?')) {
      try {
        await api.deleteAnnouncement(id);
        setAnnouncements((prev) => prev.filter((a) => a.announcement_id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete announcement');
      }
    }
  };

  const adminTabs = [
    { id: 'stats', label: 'System Stats', icon: BarChart2 },
    { id: 'users', label: 'Manage Students', icon: Users },
    { id: 'categories', label: 'Default Categories', icon: Tags },
    { id: 'announcements', label: 'Announcements', icon: Megaphone }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Admin Header */}
      <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-700 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 translate-x-16 -translate-y-16" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Administrator Control Panel</h1>
            <p className="text-purple-200 text-xs mt-1">System Usage Statistics · Student Account Management · Default Categories · Announcements</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 shadow-xs border border-purple-200 dark:border-purple-900'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs border border-emerald-200 dark:border-emerald-900">
          {successMsg}
        </div>
      )}

      {/* Tab Content: System Stats */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Student Accounts', value: stats.activeUsers, color: 'indigo', icon: Users },
              { label: 'Total Transactions Logged', value: stats.totalTransactions, color: 'purple', icon: BarChart2 },
              { label: 'Total Income Volume', value: `$${stats.totalIncomeVolume.toFixed(2)}`, color: 'emerald', icon: BarChart2 },
              { label: 'Total Expense Volume', value: `$${stats.totalExpenseVolume.toFixed(2)}`, color: 'rose', icon: BarChart2 }
            ].map((stat, idx) => (
              <div key={idx} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className={`text-2xl font-black mt-1 font-mono text-${stat.color}-600 dark:text-${stat.color}-400`}>
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top System-Wide Categories by Usage</h3>
            <div className="space-y-3">
              {stats.topCategories.map((cat, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <span className="capitalize text-slate-400">({cat.type})</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="font-bold">{cat.tx_count} entries</span>
                    <span className="text-slate-500 block text-[10px]">${cat.total_amount.toFixed(2)} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-xs text-slate-400">Loading student users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Student Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Academic Year</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Transactions</th>
                    <th className="p-3.5 pr-5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 pl-5 font-semibold text-slate-800 dark:text-slate-200">{user.name}</td>
                      <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{user.academic_year}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{user.total_transactions}</td>
                      <td className="p-3.5 pr-5 text-right space-x-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleToggleUser(user.user_id)}
                              className={`p-1.5 rounded-lg transition ${
                                user.is_active
                                  ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                                  : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              }`}
                              title={user.is_active ? 'Disable user' : 'Enable user'}
                            >
                              {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>

                            <button
                              onClick={() => handleAdminResetPassword(user.user_id)}
                              className="p-1.5 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
                              title="Reset password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Default Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Default Category Form */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs h-fit">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Plus className="w-5 h-5 text-purple-500" />
              <span>Add System Default Category</span>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button type="button" onClick={() => setNewCatType('expense')} className={`py-1.5 text-xs font-semibold rounded-lg ${newCatType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600'}`}>Expense</button>
                  <button type="button" onClick={() => setNewCatType('income')} className={`py-1.5 text-xs font-semibold rounded-lg ${newCatType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}>Income</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
                <input type="text" placeholder="e.g. Medical & Health" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border" />
                  <span className="text-xs font-mono text-slate-500">{newCatColor}</span>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow">
                Add System Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-base">System-Wide Default Categories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defaultCategories.map((cat) => (
                  <div key={cat.category_id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize block">{cat.type}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.category_id)} className="p-1 text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Announcements */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs h-fit">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Megaphone className="w-5 h-5 text-purple-500" />
              <span>Publish New Announcement</span>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                <select value={annType} onChange={(e) => setAnnType(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="tip">Saving Tip</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                <input type="text" placeholder="e.g. Mid-Term Budget Review" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Content</label>
                <textarea rows={4} placeholder="Announcement message..." value={annContent} onChange={(e) => setAnnContent(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none" required />
              </div>
              <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow">
                Publish to All Students
              </button>
            </form>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-2 space-y-3">
            {announcements.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                No announcements published yet.
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.announcement_id}
                  className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border shadow-xs flex items-start justify-between gap-4 ${
                    ann.type === 'warning'
                      ? 'border-amber-200 dark:border-amber-900'
                      : ann.type === 'tip'
                      ? 'border-emerald-200 dark:border-emerald-900'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          ann.type === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : ann.type === 'tip'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {ann.type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{ann.content}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{ann.created_at?.split('T')[0]}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(ann.announcement_id)} className="p-1 text-slate-400 hover:text-rose-500 rounded shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
