import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Edit2, ShieldCheck, UserCheck, Check } from 'lucide-react';
import { api } from '../services/api';
import type { Category } from '../types';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState('');

  // Editing state
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    try {
      const created = await api.createCategory({ name, type, color });
      setCategories((prev) => [...prev, created]);
      setName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (id: number) => {
    try {
      const updated = await api.updateCategory(id, { name: editName, color: editColor });
      setCategories((prev) => prev.map((c) => (c.category_id === id ? updated : c)));
      setEditingCatId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Delete this custom category?')) {
      try {
        await api.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.category_id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete category');
      }
    }
  };

  const defaultIncome = categories.filter((c) => c.is_default && c.type === 'income');
  const defaultExpense = categories.filter((c) => c.is_default && c.type === 'expense');
  const customCategories = categories.filter((c) => !c.is_default);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Category Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          System default student categories and personal custom categories under 'Manage Own Categories'.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Custom Category Form */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs h-fit">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Plus className="w-5 h-5 text-indigo-500" />
            <span>Create Custom Category</span>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-rose-50 text-rose-700 dark:bg-rose-950/60 text-xs rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    type === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    type === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g. 'Gym Membership' or 'Tutor Stipend'"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Badge Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-mono text-slate-500">{color}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Add Personal Category
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Category Lists (Default & User Created) */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Custom Categories ('Manage Own Categories') */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Manage Own Categories (Custom)</h3>
            </div>

            {customCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">You haven't created any custom personal categories yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customCategories.map((cat) => (
                  <div
                    key={cat.category_id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    {editingCatId === cat.category_id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-xs w-full"
                        />
                        <button
                          onClick={() => handleUpdateCategory(cat.category_id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                          <div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize block">{cat.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCatId(cat.category_id);
                              setEditName(cat.name);
                              setEditColor(cat.color);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.category_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Default Categories */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">System Default Categories</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Income */}
              <div>
                <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                  Income Categories
                </h4>
                <div className="space-y-2">
                  {defaultIncome.map((cat) => (
                    <div
                      key={cat.category_id}
                      className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Expense */}
              <div>
                <h4 className="font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
                  Expense Categories
                </h4>
                <div className="space-y-2">
                  {defaultExpense.map((cat) => (
                    <div
                      key={cat.category_id}
                      className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
