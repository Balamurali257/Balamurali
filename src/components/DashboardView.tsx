import React from 'react';
import { motion } from 'motion/react';
import { Tilt3DCard } from './Tilt3DCard';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Lock,
  Upload,
  ArrowRight,
  Eye,
  Download,
  Share2,
  Tag,
  Clock,
  HeartPulse,
  CheckCircle2,
  HardDrive,
  Grid,
  Bell,
  Sliders,
  FolderLock
} from 'lucide-react';
import { DocumentItem, UserProfile, ReminderItem, StorageStats } from '../types';
import { downloadDocument, getFallbackThumbnailUrl } from '../utils/documentUtils';

interface DashboardViewProps {
  user: UserProfile;
  documents: DocumentItem[];
  reminders: ReminderItem[];
  storageStats?: StorageStats;
  onNavigate: (view: string) => void;
  onSelectDocument: (doc: DocumentItem) => void;
  onQuickUpload: () => void;
  onOpenPhotoScanner?: () => void;
  onOpenStorageAnalytics?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  documents,
  reminders,
  onNavigate,
  onSelectDocument,
  onQuickUpload,
  onOpenPhotoScanner,
}) => {
  // Filter expiring documents within 365 days
  const expiringDocs = documents.filter((d) => d.expiryDate && !d.isDeleted);
  const favoriteDocs = documents.filter((d) => d.isFavorite && !d.isDeleted);
  const activeReminders = reminders.filter((r) => !r.completed);

  return (
    <div className="space-y-6 pb-32 md:pb-8 max-w-full overflow-hidden">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-4 sm:p-6 shadow-md border border-slate-800/80">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white flex items-center gap-1.5 truncate">
              <span>Welcome back, {user.name} 👋</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Your personal documents and family files are organized and protected in your vault.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Tilt3DCard
          intensity={12}
          glowColor="rgba(59, 130, 246, 0.2)"
          onClick={() => onNavigate('documents')}
          className="cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex items-center space-x-3 text-left w-full h-full group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">{documents.filter(d=>!d.isDeleted).length}</div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Vault Files</div>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          intensity={12}
          glowColor="rgba(16, 185, 129, 0.2)"
          onClick={() => onNavigate('settings')}
          className="cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-200 flex items-center space-x-3 text-left w-full h-full group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">AES-256</div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Hardware Encrypted</div>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          intensity={12}
          glowColor="rgba(245, 158, 11, 0.2)"
          onClick={() => onNavigate('reminders')}
          className="cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-amber-500 dark:hover:border-amber-400 transition-all duration-200 flex items-center space-x-3 text-left w-full h-full group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">{expiringDocs.length}</div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Expiring Documents</div>
            </div>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          intensity={12}
          glowColor="rgba(99, 102, 241, 0.2)"
          onClick={() => onNavigate('emergency')}
          className="cursor-pointer"
        >
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-200 flex items-center space-x-3 text-left w-full h-full group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">Active</div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Emergency Medical Card</div>
            </div>
          </div>
        </Tilt3DCard>
      </div>

      {/* Vault Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-500" />
              <span>Document Categories</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Browse your documents organized by category</p>
          </div>
          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/80 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Identity', count: documents.filter(d=>d.category==='Identity'&&!d.isDeleted).length, color: 'from-blue-500 to-indigo-600' },
            { label: 'Medical', count: documents.filter(d=>d.category==='Medical'&&!d.isDeleted).length, color: 'from-rose-500 to-pink-600' },
            { label: 'Financial', count: documents.filter(d=>d.category==='Financial'&&!d.isDeleted).length, color: 'from-emerald-500 to-teal-600' },
            { label: 'Property', count: documents.filter(d=>d.category==='Property'&&!d.isDeleted).length, color: 'from-amber-500 to-orange-600' },
            { label: 'Vehicle', count: documents.filter(d=>d.category==='Vehicle'&&!d.isDeleted).length, color: 'from-purple-500 to-indigo-600' },
            { label: 'Education', count: documents.filter(d=>d.category==='Education'&&!d.isDeleted).length, color: 'from-cyan-500 to-blue-600' },
            { label: 'Business', count: documents.filter(d=>d.category==='Business'&&!d.isDeleted).length, color: 'from-slate-600 to-slate-800' },
            { label: 'Personal', count: documents.filter(d=>d.category==='Personal'&&!d.isDeleted).length, color: 'from-violet-500 to-fuchsia-600' },
          ].map((cat) => (
            <Tilt3DCard
              key={cat.label}
              intensity={14}
              glowColor="rgba(59, 130, 246, 0.15)"
              onClick={() => onNavigate('documents')}
              className="cursor-pointer"
            >
              <div className="group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between h-full shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center text-sm font-bold shadow-xs group-hover:scale-110 transition-transform duration-200`}>
                    {cat.label[0]}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-full">
                    {cat.count} files
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click to view {cat.label.toLowerCase()} documents
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          ))}
        </div>
      </div>

      {/* Pinned & Favorite Documents */}
      {favoriteDocs.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Pinned & Favorite Documents</span>
            </h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>View All Vault Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favoriteDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between space-x-3 group"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <img
                    src={doc.fileUrl}
                    alt={doc.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{doc.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{doc.subCategory}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>Vault Protected</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument(doc);
                  }}
                  className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors shrink-0"
                  title="Download document file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Tools Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Medical Card Widget */}
        <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 text-white rounded-2xl p-5 border border-rose-800/60 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">Emergency Medical Card</span>
              </div>
              <span className="text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-full shrink-0">
                Paramedic Ready
              </span>
            </div>

            <div className="space-y-2.5 bg-black/30 p-3 rounded-xl border border-white/10 backdrop-blur-xs text-xs">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Patient Name:</span>
                <span className="font-bold text-white truncate max-w-[150px] text-right">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-extrabold text-rose-400 text-xs sm:text-sm">{user.bloodGroup}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Key Allergies:</span>
                <span className="font-semibold text-amber-300 truncate max-w-[150px] text-right">{user.medicalProfile.allergies.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-semibold text-white truncate max-w-[150px] text-right">{user.emergencyContact.phone}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('emergency')}
            className="mt-4 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          >
            <HeartPulse className="w-4 h-4 shrink-0" />
            <span>Launch Emergency Medical Card</span>
          </button>
        </div>

        {/* Quick Upload Document Widget */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-blue-800/60 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">Upload New Document</h4>
                <p className="text-[10px] text-blue-300">File Browser & Quick Presets</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Securely encrypt and store your certificates, passport scans, medical records, invoices, or vehicle papers with client-side AES-256 vault protection.
            </p>
          </div>

          <button
            onClick={onQuickUpload}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Upload Document Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
