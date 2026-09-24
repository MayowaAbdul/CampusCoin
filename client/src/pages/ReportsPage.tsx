import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  Download,
  Share2,
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ShareModal } from '../components/ShareModal';

export const ReportsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [sixMonthTrend, setSixMonthTrend] = useState<any[]>([]);
  const [dailyWeekly, setDailyWeekly] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Share/PDF Export Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, dwRes, fcRes, anomRes] = await Promise.all([
        api.getMonthlySummaryReport(selectedMonth),
        api.getSixMonthTrendReport(),
        api.getDailyWeeklyReport(selectedMonth),
        api.getForecastReport(),
        api.getAnomaliesReport()
      ]);

      setMonthlySummary(sumRes);
      setSixMonthTrend(trendRes);
      setDailyWeekly(dwRes);
      setForecast(fcRes);
      setAnomalies(anomRes);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Generating monthly financial analytics...</p>
        </div>
      </div>
    );
  }

  const breakdownData = (monthlySummary?.breakdown || []).map((b: any) => ({
    name: b.name,
    value: b.total,
    color: b.color
  }));

  return (
    <div className="space-y-6 animate-fadeIn pb-12" id="report-content-area">
      {/* Header & Date / Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Monthly Spending & Financial Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Category breakdowns, 6-month trends, daily/weekly breakdowns, and AI predictive insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export / Share PDF</span>
          </button>
        </div>
      </div>

      {/* Share / PDF Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Campus Coin ${selectedMonth} Financial Report`}
        targetElementId="report-content-area"
        summaryText={`Total Income: $${monthlySummary?.totalIncome?.toFixed(2)}, Total Expense: $${monthlySummary?.totalExpense?.toFixed(
          2
        )}, Net Balance: $${monthlySummary?.netBalance?.toFixed(2)}.`}
      />

      {/* 6-Month Income vs Expense Trend Chart */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">6-Month Income vs. Expense Trend</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 6 Months History</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sixMonthTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" stroke="#8884d8" style={{ fontSize: '11px' }} />
              <YAxis stroke="#8884d8" style={{ fontSize: '11px' }} />
              <Tooltip formatter={(val: any) => `$${parseFloat(val).toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Total Income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Total Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Daily/Weekly Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Doughnut Chart */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Category Spending Breakdown</h3>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Total: ${monthlySummary?.totalExpense?.toFixed(2)}
            </span>
          </div>

          {breakdownData.length === 0 ? (
            <p className="text-center text-slate-400 text-xs py-12">No expense entries logged for this month.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4}>
                      {breakdownData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => `$${parseFloat(val).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 w-full">
                {(monthlySummary?.breakdown || []).map((cat: any) => (
                  <div key={cat.category_id} className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <div className="font-mono text-right">
                      <span className="font-bold text-slate-900 dark:text-white">${cat.total.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 block">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily & Weekly Summaries */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Weekly Spending Breakdown</h3>
            </div>
            <span className="text-xs text-slate-400">Current Month</span>
          </div>

          <div className="space-y-3">
            {(dailyWeekly?.weekly || []).map((w: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-slate-800 dark:text-slate-200">{w.week}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">-${w.expense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Income: +${w.income.toFixed(2)}</span>
                  <span>Net: ${(w.income - w.expense).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Intelligence: Anomaly Detection & Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Large & Duplicate Transaction Detection */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-base mb-3 border-b border-amber-100 dark:border-amber-900/50 pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Transaction Anomaly Scanner</span>
          </div>

          {anomalies?.largeTransactions?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unusually Large Expenses Flagged (&gt;3x Average):</p>
              {anomalies.largeTransactions.map((tx: any) => (
                <div key={tx.transaction_id} className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{tx.description}</span>
                    <span className="text-slate-500 text-[10px] block font-mono">{tx.date} • {tx.category_name}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">${tx.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4">No unusually large or duplicate transaction anomalies detected in your account history!</p>
          )}
        </div>

        {/* Predictive Spending Forecast */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-base mb-3 border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>AI Upcoming Month Forecast</span>
          </div>

          {forecast && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Projected Next Month Expenses:</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">${forecast.forecastedExpense}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                {forecast.advice}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
