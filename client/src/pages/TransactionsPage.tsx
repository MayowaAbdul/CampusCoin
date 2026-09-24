import React, { useState, useEffect } from 'react';
import { PlusCircle, Upload, Search, Filter, Trash2, Edit2, Sparkles, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { api } from '../services/api';
import type { Transaction, Category } from '../types';

interface TransactionsPageProps {
  onOpenAddTx: () => void;
  onOpenImportCsv: () => void;
  onEditTx: (tx: Transaction) => void;
  categories: Category[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddTx,
  onOpenImportCsv,
  onEditTx,
  categories
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({
        search,
        type: typeFilter,
        categoryId: categoryFilter,
        startDate,
        endDate
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [search, typeFilter, categoryFilter, startDate, endDate]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction entry?')) {
      try {
        await api.deleteTransaction(id);
        setTransactions((prev) => prev.filter((t) => t.transaction_id !== id));
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Transaction Logs & History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Record allowances, jobs, canteen meals, dorm rent, and academic expenses.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImportCsv}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>CSV Import</span>
          </button>

          <button
            onClick={onOpenAddTx}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search description or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Types (Income & Expense)</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('');
              setCategoryFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Fetching transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm font-semibold">No transaction entries found.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search filters or click "Add Transaction".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                    <td className="p-3.5 pl-5 font-mono text-slate-500 dark:text-slate-400">{tx.date}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category_color || '#6366f1' }}></span>
                        {tx.category_name}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{tx.description || 'N/A'}</span>
                        {tx.is_recurring ? (
                          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded text-[10px] flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            <span>Recurring</span>
                          </span>
                        ) : null}
                        {tx.ai_suggested_category_id ? (
                          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 rounded text-[10px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>AI Categorized</span>
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {tx.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-md font-semibold">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Expense
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sm">
                      <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                        {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount.toString()).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <button
                        onClick={() => onEditTx(tx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Edit entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.transaction_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
