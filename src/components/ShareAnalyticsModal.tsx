import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Eye,
  Download,
  Clock,
  Smartphone,
  ShieldAlert,
  Calendar,
  Lock,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  Copy,
  MapPin,
  Laptop,
  ExternalLink
} from 'lucide-react';
import { SecureShare } from '../types';
import { loadShares, updateShareSettings, revokeShareLink } from '../utils/shareStore';

interface ShareAnalyticsModalProps {
  shareId: string | null;
  onClose: () => void;
}

export const ShareAnalyticsModal: React.FC<ShareAnalyticsModalProps> = ({
  shareId,
  onClose
}) => {
  const [share, setShare] = useState<SecureShare | null>(null);

  useEffect(() => {
    if (!shareId) return;
    const found = loadShares().find((s) => s.shareId === shareId);
    if (found) {
      setShare(found);
    }
  }, [shareId]);

  if (!share) return null;

  const totalViews = share.viewCount;
  const totalDownloads = share.accessAnalytics.filter((a) => a.action === 'Download').length;
  const failedAttempts = share.accessAnalytics.filter(
    (a) => a.action === 'Failed Password' || a.action === 'Failed OTP'
  ).length;

  const uniqueIps = new Set(share.accessAnalytics.map((a) => a.ip)).size || (totalViews > 0 ? 1 : 0);

  const handleRevoke = () => {
    revokeShareLink(share.shareId);
    setShare({ ...share, status: 'revoked' });
  };

  const handleExtendExpiry = () => {
    const newExpiry = new Date(Date.now() + 7 * 86400000).toISOString();
    const updated = updateShareSettings(share.shareId, {
      expiryDate: newExpiry,
      status: 'active'
    });
    if (updated) setShare(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  Share Link Analytics & Security Audit
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    share.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {share.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Link ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{share.shareId}</span> • Document: <span className="font-semibold text-slate-700 dark:text-slate-200">{share.documentName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>Total Views</span>
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalViews}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Max Limit: {share.maxViews ? `${share.maxViews} views` : 'Unlimited'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>Downloads</span>
                <Download className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalDownloads}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Download: {share.downloadEnabled ? 'Allowed' : 'Restricted'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>Unique Visitors</span>
                <Laptop className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {uniqueIps}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Distinct IP addresses
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>Failed Attempts</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {failedAttempts}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Wrong password or OTP
              </p>
            </div>
          </div>

          {/* Quick Management Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Link Expiry Status
              </span>
              <span className="text-slate-500">
                {share.expiryDate
                  ? `Expires on ${new Date(share.expiryDate).toLocaleString()}`
                  : 'Set to Never Expire'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExtendExpiry}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                + Extend 7 Days
              </button>

              {share.status === 'active' && (
                <button
                  onClick={handleRevoke}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Disable & Revoke
                </button>
              )}
            </div>
          </div>

          {/* Access Event Audit Log Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Real-Time Access Log Timeline
            </h3>

            {share.accessAnalytics.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                No access recorded for this link yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Location & IP</th>
                      <th className="p-3">Device / OS</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {share.accessAnalytics.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            {log.city}, {log.country} ({log.ip})
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {log.device} • {log.os} ({log.browser})
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              log.status === 'Success'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
          <button
            onClick={() => {
              window.location.hash = `#s/${share.shareId}`;
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open & View Shared Document</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
