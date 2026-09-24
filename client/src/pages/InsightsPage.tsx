import React, { useState, useEffect } from 'react';
import { Sparkles, Bookmark, BookmarkCheck, Pin, XCircle, ChevronDown, ChevronUp, TrendingUp, Lightbulb, History, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Insight, SavedTip } from '../types';

export const InsightsPage: React.FC = () => {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightHistory, setInsightHistory] = useState<Insight[]>([]);
  const [tips, setTips] = useState<SavedTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const currentMonth = new Date().toISOString().substring(0, 7);

  const loadInsightData = async () => {
    setLoading(true);
    try {
      const [insightRes, historyRes, tipsRes] = await Promise.all([
        api.getCurrentInsight(currentMonth),
        api.getInsightHistory(),
        api.getSavingTips()
      ]);

      setInsight(insightRes);
      setInsightHistory(historyRes);
      setTips(tipsRes);
    } catch (err) {
      console.error('Failed to load insights data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsightData();
  }, []);

  const handleRegenerateInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await api.getCurrentInsight(currentMonth, true);
      setInsight(res);
    } catch (err) {
      console.error('Failed to regenerate insight:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleBookmarkInsight = async (id: number) => {
    try {
      const res = await api.toggleBookmarkInsight(id);
      setInsight((prev) => (prev && prev.insight_id === id ? { ...prev, is_bookmarked: res.is_bookmarked } : prev));
      setInsightHistory((prev) =>
        prev.map((i) => (i.insight_id === id ? { ...i, is_bookmarked: res.is_bookmarked } : i))
      );
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">AI is analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Spending Insights & Saving Tips Engine</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          AI-generated monthly spending narratives, growth flagging, personalized saving tips, and insight history timeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Current Month AI Insight + History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Month AI Insight Narrative */}
          {insight && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                <Sparkles className="w-64 h-64 text-purple-600" />
              </div>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-purple-600 text-white rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900 dark:text-white text-lg">AI Monthly Spending Narrative</h2>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">{insight.month}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBookmarkInsight(insight.insight_id)}
                    className={`p-2 rounded-xl transition ${
                      insight.is_bookmarked
                        ? 'text-amber-500 bg-amber-100 dark:bg-amber-950'
                        : 'text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-950'
                    }`}
                    title="Bookmark this insight"
                  >
                    {insight.is_bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleRegenerateInsight}
                    disabled={insightLoading}
                    className="p-2 text-purple-600 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 rounded-xl transition"
                    title="Regenerate AI insight"
                  >
                    <RefreshCw className={`w-5 h-5 ${insightLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* AI Summary Text Card */}
              <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-purple-100 dark:border-purple-900 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 mb-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Spending Analysis Summary</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{insight.summary_text}</p>
              </div>

              {/* Flagged Category Alert */}
              {insight.flagged_category_name && insight.growth_percentage && insight.growth_percentage > 0 && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl mb-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-rose-800 dark:text-rose-300">Overspending Growth Flag: </span>
                    <span className="text-rose-700 dark:text-rose-300">
                      <strong>{insight.flagged_category_name}</strong> category surged by{' '}
                      <strong>{insight.growth_percentage}%</strong> compared to your historical monthly average.
                    </span>
                  </div>
                </div>
              )}

              {/* AI Actionable Tip */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-indigo-800 dark:text-indigo-300">AI Actionable Suggestion: </span>
                  <span className="text-indigo-700 dark:text-indigo-300">{insight.tip_text}</span>
                </div>
              </div>
            </div>
          )}

          {/* Insight History Timeline */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              <History className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Insight History Timeline</h3>
            </div>

            {insightHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No historical insights available yet. Insights are generated monthly.</p>
            ) : (
              <div className="space-y-3">
                {insightHistory.map((ins) => (
                  <div key={ins.insight_id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                      onClick={() => setExpandedHistoryId(expandedHistoryId === ins.insight_id ? null : ins.insight_id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{ins.month}</span>
                        {ins.is_bookmarked ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-500" />
                        ) : null}
                        {ins.flagged_category_name && (
                          <span className="text-[10px] px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 rounded font-semibold">
                            {ins.flagged_category_name} Flagged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmarkInsight(ins.insight_id);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-500"
                        >
                          {ins.is_bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        {expandedHistoryId === ins.insight_id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {expandedHistoryId === ins.insight_id && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs">
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{ins.summary_text}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 italic">{ins.tip_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Saving Tips Engine Full List */}
        <div className="space-y-4">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Saving Tips Engine</h3>
            </div>

            <div className="space-y-3">
              {tips.map((tip) => (
                <div
                  key={tip.tip_id}
                  className={`p-4 rounded-xl border transition ${
                    tip.status === 'pinned'
                      ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : tip.status === 'bookmarked'
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900'
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
                        title="Pin tip"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTipStatus(tip.tip_id, tip.status === 'bookmarked' ? 'active' : 'bookmarked')}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          tip.status === 'bookmarked' ? 'text-indigo-500' : 'text-slate-400'
                        }`}
                        title="Bookmark tip"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTipStatus(tip.tip_id, 'dismissed')}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Dismiss tip"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{tip.content}</p>
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      +${tip.potential_savings.toFixed(2)}/mo saved
                    </span>
                    <span className="text-slate-400">{tip.category_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
