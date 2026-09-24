import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError('');
      setSuccessMsg('');

      // Auto-preview CSV with AI batch categorization
      setLoading(true);
      try {
        const res = await api.importCsv(selectedFile, true);
        setPreviewData(res.preview || []);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.importCsv(file, false);
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-800 dark:text-slate-100 relative animate-fadeIn border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <Upload className="w-5 h-5 text-indigo-500" />
            <span>Bulk CSV Import & AI Batch Categorization</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* File Dropzone */}
        <div className="mb-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/40 relative">
          <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {file ? file.name : 'Click or drag CSV file to upload'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports columns: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">date, amount, type, description, category</code>
          </p>
        </div>

        {/* AI Batch Categorization Preview */}
        {previewData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>AI Batch Categorization Preview ({previewData.length} records)</span>
              </div>
              <span className="text-[11px] text-slate-500">Review AI suggested categories before saving</span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Assigned Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2">{row.date}</td>
                      <td className="p-2 max-w-[150px] truncate">{row.description}</td>
                      <td className="p-2 capitalize">
                        <span className={`px-1.5 py-0.5 rounded ${row.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-2 font-mono">${parseFloat(row.amount).toFixed(2)}</td>
                      <td className="p-2 font-medium flex items-center gap-1 text-purple-700 dark:text-purple-300">
                        {row.is_ai_suggested && <Sparkles className="w-3 h-3 text-purple-500" />}
                        <span>{row.category_name}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading || previewData.length === 0}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Processing...' : `Confirm & Import ${previewData.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};
