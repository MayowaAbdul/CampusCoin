import React from 'react';
import { X, Map, LayoutDashboard, Receipt, Tags, PieChart, Target, Sparkles, Shield, UserCheck, HelpCircle } from 'lucide-react';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onNavigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 text-slate-800 dark:text-slate-100 relative animate-fadeIn border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Campus Coin Application Sitemap</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete visual architecture & page flow navigation map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tree Flow Grid */}
        <div className="space-y-8">
          {/* Root Level */}
          <div className="flex flex-col items-center">
            <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg font-bold text-sm flex items-center gap-2">
              <span>Campus Coin (Home / Portal Entry)</span>
            </div>
            <div className="w-0.5 h-6 bg-indigo-300 dark:bg-indigo-600 my-1"></div>
          </div>

          {/* User Roles Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Section */}
            <div className="border border-indigo-100 dark:border-slate-700 rounded-xl p-5 bg-indigo-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400 mb-4 border-b border-indigo-100 dark:border-slate-700 pb-2">
                <UserCheck className="w-5 h-5" />
                <span>Student Portal (Authenticated)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                    <span>Personalized Dashboard</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Balance, top category, saving tips, budget alerts</p>
                </button>

                <button
                  onClick={() => navigateTo('transactions')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <span>Transactions Logging</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Quick-add, recurring, filter, search, CSV import</p>
                </button>

                <button
                  onClick={() => navigateTo('categories')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <Tags className="w-4 h-4 text-amber-500" />
                    <span>Manage Categories</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Defaults & custom income/expense categories</p>
                </button>

                <button
                  onClick={() => navigateTo('reports')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <PieChart className="w-4 h-4 text-blue-500" />
                    <span>Monthly Reports</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">6-month trend, breakdown, forecast, PDF export</p>
                </button>

                <button
                  onClick={() => navigateTo('budgets')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <Target className="w-4 h-4 text-rose-500" />
                    <span>Budget Goals & Alerts</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Category limit caps, real-time consumption bars</p>
                </button>

                <button
                  onClick={() => navigateTo('insights')}
                  className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>AI Insights & Tips</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI spending narrative, MoM flags, saving tips</p>
                </button>
              </div>
            </div>

            {/* Admin Section */}
            <div className="border border-purple-100 dark:border-slate-700 rounded-xl p-5 bg-purple-50/40 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-400 mb-4 border-b border-purple-100 dark:border-slate-700 pb-2">
                <Shield className="w-5 h-5" />
                <span>Admin Control Panel (Direct Access)</span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo('admin')}
                  className="w-full p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-left hover:border-purple-500 transition group"
                >
                  <div className="flex items-center justify-between font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      Administrator Overview
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-md font-mono">
                      admin@campuscoin.edu
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    System usage metrics, user account management (enable/disable/reset), default system categories, system-wide announcements.
                  </p>
                </button>

                <div className="p-3 bg-amber-50 dark:bg-slate-800/80 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                  <div className="font-semibold flex items-center gap-1 mb-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Quick Admin Credentials
                  </div>
                  Email: <code className="bg-amber-100 dark:bg-amber-950 px-1 rounded">admin@campuscoin.edu</code> | Password:{' '}
                  <code className="bg-amber-100 dark:bg-amber-950 px-1 rounded">admin123</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow"
          >
            Close Sitemap
          </button>
        </div>
      </div>
    </div>
  );
};
