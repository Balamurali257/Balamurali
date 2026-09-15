import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Shield,
  ShieldCheck,
  Lock,
  Key,
  Smartphone,
  Laptop,
  Tablet,
  Bell,
  Moon,
  Sun,
  Palette,
  HardDrive,
  Cloud,
  CloudDownload,
  CloudUpload,
  Users,
  UserPlus,
  CreditCard,
  Info,
  AlertTriangle,
  Trash2,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  CheckCircle,
  Camera,
  Upload,
  Download,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  Database,
  Sparkles,
  Activity,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Share2,
  Copy,
  Plus,
  X,
  ExternalLink,
  Layers,
  Zap,
  Award,
  Printer,
  FileText,
  Video,
  AlertCircle,
  Fingerprint,
  SlidersHorizontal,
  CheckSquare,
  CircleDot,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  LockKeyhole,
  CheckCircle2,
  Globe,
  Radio,
  FolderLock
} from 'lucide-react';
import { UserProfile, DocumentItem } from '../types';

interface SettingsViewProps {
  user: UserProfile;
  documents: DocumentItem[];
  onUpdateUser: (updated: UserProfile) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  initialCategory?: string;
  onOpenStorageAnalytics?: () => void;
}

export type CategoryId =
  | 'profile'
  | 'vaults'
  | 'preferences'
  | 'notifications'
  | 'privacy'
  | 'about';

interface CategoryMeta {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
  statusText?: string;
  keywords: string[];
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: 'profile',
    title: 'Personal Information',
    subtitle: 'Personal details, contact information & emergency contact',
    icon: User,
    color: 'from-blue-500 to-indigo-600',
    statusText: 'Verified Member',
    keywords: ['name', 'email', 'phone', 'dob', 'blood group', 'avatar', 'verified', 'bio', 'emergency', 'profile', 'address'],
  },
  {
    id: 'vaults',
    title: 'Vault Storage & Records',
    subtitle: 'Primary records repository, data export & local archives',
    icon: FolderLock,
    color: 'from-blue-500 to-indigo-600',
    statusText: 'Active',
    keywords: ['vault', 'storage', 'records', 'export', 'import', 'archive'],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    subtitle: 'Theme, accent colors, languages, accessibility & typography',
    icon: SlidersHorizontal,
    color: 'from-rose-500 to-pink-600',
    statusText: 'Dark Mode Active',
    keywords: ['theme', 'dark mode', 'light', 'language', 'font', 'accessibility', 'currency', 'time format', 'preferences'],
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    subtitle: 'Document expiry reminders, schedule alerts, email & SMS',
    icon: Bell,
    color: 'from-amber-500 to-orange-600',
    statusText: 'Alerts Enabled',
    keywords: ['notifications', 'email', 'push', 'sms', 'expiry', 'passport', 'insurance', 'reminders', 'alerts'],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    subtitle: 'App permissions, AI data preferences, cache & history purge',
    icon: Lock,
    color: 'from-cyan-500 to-blue-600',
    statusText: 'Local Controls',
    keywords: ['privacy', 'permissions', 'camera', 'location', 'analytics', 'clear history', 'cache', 'ai learning', 'data'],
  },
  {
    id: 'about',
    title: 'About Vault',
    subtitle: 'Version v3.2.0, release notes, license & legal disclosures',
    icon: Info,
    color: 'from-slate-500 to-slate-700',
    statusText: 'v3.2.0-Enterprise',
    keywords: ['about', 'version', 'build', 'terms', 'privacy policy', 'open source', 'release notes', 'legal'],
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  documents,
  onUpdateUser,
  darkMode,
  setDarkMode,
  initialCategory,
  onOpenStorageAnalytics,
}) => {
  // Realtime search query
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded Accordion State (set of CategoryId strings)
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryId>>(() => {
    const initial = new Set<CategoryId>();
    if (initialCategory && initialCategory !== 'hub' && CATEGORIES.some(c => c.id === initialCategory)) {
      initial.add(initialCategory as CategoryId);
    } else {
      // Default expand Personal Profile for quick view
      initial.add('profile');
    }
    return initial;
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ msg: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  // Form State for User Profile
  const [formData, setFormData] = useState<UserProfile>({ ...user });

  React.useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  // Interactive local states across categories

  const [permissions, setPermissions] = useState({
    camera: true,
    microphone: false,
    location: true,
    storage: true,
    notifications: true,
    clipboard: false,
    analytics: false,
    crashReports: true,
    personalizedSuggestions: true,
    aiLearning: false,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    docExpiry: true,
    insuranceRenewal: true,
    passportRenewal: true,
    medicalReminder: true,
    backupStatus: true,
    securityAlerts: true,
    sharedVaultActivity: true,
    familyActivity: true,
    weeklySummary: false,
    marketingEmails: false,
  });

  const [preferences, setPreferences] = useState({
    theme: darkMode ? 'Dark' : 'Light',
    language: 'English (US)',
    fontSize: 'Medium (14px)',
    highContrast: false,
    animations: true,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-hour (AM/PM)',
    currency: 'USD ($)',
    accentColor: '#2563EB',
    defaultLanding: 'Dashboard',
    aiVoiceSpeed: 'Normal',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleCategory = (catId: CategoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(CATEGORIES.map((c) => c.id)));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  // Filter categories and auto-expand matching ones if searching
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter((cat) => {
      return (
        cat.title.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // When search query is entered, expand all matching categories automatically
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCategories(new Set(filteredCategories.map((c) => c.id)));
    }
  }, [searchQuery, filteredCategories]);

  const handleSaveProfile = () => {
    onUpdateUser(formData);
    setEditProfileOpen(false);
    triggerToast('Personal profile updated successfully!');
  };

  const handleExportVault = () => {
    triggerToast('Preparing vault package... Download will start automatically.');
  };

  return (
    <div className="space-y-6 pb-36 md:pb-12 max-w-6xl mx-auto min-h-[85vh] relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 sm:right-8 z-50 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP SECTION: ACCOUNT HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-blue-500/40 bg-slate-800 flex items-center justify-center">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md border-2 border-slate-900 transition-transform hover:scale-110 cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const updated = { ...formData, avatarUrl: reader.result as string };
                      setFormData(updated);
                      onUpdateUser(updated);
                      triggerToast('Profile photo updated successfully!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{formData.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">{formData.email}</p>
            </div>
          </div>

          {/* Action CTAs: Download ID Card, Edit Profile */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setCardModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-all border border-slate-700 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download ID</span>
            </button>

            <button
              type="button"
              onClick={() => setEditProfileOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTIONS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => triggerToast('Emergency Medical Profile verified')}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer text-left flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Medical ID</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Verified & Active</div>
          </div>
        </button>

        <button
          onClick={() => setCardModalOpen(true)}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-left flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Download Card</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Identity & Emergency PDF</div>
          </div>
        </button>

        <button
          onClick={handleExportVault}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-purple-500/50 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer text-left flex items-center gap-3 group"
        >
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Export Vault</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Archive Package</div>
          </div>
        </button>
      </div>

      {/* 3. SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search settings (Theme, Language, Notifications)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold">
          {searchQuery ? (
            <span className="text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 rounded-xl">
              {filteredCategories.length} category match(es)
            </span>
          ) : (
            <>
              <button
                onClick={expandAllCategories}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </button>
              <button
                onClick={collapseAllCategories}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
                <span>Collapse All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. EXPANDABLE SETTINGS CATEGORIES ACCORDION LIST */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const IconComp = cat.icon;
          const isExpanded = expandedCategories.has(cat.id);

          return (
            <div
              key={cat.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl transition-all duration-200 shadow-xs overflow-hidden ${
                isExpanded
                  ? 'border-blue-500/50 dark:border-blue-500/40 ring-1 ring-blue-500/20'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* ACCORDION HEADER TILE */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(cat.id);
                  }
                }}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none group bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/40 active:scale-[0.995] transition-all"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cat.title}
                      </h3>
                      {cat.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {cat.statusText && (
                    <span className="hidden sm:inline-block text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {cat.statusText}
                    </span>
                  )}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* EXPANDABLE BODY CONTENT */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-5">
                      {/* 1. PERSONAL INFORMATION CONTENT */}
                      {cat.id === 'profile' && (
                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Full Name</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{formData.name}</span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Email Address</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{formData.email}</span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Phone Number</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{formData.phone}</span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Date of Birth</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{formData.dob}</span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Blood Group</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">{formData.bloodGroup}</span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-400 font-bold block mb-0.5">Emergency Contact</span>
                              <span className="text-slate-900 dark:text-white font-bold text-sm">
                                {formData.emergencyContact?.name} ({formData.emergencyContact?.phone})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Member Since: August 2024 • Account Status: <span className="text-emerald-500 font-bold">Active</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditProfileOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                              >
                                Edit Profile Details
                              </button>
                              <button
                                onClick={() => triggerToast('Personal profile summary exported to PDF')}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                              >
                                Download Personal Data
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. VAULT STORAGE CONTENT */}
                      {cat.id === 'vaults' && (
                        <div className="space-y-3 text-xs">
                          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                                <FolderLock className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>CareBuddy Digital Vault</span>
                                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Active
                                  </span>
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                  {documents.filter((d) => !d.isDeleted).length} active documents • Records Archive
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleExportVault}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export Vault</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 6. PREFERENCES CONTENT */}
                      {cat.id === 'preferences' && (
                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <label className="text-slate-400 font-bold">App Theme</label>
                              <select
                                value={darkMode ? 'Dark' : 'Light'}
                                onChange={(e) => {
                                  setDarkMode(e.target.value === 'Dark');
                                  triggerToast(`Theme switched to ${e.target.value}`);
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white focus:outline-none"
                              >
                                <option value="Dark">Dark Theme</option>
                                <option value="Light">Light Theme</option>
                              </select>
                            </div>

                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <label className="text-slate-400 font-bold">Language</label>
                              <select
                                value={preferences.language}
                                onChange={(e) => {
                                  setPreferences({ ...preferences, language: e.target.value });
                                  triggerToast(`Language updated to ${e.target.value}`);
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white focus:outline-none"
                              >
                                <option value="English (US)">English (US)</option>
                                <option value="Spanish">Spanish (Español)</option>
                                <option value="French">French (Français)</option>
                                <option value="German">German (Deutsch)</option>
                                <option value="Hindi">Hindi (हिंदी)</option>
                              </select>
                            </div>

                            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <label className="text-slate-400 font-bold">Date Format</label>
                              <select
                                value={preferences.dateFormat}
                                onChange={(e) => {
                                  setPreferences({ ...preferences, dateFormat: e.target.value });
                                  triggerToast(`Date format set to ${e.target.value}`);
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white focus:outline-none"
                              >
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7. NOTIFICATIONS CONTENT */}
                      {cat.id === 'notifications' && (
                        <div className="space-y-3 text-xs">
                          {Object.entries({
                            docExpiry: 'Document Expiration Alerts (Passport, Insurance)',
                            securityAlerts: 'Security & Unrecognized Login Alerts',
                            sharedVaultActivity: 'Shared Vault Member Activity',
                            email: 'Email Digest Reports',
                            push: 'Mobile Push Notifications',
                          }).map(([key, label]) => (
                            <div
                              key={key}
                              className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                              <button
                                onClick={() => {
                                  const val = !notifications[key as keyof typeof notifications];
                                  setNotifications({ ...notifications, [key]: val });
                                  triggerToast(`${label}: ${val ? 'Enabled' : 'Disabled'}`);
                                }}
                                className={`w-10 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                                  notifications[key as keyof typeof notifications] ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 8. PRIVACY & DATA CONTENT */}
                      {cat.id === 'privacy' && (
                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries({
                              camera: 'Camera Access (Document Scanner)',
                              location: 'Location Tagging',
                              storage: 'Local Workspace Cache',
                              analytics: 'Usage Telemetry',
                            }).map(([key, label]) => (
                              <div
                                key={key}
                                className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                              >
                                <span>{label}</span>
                                <button
                                  onClick={() => {
                                    const val = !permissions[key as keyof typeof permissions];
                                    setPermissions({ ...permissions, [key]: val });
                                    triggerToast(`${label}: ${val ? 'Allowed' : 'Revoked'}`);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                                    permissions[key as keyof typeof permissions] ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {permissions[key as keyof typeof permissions] ? 'Allowed' : 'Revoked'}
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2 flex-wrap">
                            <button
                              onClick={() => triggerToast('Search history purged')}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                            >
                              Clear Search History
                            </button>
                            <button
                              onClick={() => triggerToast('AI Chat history purged')}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                            >
                              Delete AI Chat History
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 6. ABOUT CONTENT */}
                      {cat.id === 'about' && (
                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">CareBuddy Hub v3.2.0</div>
                          <p>Personal Health Records & Document Management Platform.</p>
                          <div className="flex gap-4 pt-1 font-semibold text-blue-600 dark:text-blue-400">
                            <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast('Terms of Service document opened'); }}>Terms of Service</a>
                            <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy document opened'); }}>Privacy Policy</a>
                            <a href="#licenses" onClick={(e) => { e.preventDefault(); triggerToast('Open source licenses list opened'); }}>Open Source Licenses</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: EDIT PROFILE MODAL */}
      <AnimatePresence>
        {editProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Edit Personal Details & Profile</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your CareBuddy Hub identity credentials and contact information</p>
                </div>
                <button
                  onClick={() => setEditProfileOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Alexander Wright"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Blood Group</label>
                    <input
                      type="text"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2">
                  <span className="block font-bold text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency Contact Details</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Contact Name & Relation</label>
                      <input
                        type="text"
                        value={formData.emergencyContact?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {
                            ...(formData.emergencyContact || { relationship: 'Spouse', phone: '' }),
                            name: e.target.value
                          }
                        })}
                        className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs"
                        placeholder="e.g. Sarah Wright (Spouse)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Emergency Phone</label>
                      <input
                        type="text"
                        value={formData.emergencyContact?.phone || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {
                            ...(formData.emergencyContact || { name: '', relationship: 'Spouse' }),
                            phone: e.target.value
                          }
                        })}
                        className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-semibold text-xs"
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Personal Bio & Notes</label>
                  <textarea
                    rows={2}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium resize-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Personal Details</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1.6: DOWNLOAD IDENTITY CARD MODAL */}
      <AnimatePresence>
        {cardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>CareBuddy Hub Emergency Identity Card</span>
                </h3>
                <button onClick={() => setCardModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Digital Card Layout */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl border-2 border-blue-500/40 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <div>
                    <div className="text-xs font-black tracking-wider text-blue-300 uppercase">CareBuddy Hub Digital Vault</div>
                    <div className="text-[10px] text-slate-300">Official Emergency Medical & Identity Pass</div>
                  </div>
                  <div className="bg-emerald-500 text-slate-950 font-mono font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                    VERIFIED PASS
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/30 shrink-0">
                    <img src={formData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'} alt={formData.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="text-base font-black text-white">{formData.name}</div>
                    <div className="text-slate-300 font-medium">{formData.email} • {formData.phone}</div>
                    <div className="text-slate-300 text-[11px]">Blood Group: <span className="font-bold text-rose-400">{formData.bloodGroup}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Emergency Contact</span>
                    <span className="font-bold text-white">{formData.emergencyContact?.name}</span>
                    <span className="text-slate-300 block">{formData.emergencyContact?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Primary Physician</span>
                    <span className="font-bold text-white">{formData.medicalProfile?.primaryDoctor || 'Dr. Vance MD'}</span>
                    <span className="text-slate-300 block">{formData.medicalProfile?.hospitalPreference || 'St. Jude Hospital'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCardModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Card</span>
                </button>
                <button
                  onClick={() => {
                    triggerToast('CareBuddy Identity Card PDF generated and downloaded!');
                    setCardModalOpen(false);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
