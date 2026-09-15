import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FolderLock,
  Camera,
  Sparkles,
  Menu,
  X,
  HeartPulse,
  BellRing,
  ShieldAlert,
  Settings,
  Users,
  Search,
  Upload,
  UserCheck,
  Sun,
  Moon,
  LogOut,
  Fingerprint,
  ArrowLeft
} from 'lucide-react';
import { StorageStats, VaultProfile } from '../types';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenPhotoScanner: () => void;
  onOpenAISearch: () => void;
  currentRole: 'Admin' | 'User';
  onToggleRole: () => void;
  storageStats?: StorageStats;
  profiles?: VaultProfile[];
  selectedProfileId?: string;
  onSelectProfile?: (profileId: string) => void;
  onOpenManageProfiles?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  onLogout?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenPhotoScanner,
  onOpenAISearch,
  currentRole,
  onToggleRole,
  storageStats,
  profiles = [],
  selectedProfileId = 'all',
  onSelectProfile,
  onOpenManageProfiles,
  darkMode,
  setDarkMode,
  onLogout,
  onGoBack,
  canGoBack,
}) => {
  const [showDrawer, setShowDrawer] = useState(false);

  // Prevent background scrolling when drawer is open
  React.useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDrawer]);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'documents', label: 'Vault', icon: FolderLock },
    { id: 'scan', label: 'Scan Photo', icon: Camera, isAction: true },
    { id: 'emergency', label: 'Emergency', icon: HeartPulse },
    { id: 'menu', label: 'Menu', icon: Menu, isMenu: true },
  ];

  const drawerNav = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents Vault', icon: FolderLock },
    { id: 'emergency', label: 'Emergency Medical Card', icon: HeartPulse, badge: 'Active' },
    { id: 'reminders', label: 'Reminders & Renewals', icon: BellRing, badge: '4 Due' },
    { id: 'security', label: 'Security & Audit Log', icon: ShieldAlert },
    { id: 'settings', label: 'Account Center', icon: Settings },
  ];

  if (currentRole === 'Admin') {
    drawerNav.splice(drawerNav.length - 1, 0, {
      id: 'admin',
      label: 'Admin Control Panel',
      icon: Users,
      badge: 'Admin',
    });
  }

  return (
    <>
      {/* Fixed Bottom Navigation Bar for Mobile & Tablet (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <button
                  key={tab.id}
                  onClick={onOpenPhotoScanner}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-white dark:ring-slate-900 active:scale-95 transition-transform">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Scan Photo
                  </span>
                </button>
              );
            }

            if (tab.isMenu) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setShowDrawer(true)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                    showDrawer
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
                </button>
              );
            }

            const isActive = currentView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setShowDrawer(false);
                  onNavigate(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Drawer Sheet for Mobile Navigation */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 text-slate-100 rounded-t-3xl border-t border-slate-800 max-h-[85vh] overflow-y-auto overscroll-contain p-5 space-y-4 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                    DV
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white">CareBuddy Hub Navigation</h3>
                    <p className="text-[10px] text-slate-400">Personal & Family Document Vault</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Previous Screen Navigation Button */}
              {canGoBack && onGoBack && (
                <button
                  onClick={() => {
                    setShowDrawer(false);
                    onGoBack();
                  }}
                  className="w-full p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-2xl border border-blue-500/40 flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span>Go Back to Previous Screen</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-200 bg-blue-600/40 px-2.5 py-0.5 rounded-full">
                    Previous
                  </span>
                </button>
              )}

              {/* Multi-User Profile Switcher in Drawer */}
              {onOpenManageProfiles && (
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {selectedProfileId === 'all'
                          ? 'All Family Members'
                          : profiles.find((p) => p.id === selectedProfileId)?.name || 'Member Profile'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {profiles.length} Vault Profiles Connected
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDrawer(false);
                      onOpenManageProfiles();
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow-xs"
                  >
                    Manage Profiles
                  </button>
                </div>
              )}

              {/* AI Search & Camera Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setShowDrawer(false);
                    onOpenPhotoScanner();
                  }}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span className="truncate">Scan Photo</span>
                </button>

                <button
                  onClick={() => {
                    setShowDrawer(false);
                    onOpenAISearch();
                  }}
                  className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span className="truncate">Ask Vault AI</span>
                </button>
              </div>

              {/* Navigation List */}
              <div className="space-y-1 pt-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
                  Vault Sections
                </div>
                {drawerNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowDrawer(false);
                        onNavigate(item.id);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Theme Switcher, Role Switcher & Storage Info */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                {setDarkMode !== undefined && (
                  <div className="flex items-center justify-between bg-slate-800/90 p-3 rounded-xl border border-slate-700/80">
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-bold">
                      {darkMode ? (
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      <span>Theme: <strong>{darkMode ? 'Dark' : 'Light'}</strong></span>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors shrink-0"
                    >
                      Switch to {darkMode ? 'Light' : 'Dark'}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Role: <strong>{currentRole}</strong></span>
                  </div>
                  <button
                    onClick={onToggleRole}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg shrink-0"
                  >
                    Switch Role
                  </button>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Vault Encryption:</span>
                  <span className="font-bold text-emerald-400">AES-256 Active</span>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowDrawer(false);
                      onLogout();
                    }}
                    className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
