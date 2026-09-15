import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Pencil,
  Save,
  CheckCircle,
  ArrowLeft,
  Globe,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  initialEditing?: boolean;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
];

// Material Design Input Component (52px high, 14px rounded)
const MaterialInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, type = 'text', placeholder = '', icon }) => (
  <div className="relative w-full">
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-[52px] ${
          icon ? 'pl-11' : 'pl-4'
        } pr-4 bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-[14px] text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-200`}
      />
    </div>
  </div>
);

// Modern Settings Row Component for Read-only state
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, label, value, action, onClick, danger = false }) => (
  <div
    onClick={onClick}
    className={`min-h-[52px] px-4 py-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-[14px] border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3 text-sm transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80' : ''
    }`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`shrink-0 ${danger ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
        {icon}
      </div>
      <span
        className={`font-medium truncate ${
          danger
            ? 'text-rose-600 dark:text-rose-400 font-semibold'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {label}
      </span>
    </div>
    {(value || action) && (
      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
            {value}
          </span>
        )}
        {action}
      </div>
    )}
  </div>
);

// Toggle Switch Component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
      checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  user,
  onClose,
  onUpdateUser,
  initialEditing = false,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(initialEditing);
  const [formData, setFormData] = useState<UserProfile>({ ...user });

  // Security & Preferences State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? true,
    biometricEnabled: user.securitySettings?.biometricEnabled ?? true,
    trustedDevicesCount: user.securitySettings?.trustedDevicesCount ?? 3,
  });

  const [preferences, setPreferences] = useState({
    theme: 'System',
    language: 'English (US)',
    notifications: true,
    privacyMode: true,
  });

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast('Image file size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
        triggerToast('Profile photo updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updated: UserProfile = {
      ...formData,
      securitySettings: {
        ...formData.securitySettings,
        ...securitySettings,
        autoLockMinutes: formData.securitySettings?.autoLockMinutes ?? 5,
        lastPasswordChange: formData.securitySettings?.lastPasswordChange ?? '2026-06-15',
      },
    };
    onUpdateUser(updated);
    setIsEditing(false);
    triggerToast('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setFormData({ ...user });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative my-auto"
      >
        {/* Header Bar */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 sticky top-0 z-20">
          {/* Left Side: Back / Cancel */}
          {!isEditing ? (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span>Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-base hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span>Profile</span>
            </button>
          )}

          {/* Right Side: Edit / Save */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="w-4 h-4 shrink-0" />
                <span>Edit</span>
              </button>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>Save</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0 pb-16">
          {/* 1. Profile Header */}
          <div className="flex flex-col items-center text-center space-y-3 pt-1 pb-2">
            <div className="relative shrink-0">
              <div className="w-[80px] h-[80px] rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer border-2 border-white dark:border-slate-900"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {formData.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {formData.email}
              </p>
            </div>
          </div>

          {/* Avatar Choice Dropdown/Drawer */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-[14px] space-y-3"
              >
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Update Profile Picture</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>

                  <div className="flex-1 min-w-[180px] flex gap-2">
                    <input
                      type="url"
                      placeholder="Or paste URL..."
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customImageUrl.startsWith('http')) {
                          setFormData({ ...formData, avatarUrl: customImageUrl });
                          setCustomImageUrl('');
                          triggerToast('Avatar URL applied');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Or select avatar preset:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, avatarUrl: preset });
                          triggerToast('Avatar updated');
                        }}
                        className={`w-9 h-9 rounded-full overflow-hidden ring-2 transition-all cursor-pointer ${
                          formData.avatarUrl === preset
                            ? 'ring-blue-600 scale-105 shadow-md'
                            : 'ring-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Personal Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Personal Information
            </h4>

            <motion.div
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {isEditing ? (
                <>
                  <MaterialInput
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    icon={<User className="w-4 h-4" />}
                  />
                  <MaterialInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <MaterialInput
                    label="Phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <MaterialInput
                    label="Date of Birth"
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  <MaterialInput
                    label="Emergency Contact Name"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    icon={<User className="w-4 h-4" />}
                  />
                  <MaterialInput
                    label="Emergency Contact Phone"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    icon={<Phone className="w-4 h-4" />}
                  />
                </>
              ) : (
                <div className="space-y-2.5">
                  <SettingsRow
                    icon={<User className="w-4 h-4" />}
                    label="Name"
                    value={formData.name}
                  />
                  <SettingsRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={formData.email}
                  />
                  <SettingsRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone"
                    value={formData.phone || 'Not provided'}
                  />
                  <SettingsRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Date of Birth"
                    value={formData.dob || 'Not provided'}
                  />
                  <SettingsRow
                    icon={<ShieldCheck className="w-4 h-4" />}
                    label="Emergency Contact"
                    value={
                      formData.emergencyContact?.name
                        ? `${formData.emergencyContact.name} (${formData.emergencyContact.phone || ''})`
                        : 'Not set'
                    }
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* 3. Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Preferences
            </h4>
            <div className="space-y-2.5">
              <SettingsRow
                icon={<Moon className="w-4 h-4" />}
                label="Theme"
                value={preferences.theme}
                action={
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        preferences.theme === 'System'
                          ? 'Dark'
                          : preferences.theme === 'Dark'
                          ? 'Light'
                          : 'System';
                      setPreferences((p) => ({ ...p, theme: next }));
                      triggerToast(`Theme set to ${next}`);
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Switch
                  </button>
                }
              />
              <SettingsRow
                icon={<Globe className="w-4 h-4" />}
                label="Language"
                value={preferences.language}
              />
              <SettingsRow
                icon={<Bell className="w-4 h-4" />}
                label="Notifications"
                action={
                  <ToggleSwitch
                    checked={preferences.notifications}
                    onChange={(val) => {
                      setPreferences((p) => ({ ...p, notifications: val }));
                      triggerToast(val ? 'Notifications enabled' : 'Notifications muted');
                    }}
                  />
                }
              />
              <SettingsRow
                icon={<LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                label="Log Out"
                onClick={() => {
                  triggerToast('Logging out...');
                  setTimeout(onClose, 800);
                }}
              />
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="sticky bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center gap-3"
            >
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-[52px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[14px] font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 h-[52px] bg-blue-600 hover:bg-blue-500 text-white rounded-[14px] font-bold text-sm shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
