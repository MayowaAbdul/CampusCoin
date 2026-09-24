import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  PlusCircle,
  Sparkles,
  PieChart,
  Award,
  Pin,
  Bookmark,
  XCircle,
  Activity,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { SavedTip, ActivityLog } from '../types';

interface DashboardProps {
  onOpenAddTx: () => void;
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenAddTx, setCurrentTab }) => {
  const { user, updateProfile } = useAuth();

  const [summary, setSummary] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [tips, setTips] = useState<SavedTip[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editYear, setEditYear] = useState(user?.academic_year || 'Freshman');
  const [editAllowance, setEditAllowance] = useState(user?.monthly_allowance_baseline?.toString() || '600');
  const [editGoal, setEditGoal] = useState(user?.monthly_savings_goal?.toString() || '100');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, budRes, tipsRes, logsRes, fcRes] = await Promise.all([
        api.getMonthlySummaryReport(),
        api.getBudgets(),
        api.getSavingTips(),
        api.getActivityLogs(),
        api.getForecastReport()
      ]);

      setSummary(sumRes);
      setBudgets(budRes);
      setTips(tipsRes);
      setRecentLogs(logsRes);
      setForecast(fcRes);

      // Trigger celebratory confetti if savings goal met!
      if (sumRes.netBalance >= (user?.monthly_savings_goal || 100) && sumRes.netBalance > 0) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTipStatus = async (tipId: number, newStatus: string) => {
    try {
      await api.updateTipStatus(tipId, newStatus);
      setTips((prev) =>
        prev
          .map((t) => (t.tip_id === tipId ? { ...t, status: newStatus as any } : t))
          .filter((t) => t.status !== 'dismissed')
      );
    } catch (err) {
      console.error('Failed to update tip status:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: editName,
        academic_year: editYear,
        monthly_allowance_baseline: parseFloat(editAllowance),
        monthly_savings_goal: parseFloat(editGoal)
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  const netBalance = summary?.netBalance || 0;
  const savingsGoal = user?.monthly_savings_goal || 100;
  const savingsProgress = Math.min(100, Math.max(0, Math.round((netBalance / savingsGoal) * 100)));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Personalized Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
          <Wallet className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                {user?.academic_year || 'Student'}
              </span>
              <span className="text-xs text-indigo-100 font-mono">ID: #{user?.user_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl">
              Track your monthly allowance, dorm expenses, canteen food, and reach your savings goal with AI insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition backdrop-blur-md"
            >
              Edit Profile
            </button>
            <button
              onClick={onOpenAddTx}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Quick-Add Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Student Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Academic Year</label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Allowance ($)</label>
                  <input
                    type="number"
                    value={editAllowance}
                    onChange={(e) => setEditAllowance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Savings Goal ($)</label>
                  <input
                    type="number"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Month Income</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              ${(summary?.totalIncome || 0).toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Allowance & Part-time Job</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expense */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Month Expenses</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              ${(summary?.totalExpense || 0).toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Food, Hostel, Academics</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Month Balance</p>
            <h3 className={`text-2xl font-black mt-1 font-mono ${netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              ${netBalance.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Available Cash Reserve</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Savings Goal Progress */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Savings Goal Progress</p>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">${netBalance > 0 ? netBalance.toFixed(0) : '0'} / ${savingsGoal}</h3>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{savingsProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${savingsProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Dynamic Widgets & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Top Category & Budget Consumption */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Category & Spending Breakdown Widget */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">This Month's Top Category & Breakdown</h3>
              </div>
              <button
                onClick={() => setCurrentTab('reports')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full Reports</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {summary?.topCategory ? (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 tracking-wider">
                    Highest Monthly Expense
                  </span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summary.topCategory.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Accounts for <strong className="text-amber-600">{summary.topCategory.percentage}%</strong> of total monthly spending
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    ${summary.topCategory.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Category Progress Bars */}
            <div className="space-y-3">
              {(summary?.breakdown || []).slice(0, 4).map((cat: any) => (
                <div key={cat.category_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      {cat.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      ${cat.total.toFixed(2)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget vs Actual Consumption Progress */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Budget vs. Actual Consumption</h3>
              </div>
              <button
                onClick={() => setCurrentTab('budgets')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage Limits
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No monthly budget limits set yet. Click Manage Limits to set category caps.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {budgets.map((b) => (
                  <div key={b.budget_id} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{b.category_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          b.alert_status === 'exceeded'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : b.alert_status === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {b.alert_status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-mono mb-2">
                      <span>Spent: ${b.spent_amount.toFixed(2)}</span>
                      <span>Cap: ${b.limit_amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          b.percentage >= 100 ? 'bg-rose-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personalized Saving Tips Engine & System Intelligence */}
        <div className="space-y-6">
          {/* Saving Tips Engine (Ranked by Impact) */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Personalized Saving Tips Engine</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Ranked by Impact</span>
            </div>

            <div className="space-y-3">
              {tips.slice(0, 3).map((tip) => (
                <div
                  key={tip.tip_id}
                  className={`p-3.5 rounded-xl border transition ${
                    tip.status === 'pinned'
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">{tip.title}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTipStatus(tip.tip_id, tip.status === 'pinned' ? 'active' : 'pinned')}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          tip.status === 'pinned' ? 'text-amber-500' : 'text-slate-400'
                        }`}
                        title="Pin tip to top"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTipStatus(tip.tip_id, 'dismissed')}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Dismiss tip"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{tip.content}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5 text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Est. Savings: +${tip.potential_savings.toFixed(2)}/mo
                    </span>
                    <span className="text-slate-400 font-medium">{tip.category_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Intelligence Activity & Forecast Tracer */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">System Intelligence Tracer</h3>
            </div>

            {/* Upcoming Month Forecast Alert */}
            {forecast && (
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Next Month Spending Forecast</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{forecast.advice}</p>
              </div>
            )}

            {/* Recent Activity Log */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Recently Logged & Edited Activity</p>
              <div className="space-y-2">
                {recentLogs.slice(0, 4).map((log) => (
                  <div key={log.log_id} className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.description || 'Transaction'}</span>
                      <span className="text-slate-400 text-[10px] ml-2">({log.action_type})</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${log.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
