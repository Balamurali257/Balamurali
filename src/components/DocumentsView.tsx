import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tilt3DCard } from './Tilt3DCard';
import {
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Table as TableIcon,
  LayoutGrid,
  Clock,
  Star,
  Trash2,
  Lock,
  Eye,
  Download,
  Share2,
  Sparkles,
  FileText,
  Tag,
  ShieldCheck,
  RotateCcw,
  History,
  Calendar,
  CheckCircle,
  MoreVertical,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Kanban as KanbanIcon,
  ArrowUpDown,
  SlidersHorizontal,
  Layers,
  Folder,
  Upload
} from 'lucide-react';
import { DocumentItem, CategoryType } from '../types';
import { downloadDocument, getFallbackThumbnailUrl } from '../utils/documentUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export type ViewMode = 'grid' | 'list' | 'table' | 'kanban' | 'timeline' | 'gallery';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onRestoreDocument: (id: string) => void;
  onOpenUpload: () => void;
  onOpenPhotoScanner?: () => void;
  initialCategory?: string;
  highlightedDocId?: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents = [],
  onSelectDocument,
  onToggleFavorite,
  onDeleteDocument,
  onRestoreDocument,
  onOpenUpload,
  onOpenPhotoScanner,
  initialCategory = 'All',
  highlightedDocId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  
  // Persisted or default View Mode (Grid, List, Table, Kanban, Timeline, Gallery)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('vault_docs_view_mode') as ViewMode) || 'grid';
  });

  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'expiry' | 'category'>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'expiring' | 'trash'>('all');
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('vault_docs_view_mode', mode);
  };

  // Keep selectedCategory in sync if initialCategory prop changes
  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const categories = ['All', 'Identity', 'Medical', 'Financial', 'Property', 'Vehicle', 'Education', 'Business', 'Personal'];

  // Filtering Logic
  const filteredDocs = (documents || []).filter((doc) => {
    if (!doc) return false;
    // Trash filter
    if (filterMode === 'trash') {
      return doc.isDeleted;
    }
    if (doc.isDeleted) return false;

    // Smart collection filter
    if (filterMode === 'favorites' && !doc.isFavorite) return false;
    if (filterMode === 'expiring' && (!doc.expiryDate || new Date(doc.expiryDate) > new Date('2028-01-01'))) return false;

    // Category filter
    if (selectedCategory !== 'All' && doc.category !== selectedCategory) return false;

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name?.toLowerCase().includes(q);
      const matchCategory = doc.category?.toLowerCase().includes(q);
      const matchSub = doc.subCategory?.toLowerCase().includes(q);
      const matchTags = (doc.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchOcr = doc.ocrText?.toLowerCase().includes(q);
      return matchName || matchCategory || matchSub || matchTags || matchOcr;
    }

    return true;
  });

  // Sorting Logic
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    if (sortBy === 'expiry') {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-32 md:pb-8 max-w-full overflow-hidden">
      {/* Top Header & Search Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Documents Vault</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {sortedDocs.length} items
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Encrypted personal document store with AI metadata, 6 layout view modes, and zero-knowledge sharing.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Collection Filters, Search Bar & Multi-View Switcher Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5 max-w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Smart View Tabs */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Files
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'favorites'
                  ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 shrink-0" />
              <span>Favorites</span>
            </button>
            <button
              onClick={() => setFilterMode('expiring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'expiring'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Expiring Soon</span>
            </button>
            <button
              onClick={() => setFilterMode('trash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'trash'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Recycle Bin</span>
            </button>
            {filterMode === 'trash' && sortedDocs.length > 0 && (
              <button
                onClick={() => setShowEmptyTrashConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-1"
                title="Empty all items in Recycle Bin"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Bin</span>
              </button>
            )}
          </div>

          {/* Controls: Search, Sort & Multi-View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search OCR, tags, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="date-desc" className="dark:bg-slate-800">Newest First</option>
                <option value="date-asc" className="dark:bg-slate-800">Oldest First</option>
                <option value="name-asc" className="dark:bg-slate-800">Name (A-Z)</option>
                <option value="name-desc" className="dark:bg-slate-800">Name (Z-A)</option>
                <option value="expiry" className="dark:bg-slate-800">Expiring Soonest</option>
                <option value="category" className="dark:bg-slate-800">Category</option>
              </select>
            </div>

            {/* 6 Multi-View Options Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleSetViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">Grid</span>
              </button>

              <button
                onClick={() => handleSetViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Detailed List View"
              >
                <ListIcon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">List</span>
              </button>

              <button
                onClick={() => handleSetViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Compact Table View"
              >
                <TableIcon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">Table</span>
              </button>

              <button
                onClick={() => handleSetViewMode('kanban')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Category Kanban Board"
              >
                <KanbanIcon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">Kanban</span>
              </button>

              <button
                onClick={() => handleSetViewMode('timeline')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Chronological Timeline View"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">Timeline</span>
              </button>

              <button
                onClick={() => handleSetViewMode('gallery')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'gallery'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Gallery Cover Showcase"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold hidden xl:inline">Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Slider with See All Toggle */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
            <span>DOCUMENT CATEGORIES</span>
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 transition-colors"
              title={showAllCategories ? "Collapse categories" : "Expand all categories"}
            >
              <span>{showAllCategories ? 'Show Less' : 'See All'}</span>
              {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAllCategories ? (
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-all">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 pt-0.5 scrollbar-thin scrollbar-thumb-blue-500/40 scrollbar-track-slate-100 dark:scrollbar-track-slate-800/80 rounded-xl px-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Multi-View Outputs */}
      {sortedDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No documents found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search filters, category selection, or upload a new document to your vault.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 1. GRID CARDS VIEW */
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {sortedDocs.map((doc) => (
            <Tilt3DCard
              key={doc.id}
              intensity={12}
              glowColor="rgba(59, 130, 246, 0.18)"
              className="h-full"
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-xs flex flex-col overflow-hidden group min-w-0 h-full justify-between">
                {/* Image / Thumbnail Header */}
                <div
                  onClick={() => onSelectDocument(doc)}
                  className="relative h-20 xs:h-24 sm:h-28 md:h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden cursor-pointer shrink-0"
                >
                  <img
                    src={doc.fileUrl}
                    alt={doc.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Top badges */}
                  <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold truncate max-w-[70px] sm:max-w-none">
                      {doc.category}
                    </span>
                    {doc.encrypted && (
                      <span className="hidden sm:flex px-1.5 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold items-center gap-1">
                        <Lock className="w-2.5 h-2.5 shrink-0" />
                        <span>AES-256</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(doc.id);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 p-1 sm:p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${doc.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between text-white">
                    <span className="text-[10px] sm:text-xs font-bold truncate max-w-[75%]">{doc.subCategory}</span>
                    <span className="text-[9px] sm:text-[10px] opacity-80">v{doc.version}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3
                      onClick={() => onSelectDocument(doc)}
                      className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    >
                      {doc.name}
                    </h3>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {doc.aiSummary || doc.notes || 'No notes attached.'}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {doc.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                      {new Date(doc.uploadDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </span>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDocument(doc);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
                        title="Download Document File"
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      </button>

                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Inspect Document & AI Summary"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      </button>

                      {doc.isDeleted ? (
                        <>
                          <button
                            onClick={() => onRestoreDocument(doc.id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Restore from Recycle Bin"
                          >
                            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          </button>
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Permanently Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        /* 2. DETAILED LIST VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs w-full max-w-full">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {sortedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer min-w-0"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <img
                    src={doc.fileUrl}
                    alt=""
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                    }}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                        {doc.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                        {doc.category}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{doc.subCategory}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                      {doc.expiryDate && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Expires {doc.expiryDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs cursor-pointer active:scale-95"
                    title="Inspect Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                  <button
                    onClick={() => setDocToDelete(doc)}
                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl font-semibold transition-colors cursor-pointer active:scale-95"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* 3. COMPACT DATA TABLE VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs w-full max-w-full">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Document Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Encryption</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80 text-xs">
                {sortedDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    <td className="p-3 pl-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={doc.fileUrl}
                          alt=""
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                          }}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold">{doc.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{doc.subCategory}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px]">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>AES-256</span>
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap text-[11px]">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap text-[11px]">{doc.expiryDate || 'N/A'}</td>
                    <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-500 transition-colors flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Get</span>
                        </button>
                        <button
                          onClick={() => onSelectDocument(doc)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[11px] shrink-0 cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* 4. KANBAN CATEGORY BOARD VIEW */
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-max">
            {categories.filter(c => c !== 'All').map((catName) => {
              const catDocs = sortedDocs.filter((d) => d.category === catName);
              return (
                <div
                  key={catName}
                  className="w-72 bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 min-h-[420px]"
                >
                  <div>
                    {/* Kanban Category Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{catName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                        {catDocs.length}
                      </span>
                    </div>

                    {/* Column Items */}
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                      {catDocs.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          No {catName.toLowerCase()} files
                        </div>
                      ) : (
                        catDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => onSelectDocument(doc)}
                            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer shadow-2xs group"
                          >
                            <div className="flex items-center space-x-2.5 mb-2">
                              <img
                                src={doc.fileUrl}
                                alt=""
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                                }}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-700"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600">{doc.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{doc.subCategory}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadDocument(doc);
                                }}
                                className="p-1 hover:text-blue-600 transition-colors"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onOpenUpload}
                    className="mt-3 w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload {catName}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'gallery' ? (
        /* 5. GALLERY COVER SHOWCASE VIEW */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sortedDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative h-44 sm:h-52 bg-slate-900 overflow-hidden">
                <img
                  src={doc.fileUrl}
                  alt={doc.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                  }}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-extrabold">
                    {doc.category}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">{doc.subCategory}</div>
                  <h3 className="text-sm font-extrabold text-white truncate mt-0.5">{doc.name}</h3>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {new Date(doc.uploadDate).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-2xs"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300"
                    title="Inspect"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 6. CHRONOLOGICAL TIMELINE VIEW */
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 pl-8">
          {sortedDocs.map((doc) => (
            <div key={doc.id} className="relative group">
              <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900"></div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {new Date(doc.uploadDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3
                    onClick={() => onSelectDocument(doc)}
                    className="text-base font-bold text-slate-900 dark:text-white cursor-pointer hover:underline mt-0.5"
                  >
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doc.aiSummary}</p>
                </div>
                <button
                  onClick={() => onSelectDocument(doc)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Inspect Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!docToDelete}
        title={docToDelete?.isDeleted ? 'Permanently Delete Document?' : 'Move to Recycle Bin?'}
        itemName={docToDelete?.name}
        description={
          docToDelete?.isDeleted
            ? `Are you sure you want to permanently delete "${docToDelete?.name}" from your vault?`
            : `Are you sure you want to move "${docToDelete?.name}" to the Recycle Bin?`
        }
        warningText={
          docToDelete?.isDeleted
            ? 'This action is permanent and cannot be undone.'
            : 'You can restore this document anytime from the Recycle Bin filter.'
        }
        confirmText={docToDelete?.isDeleted ? 'Permanently Delete' : 'Move to Trash'}
        isPermanent={docToDelete?.isDeleted}
        onConfirm={() => {
          if (docToDelete) {
            onDeleteDocument(docToDelete.id);
            setDocToDelete(null);
          }
        }}
        onClose={() => setDocToDelete(null)}
      />

      {/* Empty Trash Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showEmptyTrashConfirm}
        title="Empty Recycle Bin?"
        description={`Are you sure you want to permanently delete all ${filteredDocs.length} document(s) in the Recycle Bin?`}
        warningText="All documents in the recycle bin will be permanently purged. This action cannot be undone."
        confirmText="Empty Recycle Bin"
        isPermanent={true}
        onConfirm={() => {
          filteredDocs.forEach((doc) => onDeleteDocument(doc.id));
          setShowEmptyTrashConfirm(false);
        }}
        onClose={() => setShowEmptyTrashConfirm(false)}
      />
    </div>
  );
};
