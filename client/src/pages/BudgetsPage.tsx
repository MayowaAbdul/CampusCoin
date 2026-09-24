import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Trash2, Bell, Calendar } from 'lucide-react';
import { api } from '../services/api';
import type { Budget, Category } from '../types';

interface BudgetsPageProps {
  categories: Category[];
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ categories }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // New Budget Form State
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets(selectedMonth);
      setBudgets(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limitAmount) {
      setError('Please select a category and budget limit');
      return;
    }

    setError('');
    try {
      await api.saveBudget({
        category_id: Number(categoryId),
        limit_amount: parseFloat(limitAmount),
        month: selectedMonth
      });
      setSuccessMsg('Budget goal updated successfully!');
      setLimitAmount('');
      setCategoryId('');
      loadBudgets();
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to set budget limit');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (confirm('Delete this budget limit?')) {
      try {
        await api.deleteBudget(id);
        setBudgets((prev) => prev.filter((b) => b.budget_id !== id));
      } catch (err) {
        console.error('Failed to delete budget:', err);
      }
    }
  };

  // Filter out expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate notifications
  const alerts = budgets.filter((b) => b.alert_status === 'warning' || b.alert_status === 'exceeded');

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Budget Goals & Real-Time Alerts</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Set monthly category spending caps and track real-time consumption progress bars.
          </p>
        </div>

        {/* Month Picker */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* In-App Notifications Banner if any budget exceeded/warning */}
      {alerts.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
            <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>In-App Budget Consumption Alerts ({alerts.length} categories)</span>
          </div>
          <div className="space-y-1 pl-6">
            {alerts.map((b) => (
              <p key={b.budget_id} className="text-xs text-amber-700 dark:text-amber-300">
                • <strong>{b.category_name}</strong> is currently at{' '}
                <strong className={b.alert_status === 'exceeded' ? 'text-rose-600' : 'text-amber-600'}>
                  {b.percentage}%
                </strong>{' '}
                of limit (${(b.spent_amount ?? 0).toFixed(2)} / ${(b.limit_amount ?? 0).toFixed(2)})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Set Budget Limit Form */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs h-fit">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Target className="w-5 h-5 text-indigo-500" />
            <span>Set Category Budget Cap</span>
          </div>

          {error && <div className="mb-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>}
          {successMsg && (
            <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Expense Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                required
              >
                <option value="">Select Expense Category</option>
                {expenseCategories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Spending Cap ($)</label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 180"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                required
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow">
              Save Budget Limit
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Budget Consumption Real-Time Bars */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading budget consumption...</div>
          ) : budgets.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
              No budget limits set for {selectedMonth}. Use the form on the left to set spending caps for food, transport, hostel rent, etc.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const percentage = Number(b.percentage ?? 0);

                return (
                  <div key={b.budget_id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color || '#6366f1' }}></span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.category_name}</h4>
                      </div>
                      <button onClick={() => handleDeleteBudget(b.budget_id)} className="p-1 text-slate-400 hover:text-rose-500 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">Spent: <strong className="font-mono text-slate-900 dark:text-white">${(b.spent_amount ?? 0).toFixed(2)}</strong></span>
                      <span className="text-slate-500">Limit: <strong className="font-mono text-slate-900 dark:text-white">${(b.limit_amount ?? 0).toFixed(2)}</strong></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{percentage}% Used</span>
                        <span className={b.remaining_amount === 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          ${b.remaining_amount?.toFixed(2)} Remaining
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
