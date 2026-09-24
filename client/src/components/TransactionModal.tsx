import React, { useState, useEffect } from 'react';
import { X, Sparkles, PlusCircle, Save, Calendar, DollarSign, Tag, RefreshCw } from 'lucide-react';
import type { Category, Transaction } from '../types';
import { api } from '../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  transactionToEdit
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<string>('monthly');

  // AI Suggestion State
  const [aiSuggestedCatId, setAiSuggestedCatId] = useState<number | null>(null);
  const [aiSuggestedCatName, setAiSuggestedCatName] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiReason, setAiReason] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setCategoryId(transactionToEdit.category_id);
      setDate(transactionToEdit.date);
      setIsRecurring(!!transactionToEdit.is_recurring);
      setRecurrencePeriod(transactionToEdit.recurrence_period || 'monthly');
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setRecurrencePeriod('monthly');
      setAiSuggestedCatId(null);
      setAiSuggestedCatName(null);
    }
  }, [transactionToEdit, isOpen]);

  // Real-time AI Category Assistant Predictor as user types
  useEffect(() => {
    if (transactionToEdit) return; // Don't auto-override when editing
    if (!description.trim() || description.trim().length < 3) {
      setAiSuggestedCatId(null);
      setAiSuggestedCatName(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const res = await api.predictCategory(description, type);
        if (res.suggested_category_id) {
          setAiSuggestedCatId(res.suggested_category_id);
          setAiSuggestedCatName(res.suggested_category_name);
          setAiConfidence(res.confidence);
          setAiReason(res.reason);

          // Auto-select category if user hasn't chosen one manually yet
          if (!categoryId) {
            setCategoryId(res.suggested_category_id);
          }
        }
      } catch (err) {
        console.error('AI prediction error:', err);
      } finally {
        setIsAiLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [description, type]);

  const handleApplyAiSuggestion = () => {
    if (aiSuggestedCatId) {
      setCategoryId(aiSuggestedCatId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      setError('Please fill in amount, category, and date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        description,
        category_id: Number(categoryId),
        date,
        is_recurring: isRecurring,
        recurrence_period: isRecurring ? recurrencePeriod : null,
        ai_suggested_category_id: aiSuggestedCatId
      };

      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.transaction_id, payload);
      } else {
        await api.createTransaction(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 dark:text-slate-100 relative animate-fadeIn border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-5">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            {transactionToEdit ? <Save className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-indigo-500" />}
            <span>{transactionToEdit ? 'Edit Transaction' : 'Quick-Add Transaction'}</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income vs Expense Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('');
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          {/* Description with Real-time AI Assistant */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Description / Note (AI Powered)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={type === 'expense' ? "e.g. 'Campus Cafe lunch' or 'Spotify sub'" : "e.g. 'Monthly Allowance' or 'Library job'"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {isAiLoading && (
                <Sparkles className="w-4 h-4 text-purple-500 animate-spin absolute right-3 top-3" />
              )}
            </div>

            {/* AI Category Suggestion Pill */}
            {aiSuggestedCatName && (
              <div className="mt-2 p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>
                    AI Suggestion: <strong className="underline">{aiSuggestedCatName}</strong> ({Math.round(aiConfidence * 100)}% match)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyAiSuggestion}
                  className="px-2 py-1 bg-purple-600 text-white rounded-lg font-semibold text-[11px] hover:bg-purple-700 transition"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount ($)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                required
              >
                <option value="">Select Category</option>
                {availableCategories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name} {cat.is_default ? '' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Option */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mark as Recurring Entry (e.g. Monthly Allowance, Subscription)</span>
            </label>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500">Recurrence Frequency:</span>
                <select
                  value={recurrencePeriod}
                  onChange={(e) => setRecurrencePeriod(e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow disabled:opacity-50"
            >
              {loading ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
