import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Sparkles,
  FileText,
  Share2,
  Download,
  History,
  ShieldCheck,
  Tag,
  Calendar,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  User,
  Clock,
  HardDrive,
  CheckCircle2,
  Edit3,
  Trash2,
  Shield,
  HeartPulse,
  Car,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { DocumentItem, SharedLink } from '../types';
import { downloadDocument, getFallbackThumbnailUrl } from '../utils/documentUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ShareDialogModal } from './ShareDialogModal';
import { ShareAnalyticsModal } from './ShareAnalyticsModal';

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onUpdateDocument: (doc: DocumentItem) => void;
  onDeleteDocument?: (id: string) => void;
  onAskAIAboutDoc?: (doc: DocumentItem) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document: doc,
  onClose,
  onUpdateDocument,
  onDeleteDocument,
  onAskAIAboutDoc,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ocr' | 'share' | 'history'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareAnalyticsId, setSelectedShareAnalyticsId] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState<number>(100);
  const [shareConfig, setShareConfig] = useState({
    expiryHours: 24,
    oneTime: true,
    watermark: 'CONFIDENTIAL - VAULT SHARE',
    password: '',
  });

  const [notesInput, setNotesInput] = useState<string>(doc?.notes || '');
  const [tagsInput, setTagsInput] = useState<string>((doc?.tags || []).join(', '));
  const [nameInput, setNameInput] = useState<string>(doc?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (doc) {
      setNotesInput(doc.notes || '');
      setTagsInput((doc.tags || []).join(', '));
      setNameInput(doc.name || '');
    }
  }, [doc]);

  // Lock body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!doc) return null;

  const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 86400000);

  const handleSaveNotesAndTags = () => {
    const updatedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedDoc: DocumentItem = {
      ...doc,
      name: nameInput.trim() || doc.name,
      notes: notesInput,
      tags: updatedTags,
    };

    onUpdateDocument(updatedDoc);
    setIsSaved(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleGenerateShare = () => {
    const newLink: SharedLink = {
      id: `link_${Date.now()}`,
      token: `TOKEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + shareConfig.expiryHours * 3600 * 1000).toISOString(),
      maxUses: shareConfig.oneTime ? 1 : 10,
      usesCount: 0,
      isOneTime: shareConfig.oneTime,
      watermarkText: shareConfig.watermark,
      passwordProtected: !!shareConfig.password,
    };

    const updatedDoc = {
      ...doc,
      sharedLinks: [...(doc.sharedLinks || []), newLink],
    };

    onUpdateDocument(updatedDoc);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 shrink-0 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md shrink-0">
                {doc.category[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate min-w-0">{doc.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>AES-256</span>
                  </span>
                  {isExpiringSoon && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Expires Soon</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Category: <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.category}</span> ({doc.subCategory}) • Added {new Date(doc.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 ml-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Create Production Secure Share Link"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Share Link</span>
              </button>
              <button
                onClick={() => downloadDocument(doc)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Download</span>
              </button>
              {onDeleteDocument && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                  title="Move document to Recycle Bin"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Document Image & Details
            </button>
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ocr'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Full Extracted Text</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Secure Share Link</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log & Versions</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 pb-10 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Document Preview Image Card */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                    <span>Document Image Preview</span>
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand Image</span>
                    </button>
                  </div>

                  <div
                    onClick={() => setIsLightboxOpen(true)}
                    className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[220px] max-h-[360px] sm:h-80 flex items-center justify-center group cursor-pointer p-2 shadow-inner"
                  >
                    {doc.fileUrl && doc.fileUrl.startsWith('data:application/pdf') ? (
                      <iframe
                        src={doc.fileUrl}
                        title={doc.name}
                        className="w-full h-full min-h-[260px] rounded-xl border-0"
                      />
                    ) : (
                      <>
                        <img
                          src={doc.fileUrl}
                          alt={doc.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                          }}
                          className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-102"
                        />

                        {/* Image Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                          <div className="bg-slate-900/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-xs border border-slate-700">
                            <Maximize2 className="w-4 h-4 text-blue-400" />
                            <span>Click to View Full Screen</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Format: <strong className="text-slate-800 dark:text-slate-200 uppercase">{doc.fileType}</strong></span>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>

                {/* Right Side: Neatly Structured Details */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Basic Metadata Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2.5">
                      Key Information & Parameters
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Category</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{doc.category}</div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Sub-Category</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{doc.subCategory}</div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Upload Date</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{new Date(doc.uploadDate).toLocaleDateString()}</div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Expiry Date</div>
                        <div className={`text-xs font-bold mt-0.5 ${doc.expiryDate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                          {doc.expiryDate || 'No Expiration'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Summary Box */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80 space-y-1.5 shadow-xs">
                    <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Document Summary</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {doc.aiSummary || 'Document processed and indexed into secure vault.'}
                    </p>
                  </div>

                  {/* Extracted Attributes Grid */}
                  {doc.extractedMetadata && Object.keys(doc.extractedMetadata).length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Extracted Attributes & Indexed Metadata
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(doc.extractedMetadata).map(([key, val]) => (
                          <div key={key} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <div className="text-slate-400 font-medium text-[10px]">{key}</div>
                            <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags & Notes / Editing Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isEditing ? 'Editing Document Details' : 'Tags & Notes'}</span>
                      </h4>
                      
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setNameInput(doc.name);
                              setNotesInput(doc.notes || '');
                              setTagsInput((doc.tags || []).join(', '));
                              setIsEditing(false);
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveNotesAndTags}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isSaved && (
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Document details updated successfully!</span>
                      </div>
                    )}

                    {!isEditing ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Document Tags
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(doc.tags && doc.tags.length > 0 ? doc.tags : [doc.category]).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Notes & Annotations
                          </div>
                          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed min-h-[44px]">
                            {doc.notes ? (
                              <p className="whitespace-pre-wrap">{doc.notes}</p>
                            ) : (
                              <span className="text-slate-400 italic">No custom notes attached. Click "Edit Details" to add notes.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Document Title
                          </label>
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Document name"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>Tags (Comma-separated)</span>
                          </label>
                          <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="e.g. Identity, Important, Tax2026"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Custom Notes & Annotations</span>
                          </label>
                          <textarea
                            rows={3}
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Type personal notes or record numbers..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'ocr' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/80">
                  <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200 font-bold text-sm mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>OCR Document Text Extraction</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Text extracted from document image using optical character recognition. All text is indexed for encrypted full-text search.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Full OCR Text Stream
                  </h4>
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto leading-relaxed border border-slate-200 dark:border-slate-800 select-all">
                    {doc.ocrText || 'No OCR text available for this file type.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'share' && (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 dark:from-amber-950/30 dark:via-blue-950/30 dark:to-purple-950/30 rounded-2xl border border-amber-300/40 dark:border-amber-800/40 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Share via Temporary Encrypted Link</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase">Time-Limited</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Generate encrypted temporary links with granular access controls, custom watermark, and auto-revocation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Share Configuration Controls */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Security & Expiration Rules</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Expiration Duration</label>
                          <select
                            value={shareConfig.expiryHours}
                            onChange={(e) => setShareConfig({ ...shareConfig, expiryHours: Number(e.target.value) })}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value={1}>1 Hour (Emergency Single Access)</option>
                            <option value={6}>6 Hours (Doctor Visit Window)</option>
                            <option value={12}>12 Hours (Half Day Access)</option>
                            <option value={24}>24 Hours (1 Day Default)</option>
                            <option value={72}>72 Hours (3 Days)</option>
                            <option value={168}>7 Days (1 Week Max)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">Access Passcode (Optional)</label>
                          <input
                            type="password"
                            placeholder="Set optional 4-digit PIN"
                            value={shareConfig.password}
                            onChange={(e) => setShareConfig({ ...shareConfig, password: e.target.value })}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 text-xs">
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          <input
                            type="checkbox"
                            id="oneTimeCheck"
                            checked={shareConfig.oneTime}
                            onChange={(e) => setShareConfig({ ...shareConfig, oneTime: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="oneTimeCheck" className="text-slate-800 dark:text-slate-200 font-bold cursor-pointer text-xs">
                            One-time Burn After Open (Auto-invalidates link after 1 view)
                          </label>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            Security Watermark Text
                          </label>
                          <input
                            type="text"
                            value={shareConfig.watermark}
                            onChange={(e) => setShareConfig({ ...shareConfig, watermark: e.target.value })}
                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="e.g. CONFIDENTIAL - FOR MEDICAL USE ONLY"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleGenerateShare}
                          className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Share2 className="w-4 h-4" />}
                          <span>{copiedLink ? 'Share Link Copied to Clipboard!' : 'Generate Secure Share Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Shared Links List */}
                    {doc.sharedLinks && doc.sharedLinks.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Active Share Links ({doc.sharedLinks.length})
                        </h4>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {doc.sharedLinks.map((link) => (
                            <div key={link.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                              <div className="min-w-0 font-mono text-[11px]">
                                <span className="font-bold text-amber-600 dark:text-amber-400">{link.token}</span>
                                <span className="text-slate-400 ml-2">Expires: {new Date(link.expiresAt).toLocaleTimeString()}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const url = `https://carebuddy.hub/share/${link.token}`;
                                  navigator.clipboard.writeText(url);
                                  setCopiedLink(true);
                                  setTimeout(() => setCopiedLink(false), 2000);
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generated Link Access Card Display */}
                  <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border-2 border-amber-500/40 text-center flex flex-col items-center justify-center shadow-xl space-y-4">
                    <div className="text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Encrypted Access Pass</span>
                    </div>

                    <div className="w-full bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-left space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Share Destination</div>
                      <div className="text-white font-bold text-xs truncate">{doc.name}</div>
                      <div className="text-[11px] text-amber-300 font-mono">
                        Valid for {shareConfig.expiryHours} {shareConfig.expiryHours === 1 ? 'Hour' : 'Hours'} • {shareConfig.oneTime ? 'Burn on Read' : 'Multi-use'}
                      </div>
                      <div className="pt-2">
                        <input
                          type="text"
                          readOnly
                          value={`https://carebuddy.hub/share/${doc.id}?expiry=${shareConfig.expiryHours}h`}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-300 select-all"
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <button
                        onClick={() => {
                          const url = `https://carebuddy.hub/share/${doc.id}?expiry=${shareConfig.expiryHours}h`;
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Document Revision History</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl p-2 bg-slate-50 dark:bg-slate-800">
                    {(doc.versions || [{ version: 1, date: doc.uploadDate, size: doc.size, note: 'Initial upload' }]).map((v) => (
                      <div key={v.version} className="py-3 px-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Version {v.version}</div>
                          <div className="text-slate-500">{v.note} • {new Date(v.date).toLocaleString()}</div>
                        </div>
                        <span className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg font-semibold border">
                          {(v.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero-Trust Access & Inspection Trail</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 space-y-2 text-xs max-h-48 overflow-y-auto">
                    {(doc.accessLogs || []).map((log) => (
                      <div key={log.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{log.action}</div>
                          <div className="text-[10px] text-slate-400">{log.user} • IP: {log.ip} • Device: {log.device}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for High-Resolution Document Photo Inspection */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex flex-col p-3 sm:p-6 h-screen w-screen overflow-hidden animate-fade-in"
        >
          {/* Top Control Bar with Info, Download & Close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shrink-0 shadow-xl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-[11px] rounded-lg uppercase tracking-wider shrink-0">
                {doc.category}
              </span>
              <h3 className="text-white font-bold text-xs sm:text-sm truncate">{doc.name}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => downloadDocument(doc)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={() => setIsLightboxOpen(false)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                title="Close image view"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Centered Fitted Image Display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 my-2"
          >
            <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800 shadow-2xl p-2">
              {doc.fileUrl && doc.fileUrl.startsWith('data:application/pdf') ? (
                <iframe
                  src={doc.fileUrl}
                  title={doc.name}
                  className="w-full h-[calc(100vh-140px)] rounded-xl border-0"
                />
              ) : (
                <img
                  src={doc.fileUrl}
                  alt={doc.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = getFallbackThumbnailUrl(doc.name, doc.category);
                  }}
                  className="max-h-[calc(100vh-140px)] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        title={doc.isDeleted ? 'Permanently Delete Document?' : 'Move to Recycle Bin?'}
        itemName={doc.name}
        description={`Are you sure you want to ${doc.isDeleted ? 'permanently delete' : 'move'} "${doc.name}" ${doc.isDeleted ? 'from your vault' : 'to the Recycle Bin'}?`}
        warningText={doc.isDeleted ? 'This action is irreversible and the document data will be purged.' : 'You can restore this document anytime from the Recycle Bin filter.'}
        confirmText={doc.isDeleted ? 'Permanently Delete' : 'Move to Trash'}
        isPermanent={doc.isDeleted}
        onConfirm={() => {
          if (onDeleteDocument) {
            onDeleteDocument(doc.id);
            onClose();
          }
        }}
        onClose={() => setShowDeleteConfirm(false)}
      />

      {/* Production Secure QR Sharing Modal */}
      {showShareModal && (
        <ShareDialogModal
          document={doc}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Share Link Analytics & Security Audit Modal */}
      {selectedShareAnalyticsId && (
        <ShareAnalyticsModal
          shareId={selectedShareAnalyticsId}
          onClose={() => setSelectedShareAnalyticsId(null)}
        />
      )}
    </>
  );
};
