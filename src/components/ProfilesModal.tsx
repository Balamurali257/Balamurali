import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  Sparkles,
  Heart,
  Briefcase,
  Baby,
  User,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { VaultProfile, DocumentItem } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ProfilesModalProps {
  profiles: VaultProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (newProfile: VaultProfile) => void;
  onUpdateProfile?: (updatedProfile: VaultProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  documents: DocumentItem[];
  onClose: () => void;
}

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  profiles = [],
  selectedProfileId,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
  documents = [],
  onClose,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<VaultProfile['relationship']>('Spouse');
  const [role, setRole] = useState<VaultProfile['role']>('Member');
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O Positive (O+)');
  const [allergiesText, setAllergiesText] = useState('');
  const [profileToDelete, setProfileToDelete] = useState<VaultProfile | null>(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const colorOptions = [
    { label: 'Blue', class: 'bg-blue-600' },
    { label: 'Purple', class: 'bg-purple-600' },
    { label: 'Amber', class: 'bg-amber-600' },
    { label: 'Emerald', class: 'bg-emerald-600' },
    { label: 'Rose', class: 'bg-rose-600' },
    { label: 'Indigo', class: 'bg-indigo-600' },
    { label: 'Slate', class: 'bg-slate-700' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: VaultProfile = {
      id: `prof_${Date.now()}`,
      name: name.trim(),
      relationship,
      role,
      avatarColor,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      allergies: allergiesText ? allergiesText.split(',').map((s) => s.trim()) : [],
    };

    onAddProfile(newProfile);
    setName('');
    setEmail('');
    setPhone('');
    setAllergiesText('');
    setShowAddForm(false);
  };

  const getRelationshipIcon = (rel: VaultProfile['relationship']) => {
    switch (rel) {
      case 'Self':
        return User;
      case 'Spouse':
        return Heart;
      case 'Child':
        return Baby;
      case 'Business Entity':
        return Briefcase;
      default:
        return Users;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Users className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Family & Member Profiles
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Switch profiles or manage details for family members.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 pb-10 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          {/* Quick Select "All Profiles" Pill */}
          <div
            onClick={() => {
              onSelectProfile('all');
              onClose();
            }}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedProfileId === 'all'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>All Family & Vault Documents</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Combined View
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {(documents || []).filter((d) => !d.isDeleted).length} Total Vault Documents Across All Members
                </div>
              </div>
            </div>
            {selectedProfileId === 'all' ? (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Individual Member Profiles Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Active Member Profile ({profiles.length})
              </span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Cancel' : '+ Add Profile'}</span>
              </button>
            </div>

            {/* Add Profile Form */}
            {showAddForm && (
              <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 mb-4 space-y-3.5 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Add New Member / Entity Profile</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Wright"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Relationship
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value as VaultProfile['relationship'])}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child / Dependent</option>
                      <option value="Parent">Parent</option>
                      <option value="Family Shared">Family Shared</option>
                      <option value="Business Entity">Business Entity</option>
                      <option value="Self">Self</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Vault Role & Access
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as VaultProfile['role'])}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Member">Member (Full Access)</option>
                      <option value="Dependent">Dependent (Medical & Education)</option>
                      <option value="Admin">Admin (Full Control)</option>
                      <option value="Guest">Guest (Read Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. O Positive (O+)"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Profile Badge Color
                  </label>
                  <div className="flex items-center space-x-2">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c.class}
                        onClick={() => setAvatarColor(c.class)}
                        className={`w-7 h-7 rounded-full ${c.class} ring-2 transition-all ${
                          avatarColor === c.class ? 'ring-blue-500 ring-offset-2 scale-110' : 'ring-transparent opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Save Member Profile
                  </button>
                </div>
              </form>
            )}

            {/* Profile List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((prof) => {
                const isSelected = selectedProfileId === prof.id;
                const RelIcon = getRelationshipIcon(prof.relationship);
                const profDocsCount = (documents || []).filter(
                  (d) => !d.isDeleted && d.ownerProfileId === prof.id
                ).length;

                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      onSelectProfile(prof.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative group flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/70 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {prof.avatarUrl ? (
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl ${prof.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}
                          >
                            {prof.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 truncate">
                            <span className="truncate">{prof.name}</span>
                            {prof.isPrimary && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 rounded shrink-0">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <RelIcon className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{prof.relationship} • {prof.role}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        !prof.isPrimary && onDeleteProfile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileToDelete(prof);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span><strong>{profDocsCount}</strong> Documents</span>
                      </span>

                      {prof.bloodGroup && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold text-[10px]">
                          {prof.bloodGroup}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Trust Client Side Profile Encryption</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Profile Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!profileToDelete}
        title="Delete Member Profile?"
        itemName={profileToDelete?.name}
        description={`Are you sure you want to remove the profile for "${profileToDelete?.name}" (${profileToDelete?.relationship})?`}
        warningText="Existing documents belonging to this profile will remain safely stored in the main vault."
        confirmText="Delete Profile"
        isPermanent={true}
        onConfirm={() => {
          if (profileToDelete && onDeleteProfile) {
            onDeleteProfile(profileToDelete.id);
            setProfileToDelete(null);
          }
        }}
        onClose={() => setProfileToDelete(null)}
      />
    </div>
  );
};
