import React from 'react';
import { VaultProfile } from '../types';
import { Users, ChevronDown, Check, User } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: VaultProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onOpenManageProfiles: () => void;
  compact?: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenManageProfiles,
  compact = false,
}) => {
  const currentProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="relative inline-block text-left shrink-0">
      <button
        onClick={onOpenManageProfiles}
        className={`flex items-center gap-1.5 rounded-xl border transition-all cursor-pointer ${
          selectedProfileId === 'all'
            ? 'bg-blue-50/90 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/90'
            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700'
        } ${compact ? 'px-2 py-1 text-xs' : 'px-2.5 sm:px-3 py-1.5 text-xs font-semibold'}`}
        title="Switch Family Member / Entity Vault Profile"
      >
        {selectedProfileId === 'all' ? (
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-3 h-3" />
          </div>
        ) : currentProfile?.avatarUrl ? (
          <img
            src={currentProfile.avatarUrl}
            alt={currentProfile.name}
            className="w-5 h-5 rounded-lg object-cover ring-1 ring-blue-500/40 shrink-0"
          />
        ) : (
          <div
            className={`w-5 h-5 rounded-lg ${currentProfile?.avatarColor || 'bg-blue-600'} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
          >
            {currentProfile?.name.charAt(0) || 'P'}
          </div>
        )}

        <span className="font-bold truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[140px]">
          {selectedProfileId === 'all' ? 'All Family Vault' : currentProfile?.name || 'Vault Member'}
        </span>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
    </div>
  );
};
