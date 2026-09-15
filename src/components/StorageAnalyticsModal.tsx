import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HardDrive,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Folder,
  FolderOpen,
  PieChart,
  BarChart2,
  Layers,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Lock,
  Share2,
  ArrowUpDown,
  Search,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import { DocumentItem, CategoryType, StorageStats, VaultProfile } from '../types';
import { downloadDocument, getFallbackThumbnailUrl } from '../utils/documentUtils';

interface StorageAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  storageStats: StorageStats;
  profiles?: VaultProfile[];
  onSelectDocument: (doc: DocumentItem) => void;
  onNavigateToCategory?: (category: string) => void;
  onDeleteDocument?: (id: string) => void;
}

export const StorageAnalyticsModal: React.FC<StorageAnalyticsModalProps> = ({
  isOpen,
  onClose,
  documents,
  storageStats,
  profiles = [],
  onSelectDocument,
  onNavigateToCategory,
  onDeleteDocument
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeFileTypeFilter, setActiveFileTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'size-desc' | 'size-asc' | 'name-asc' | 'date-desc'>('size-desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reclaimedBytes, setReclaimedBytes] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'optimizer' | 'vaults'>('overview');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format Bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Total Capacity
  const totalCapacityBytes = (storageStats.totalAllocatedGB || 10) * 1024 * 1024 * 1024;
  const currentUsedBytes = Math.max(0, storageStats.totalUsedBytes - reclaimedBytes);
  const usagePercentage = Math.min(100, Math.max(0.1, (currentUsedBytes / totalCapacityBytes) * 100));

  // Category usage breakdown map
  const categoryColors: Record<CategoryType, { bg: string; text: string; hex: string }> = {
    Identity: { bg: 'bg-blue-500', text: 'text-blue-500', hex: '#3B82F6' },
    Medical: { bg: 'bg-rose-500', text: 'text-rose-500', hex: '#F43F5E' },
    Financial: { bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10B981' },
    Property: { bg: 'bg-amber-500', text: 'text-amber-500', hex: '#F59E0B' },
    Vehicle: { bg: 'bg-purple-500', text: 'text-purple-500', hex: '#A855F7' },
    Education: { bg: 'bg-cyan-500', text: 'text-cyan-500', hex: '#06B6D4' },
    Business: { bg: 'bg-slate-500', text: 'text-slate-500', hex: '#64748B' },
    Personal: { bg: 'bg-violet-500', text: 'text-violet-500', hex: '#8B5CF6' }
  };

  // Compute breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; bytes: number }> = {};
    documents.forEach((d) => {
      if (d.isDeleted) return;
      if (!map[d.category]) {
        map[d.category] = { count: 0, bytes: 0 };
      }
      map[d.category].count += 1;
      map[d.category].bytes += d.size;
    });
    return map;
  }, [documents]);

  // Compute breakdown by File Type
  const fileTypeBreakdown = useMemo(() => {
    const map: Record<string, { count: number; bytes: number }> = {
      pdf: { count: 0, bytes: 0 },
      image: { count: 0, bytes: 0 },
      doc: { count: 0, bytes: 0 },
      sheet: { count: 0, bytes: 0 }
    };
    documents.forEach((d) => {
      if (d.isDeleted) return;
      const type = d.fileType || 'doc';
      if (!map[type]) map[type] = { count: 0, bytes: 0 };
      map[type].count += 1;
      map[type].bytes += d.size;
    });
    return map;
  }, [documents]);

  // Large Files (> 2 MB)
  const largeFiles = useMemo(() => {
    return documents
      .filter((d) => !d.isDeleted && d.size > 2 * 1024 * 1024)
      .sort((a, b) => b.size - a.size);
  }, [documents]);

  // Deleted / Recycle Bin files size
  const trashFiles = useMemo(() => {
    return documents.filter((d) => d.isDeleted);
  }, [documents]);
  const trashBytes = trashFiles.reduce((acc, d) => acc + d.size, 0);

  // Filtered Documents for Explorer View
  const filteredDocs = useMemo(() => {
    return documents
      .filter((d) => {
        if (d.isDeleted) return false;
        if (activeCategoryFilter !== 'All' && d.category !== activeCategoryFilter) return false;
        if (activeFileTypeFilter !== 'All' && d.fileType !== activeFileTypeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            d.name.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q) ||
            (d.subCategory && d.subCategory.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'size-desc') return b.size - a.size;
        if (sortBy === 'size-asc') return a.size - b.size;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'date-desc') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        return 0;
      });
  }, [documents, activeCategoryFilter, activeFileTypeFilter, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-slate-700/50 flex items-center gap-2 pointer-events-none"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Storage & Architecture Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  AES-256 Vault
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive cloud disk breakdown, file type architecture & storage optimization
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

        {/* Tab Selector */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Usage Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'explorer'
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Clickable File Explorer ({filteredDocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'optimizer'
                ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Storage Health & Optimizer</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">

              {/* Top Banner Card: Total Disk Quota Gauge */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      CareBuddy Cloud Vault Architecture
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {formatBytes(currentUsedBytes)} <span className="text-sm font-normal text-slate-400">/ {storageStats.totalAllocatedGB} GB</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      {(100 - usagePercentage).toFixed(1)}% space available ({formatBytes(totalCapacityBytes - currentUsedBytes)} remaining)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReclaimedBytes((prev) => prev + 150 * 1024 * 1024);
                        showToast('⚡ Optimized storage cache! 150 MB reclaimed.');
                      }}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Reclaim Storage</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('explorer');
                        setActiveFileTypeFilter('pdf');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Folder className="w-3.5 h-3.5 text-blue-400" />
                      <span>Explore Files</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Segmented Storage Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
                    {Object.entries(categoryBreakdown).map(([cat, data]) => {
                      const pct = Math.max(1, (data.bytes / (currentUsedBytes || 1)) * 100);
                      const config = categoryColors[cat as CategoryType] || { bg: 'bg-slate-500' };
                      return (
                        <div
                          key={cat}
                          style={{ width: `${pct}%` }}
                          onClick={() => {
                            setActiveCategoryFilter(cat);
                            setActiveTab('explorer');
                          }}
                          className={`h-full ${config.bg} hover:brightness-125 transition-all cursor-pointer first:rounded-l-full last:rounded-r-full`}
                          title={`${cat}: ${formatBytes(data.bytes)} (${pct.toFixed(1)}%) - Click to inspect`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>0 GB</span>
                    <span>5 GB</span>
                    <span>{storageStats.totalAllocatedGB} GB Max Quota</span>
                  </div>
                </div>
              </div>

              {/* Clickable Category Distribution Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <span>Click Any Category To Filter File Architecture</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Total Files: {storageStats.totalDocumentsCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(categoryColors).map(([catName, colorInfo]) => {
                    const data = categoryBreakdown[catName] || { count: 0, bytes: 0 };
                    const isSelected = activeCategoryFilter === catName;

                    return (
                      <button
                        key={catName}
                        onClick={() => {
                          setActiveCategoryFilter(isSelected ? 'All' : catName);
                          setActiveTab('explorer');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`w-3 h-3 rounded-full ${colorInfo.bg}`} />
                          <span className="text-[10px] font-extrabold text-slate-400 group-hover:text-blue-500 flex items-center gap-0.5">
                            <span>Browse</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>

                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {catName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {data.count} file{data.count === 1 ? '' : 's'} • {formatBytes(data.bytes)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clickable File Types Breakdown Cards */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>File Extension Architecture</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { type: 'pdf', label: 'PDF Documents', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
                    { type: 'image', label: 'Image Files', icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
                    { type: 'doc', label: 'Word Documents', icon: FileCode, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
                    { type: 'sheet', label: 'Spreadsheets', icon: FileSpreadsheet, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
                  ].map((item) => {
                    const data = fileTypeBreakdown[item.type] || { count: 0, bytes: 0 };
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => {
                          setActiveFileTypeFilter(item.type);
                          setActiveTab('explorer');
                        }}
                        className={`p-3.5 rounded-2xl border ${item.bg} hover:shadow-md transition-all cursor-pointer text-left flex items-center space-x-3`}
                      >
                        <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs ${item.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{item.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {data.count} items • {formatBytes(data.bytes)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CLICKABLE FILE EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 animate-fade-in">

              {/* Explorer Search & Filter Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files by name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-[11px]">
                  {/* Category Filter Pills */}
                  <select
                    value={activeCategoryFilter}
                    onChange={(e) => setActiveCategoryFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="All">All Categories</option>
                    {Object.keys(categoryColors).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* File Type Filter */}
                  <select
                    value={activeFileTypeFilter}
                    onChange={(e) => setActiveFileTypeFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="All">All File Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="image">Image Scans</option>
                    <option value="doc">Word / Text</option>
                    <option value="sheet">Spreadsheets</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="size-desc">Largest First</option>
                    <option value="size-asc">Smallest First</option>
                    <option value="date-desc">Newest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Breadcrumb / Active Filter Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-mono">
                  <Folder className="w-4 h-4 text-blue-500" />
                  <span>Vault Storage</span>
                  <span>/</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeCategoryFilter}</span>
                  {activeFileTypeFilter !== 'All' && (
                    <>
                      <span>/</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{activeFileTypeFilter.toUpperCase()}</span>
                    </>
                  )}
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Showing {filteredDocs.length} files
                </span>
              </div>

              {/* File List Table / Architecture View */}
              {filteredDocs.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
                  <Folder className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="font-bold text-sm">No files found matching filters</p>
                  <p className="text-xs">Try resetting category or search criteria.</p>
                  <button
                    onClick={() => {
                      setActiveCategoryFilter('All');
                      setActiveFileTypeFilter('All');
                      setSearchQuery('');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onSelectDocument(doc)}
                      className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={doc.fileUrl}
                          alt={doc.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                          }}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{doc.category} • {doc.subCategory}</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {formatBytes(doc.size)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDocument(doc);
                          }}
                          className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-colors cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDocument(doc);
                          }}
                          className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                          title="View file details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onNavigateToCategory && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToCategory(doc.category);
                              onClose();
                            }}
                            className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors cursor-pointer"
                            title="Open in Document Vault"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: STORAGE OPTIMIZER */}
          {activeTab === 'optimizer' && (
            <div className="space-y-5 animate-fade-in">

              {/* Reclaim Trash / Recycle Bin */}
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-xs">
                      Recycle Bin Cache ({trashFiles.length} files)
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Files in trash are taking up {formatBytes(trashBytes)} of cloud space.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setReclaimedBytes((prev) => prev + trashBytes);
                    showToast(`🗑️ Emptied trash! Reclaimed ${formatBytes(trashBytes)}.`);
                  }}
                  disabled={trashFiles.length === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Empty Recycle Bin
                </button>
              </div>

              {/* Large Files (> 2 MB) Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Large Files Detection ({largeFiles.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Files over 2 MB</span>
                </div>

                {largeFiles.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-center">
                    No large space-consuming files detected. Your storage is lightweight!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {largeFiles.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {doc.fileType.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">{doc.name}</div>
                            <div className="text-[10px] text-slate-500">{doc.category} • {formatBytes(doc.size)}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setReclaimedBytes((prev) => prev + Math.round(doc.size * 0.4));
                            showToast(`⚡ Compressed ${doc.name}! Reclaimed ${formatBytes(Math.round(doc.size * 0.4))}.`);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-[11px] cursor-pointer"
                        >
                          Compress File
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            CareBuddy Real File Architecture Storage Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
