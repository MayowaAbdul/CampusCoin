import React, { useState } from 'react';
import { X, KeyRound, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, initialToken }) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'request' | 'reset'>(initialToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [simulatedInfo, setSimulatedInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.forgotPassword(email);
      if (res.simulated_email) {
        setSimulatedInfo(res.simulated_email);
        setToken(res.simulated_email.resetToken);
        setStep('reset');
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      setError('Token and new password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.resetPassword({ token, new_password: newPassword });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 dark:text-slate-100 relative animate-fadeIn border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <KeyRound className="w-5 h-5 text-indigo-500" />
            <span>Password Recovery & Reset</span>
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

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered student email address to receive a tokenized password recovery link.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="e.g. alex@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
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
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Generate Reset Token'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {simulatedInfo && (
              <div className="p-3 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">Simulated Email Verification Link Sent:</span>
                <p className="text-slate-600 dark:text-slate-400">Token auto-filled in field below!</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ← Back to email input
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
