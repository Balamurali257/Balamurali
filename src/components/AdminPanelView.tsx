import React, { useState } from 'react';
import {
  Users,
  HardDrive,
  ShieldCheck,
  Megaphone,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { StorageStats, DocumentItem } from '../types';

interface AdminPanelViewProps {
  storageStats: StorageStats;
  documents: DocumentItem[];
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ storageStats, documents }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'broadcast' | 'categories'>('users');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const mockUsers = [
    { id: 'usr_01', name: 'Alexander Wright', email: 'alex.wright@vault.internal', role: 'User', files: documents.length, status: 'Active', twoFactor: 'Enabled' },
    { id: 'usr_02', name: 'Sarah Wright', email: 'sarah.wright@vault.internal', role: 'User', files: 4, status: 'Active', twoFactor: 'Enabled' },
    { id: 'usr_03', name: 'Dr. Evelyn Vance', email: 'evelyn.vance@stjude.org', role: 'User', files: 12, status: 'Active', twoFactor: 'Enabled' },
    { id: 'usr_04', name: 'System Admin', email: 'admin@vault.internal', role: 'Admin', files: 0, status: 'Active', twoFactor: 'Enabled' },
  ];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastText('');
      setBroadcastSent(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 pb-32 md:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
            Admin Console
          </span>
          <span className="text-xs text-slate-400">• Multi-tenant SaaS Management</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
          Vault System Administration
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Manage Users ({mockUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 px-2 border-b-2 transition-all ${
            activeTab === 'storage'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Storage Analytics
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`pb-3 px-2 border-b-2 transition-all ${
            activeTab === 'broadcast'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Broadcast Notifications
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Vault Accounts</h3>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-4">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Encrypted Files</th>
                  <th className="p-3.5">2FA Protection</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {mockUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-slate-900 dark:text-white">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">{u.files} files</td>
                    <td className="p-3.5 text-emerald-600 font-semibold">{u.twoFactor}</td>
                    <td className="p-3.5 text-emerald-600 font-bold">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <span>Storage Quota Breakdown</span>
            </div>

            <div className="space-y-3 text-xs">
              {(Object.entries(storageStats.categoryUsage) as [string, number][]).map(([cat, bytes]) => {
                const mb = (bytes / (1024 * 1024)).toFixed(1);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="text-slate-500">{mb} MB</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, bytes / 100000)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vault System Health</h3>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>All 4 Cloud Nodes Operational • Uptime 99.99%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-xl space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
            <Megaphone className="w-5 h-5 text-purple-600" />
            <span>Send System Notification to All Users</span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Broadcast Message</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. System scheduled maintenance on Sunday at 02:00 UTC."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border rounded-2xl"
              />
            </div>

            {broadcastSent && (
              <div className="p-3 bg-emerald-100 text-emerald-800 font-bold rounded-xl">
                Broadcast notification dispatched to all active sessions!
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
            >
              Dispatch System Broadcast
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
