import React from 'react';
import {
  LayoutDashboard,
  FolderLock,
  Upload,
  HeartPulse,
  BellRing,
  Sparkles,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Users,
  PieChart,
  ChevronRight,
  FileText,
  LogOut
} from 'lucide-react';
import { StorageStats } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenPhotoScanner?: () => void;
  currentRole: 'Admin' | 'User';
  storageStats?: StorageStats;
  onOpenManageProfiles?: () => void;
  onOpenStorageAnalytics?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenPhotoScanner,
  currentRole,
  onOpenManageProfiles,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents Vault', icon: FolderLock },
    { id: 'emergency', label: 'Emergency Medical Card', icon: HeartPulse, badge: 'Active' },
    { id: 'reminders', label: 'Reminders & Renewals', icon: BellRing, badge: '4 Due' },
    { id: 'security', label: 'Security & Audit Hub', icon: ShieldAlert },
    { id: 'settings', label: 'Account Center', icon: Settings },
  ];

  if (currentRole === 'Admin') {
    navItems.splice(navItems.length - 1, 0, {
      id: 'admin',
      label: 'Admin Control Panel',
      icon: Users,
      badge: 'Admin',
    });
  }

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 sticky top-[57px] h-[calc(100vh-57px)] self-start overflow-y-auto p-4 select-none transition-colors duration-200 z-30">
      {/* Quick Upload CTA */}
      <div className="mb-5">
        <button
          onClick={() => onNavigate('upload')}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4 shrink-0" />
          <span className="truncate">Upload Document</span>
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            CareBuddy Hub Navigation
          </span>
          {onOpenManageProfiles && (
            <button
              onClick={onOpenManageProfiles}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Manage Profile"
            >
              <Users className="w-3 h-3 shrink-0" />
              <span>Profile</span>
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  item.badge === 'Admin'
                    ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50'
                    : item.badge === 'Active'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50'
                    : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Log Out Section */}
      {onLogout && (
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onLogout}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700/70 transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};
