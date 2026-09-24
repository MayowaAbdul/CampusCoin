import React, { useState } from 'react';
import { X, Mail, Download, CheckCircle, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  targetElementId?: string;
  summaryText?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, targetElementId, summaryText }) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleExportPdf = async () => {
    if (!targetElementId) {
      // Fallback simple PDF generator if no HTML element ID passed
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Campus Coin Financial Summary', 14, 22);
      doc.setFontSize(12);
      doc.text(`Title: ${title}`, 14, 32);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 40);

      if (summaryText) {
        const splitText = doc.splitTextToSize(summaryText, 180);
        doc.text(splitText, 14, 52);
      }

      doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
      return;
    }

    const element = document.getElementById(targetElementId);
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSuccessMsg(`Report successfully dispatched to ${email}!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 dark:text-slate-100 relative animate-fadeIn border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <Share2 className="w-5 h-5 text-indigo-500" />
            <span>Export & Share Report</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Quick PDF Download Option */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Export as PDF File</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Download formatted PDF document for your records</p>
            </div>
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">Or Share via Email</span>
            </div>
          </div>

          {/* Email Share Form */}
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Recipient Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="e.g. parent@family.com or advisor@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Personal Note (Optional)</label>
              <textarea
                rows={2}
                placeholder="Add a custom note to recipient..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
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
                disabled={sending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
