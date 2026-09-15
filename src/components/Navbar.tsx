import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  ChevronDown,
  Home,
  FolderLock,
  Sparkles,
  Upload,
  Users,
  Star,
  FileOutput,
  Settings,
  LogOut,
  User,
  ShieldAlert,
  Bell,
  Layers,
  X,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Plus,
  Pencil,
  CheckCircle,
  Loader2,
  Fingerprint,
  ArrowLeft
} from 'lucide-react';
import { UserProfile, VaultProfile } from '../types';
import { ProfileDetailModal } from './ProfileDetailModal';
import { ProfileSelector } from './ProfileSelector';

interface NavbarProps {
  user: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAISearch: () => void;
  onOpenEmergencyCard: () => void;
  onOpenAIAssistant: () => void;
  onOpenPhotoScanner?: () => void;
  currentRole: 'Admin' | 'User';
  onToggleRole: () => void;
  onNavigate: (view: string) => void;
  profiles: VaultProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onOpenManageProfiles: () => void;
  onLogout?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onUpdateUser,
  darkMode,
  setDarkMode,
  onOpenAISearch,
  onOpenEmergencyCard,
  onOpenAIAssistant,
  onOpenPhotoScanner,
  currentRole,
  onToggleRole,
  onNavigate,
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenManageProfiles,
  onLogout,
  onGoBack,
  canGoBack,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDetailProfileModal, setShowDetailProfileModal] = useState(false);
  const [openProfileInEditMode, setOpenProfileInEditMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || 'Alexander Wright',
    email: user.email || 'alexander@email.com',
    role: currentRole || 'Admin',
  });

  // Prevent background scrolling when overlay menus/drawers are open
  React.useEffect(() => {
    if (isDrawerOpen || isProfileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, isProfileOpen]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  React.useEffect(() => {
    setProfileData({
      name: user.name || 'Alexander Wright',
      email: user.email || 'alexander@email.com',
      role: currentRole || 'Admin',
    });
  }, [user, currentRole]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: profileData.name,
        email: profileData.email,
      });
    }
    setIsEditingProfile(false);
    triggerToast('Profile updated successfully!');
  };

  const drawerNavGroup1 = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        onNavigate('dashboard');
        setIsDrawerOpen(false);
      },
    },
    {
      id: 'vault',
      label: 'My Vault',
      icon: FolderLock,
      action: () => {
        onNavigate('documents');
        setIsDrawerOpen(false);
      },
    },
    {
      id: 'upload',
      label: 'Upload Document',
      icon: Upload,
      action: () => {
        setIsDrawerOpen(false);
        onNavigate('upload');
      },
    },
    {
      id: 'shared',
      label: 'Shared Documents',
      icon: Users,
      action: () => {
        onNavigate('documents');
        setIsDrawerOpen(false);
      },
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Star,
      action: () => {
        onNavigate('documents');
        setIsDrawerOpen(false);
      },
    },
    {
      id: 'export',
      label: 'Export Documents',
      icon: FileOutput,
      action: () => {
        onNavigate('documents');
        setIsDrawerOpen(false);
      },
    },
  ];

  const drawerNavGroup2 = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        onNavigate('settings');
        setIsDrawerOpen(false);
      },
    },
  ];

  const notificationsList = [
    { id: 1, title: 'Passport Expiring Soon', time: '2h ago', desc: 'Expires in 198 days.' },
    { id: 2, title: 'Documents Verified', time: '1d ago', desc: 'All documents verified safely.' },
    { id: 3, title: 'Profile Synchronized', time: '2d ago', desc: 'Profile details saved.' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 select-none shadow-2xs">
      {/* ==================== FIRST ROW (56px) ==================== */}
      <div className="h-[56px] px-3 sm:px-4 flex items-center justify-between w-full max-w-full relative gap-2">
        {/* LEFT: ☰ Hamburger Button & Previous / Back Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 -ml-1 flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Drawer"
          >
            <Menu className="w-6 h-6 text-slate-800 dark:text-slate-100 shrink-0" />
          </button>

          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700/90 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Go back to previous screen"
              aria-label="Previous Page"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden xs:inline">Previous</span>
            </button>
          )}
        </div>

        {/* CENTER: CareBuddy Hub Title */}
        <div className="flex-1 min-w-0 mx-2 text-center">
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight truncate flex items-center justify-center gap-1.5">
            <span>CareBuddy Hub</span>
          </h1>
        </div>

        {/* RIGHT: 👤 Profile Avatar */}
        <button
          onClick={() => {
            setIsEditingProfile(false);
            setIsProfileOpen(true);
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-blue-500 transition-all cursor-pointer shrink-0"
          title="Open Profile Menu"
          aria-label="Profile and Settings"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white shrink-0" />
          )}
        </button>
      </div>

      {/* ==================== NAVIGATION DRAWER (82vw, Material Design 3 / Google Drive Style) ==================== */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Dark Translucent Overlay (45% opacity, blocks all screen interactions) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-xs"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_e, info) => {
                if (info.offset.x < -50) setIsDrawerOpen(false);
              }}
              className="fixed inset-y-0 left-0 z-[60] w-[82vw] max-w-[320px] sm:max-w-[340px] bg-[#0F172A] text-slate-100 shadow-2xl rounded-tr-3xl rounded-br-3xl flex flex-col border-r border-slate-800/80 overflow-hidden select-none"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-800 bg-[#1E293B]/70 shrink-0">
                {/* Avatar & Close Button */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md overflow-hidden ring-2 ring-blue-500/40 shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{profileData.name ? profileData.name[0] : 'A'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Close Menu"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* User Name & Email */}
                <div className="min-w-0">
                  <h2 className="text-[18px] font-bold text-white tracking-tight truncate leading-snug">
                    {profileData.name}
                  </h2>
                  <p className="text-[13px] font-normal text-slate-400 truncate mt-0.5">
                    {profileData.email}
                  </p>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto overscroll-contain py-3 px-3 space-y-1">
                {/* Main Nav Items */}
                {drawerNavGroup1.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full h-[48px] sm:h-[52px] flex items-center gap-4 px-4 rounded-2xl text-[15px] font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer active:scale-98"
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}

                {/* Group Divider */}
                <div className="my-2 border-t border-slate-800/80 mx-2" />

                {/* Secondary Nav Items */}
                {drawerNavGroup2.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full h-[48px] sm:h-[52px] flex items-center gap-4 px-4 rounded-2xl text-[15px] font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer active:scale-98"
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer: Logout Button */}
              <div className="p-4 border-t border-slate-800/80 bg-[#1E293B]/40 shrink-0">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full h-12 flex items-center gap-4 px-4 rounded-2xl text-[15px] font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer active:scale-98"
                >
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== PROFILE BOTTOM SHEET / DROPDOWN WITH EDIT ==================== */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs"
              onClick={() => {
                setIsProfileOpen(false);
                setIsEditingProfile(false);
              }}
            />

            {/* Bottom Sheet on Mobile / Modal on Large Screen */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed bottom-0 inset-x-0 sm:inset-auto sm:right-4 sm:top-16 sm:bottom-auto sm:w-96 z-[60] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 max-h-[85vh] sm:max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden"
            >
              {/* Mobile Drag Indicator Bar */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

              {/* Profile Header Block */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={profileData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profileData.name ? profileData.name[0] : 'A'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold text-slate-900 dark:text-white truncate">
                      {profileData.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {profileData.email}
                    </div>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {profileData.role} Role
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsEditingProfile(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer shrink-0 transition-colors"
                  aria-label="Close Profile Menu"
                  title="Close Menu"
                >
                  <X className="w-5 h-5 shrink-0" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-1.5 scrollbar-thin mt-3">
                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Edit Quick Details
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setOpenProfileInEditMode(false);
                        setShowDetailProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <User className="w-5 h-5 text-slate-500 shrink-0" />
                      <span className="truncate">My Profile Details</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Bell className="w-5 h-5 text-slate-500 shrink-0" />
                        <span className="truncate">Notifications</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    </button>

                    {/* Expanded Notifications Panel */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="ml-8 p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl space-y-2 border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                        >
                          {notificationsList.map((n) => (
                            <div key={n.id} className="text-xs">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-slate-400">{n.time}</span>
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">{n.desc}</div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Settings className="w-5 h-5 text-slate-500 shrink-0" />
                      <span className="truncate">Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('security');
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0" />
                      <span className="truncate">Security</span>
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {darkMode ? <Sun className="w-5 h-5 text-amber-400 shrink-0" /> : <Moon className="w-5 h-5 text-indigo-600 shrink-0" />}
                        <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-5 h-5 shrink-0" />
                      <span className="truncate">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== DETAILED PROFILE MODAL ==================== */}
      <AnimatePresence>
        {showDetailProfileModal && (
          <ProfileDetailModal
            user={user}
            initialEditing={openProfileInEditMode}
            onClose={() => {
              setShowDetailProfileModal(false);
              setOpenProfileInEditMode(false);
            }}
            onUpdateUser={(updated) => {
              if (onUpdateUser) onUpdateUser(updated);
              setProfileData({
                name: updated.name,
                email: updated.email,
                role: updated.role,
              });
              triggerToast('Vault profile & avatar updated successfully!');
            }}
          />
        )}
      </AnimatePresence>

      {/* ==================== TOAST / SNACKBAR NOTIFICATION ==================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 bg-slate-900 text-white rounded-2xl font-semibold text-xs sm:text-sm shadow-2xl flex items-center gap-2.5 border border-slate-700/80 max-w-[90vw]"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
