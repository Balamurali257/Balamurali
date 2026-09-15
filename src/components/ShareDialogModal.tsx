import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Shield,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Calendar,
  Key,
  Smartphone,
  Mail,
  Sparkles,
  Share2,
  FileText,
  AlertCircle,
  Clock,
  Send,
  MessageCircle,
  Globe,
  Settings,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Flame,
  UserCheck
} from 'lucide-react';
import { DocumentItem, SecureShare } from '../types';
import {
  createShareForDocument,
  buildShareUrl,
  loadShares,
  revokeShareLink
} from '../utils/shareStore';

interface ShareDialogModalProps {
  document: DocumentItem | null;
  ownerName?: string;
  onClose: () => void;
  onOpenAnalytics?: (shareId: string) => void;
}

export const ShareDialogModal: React.FC<ShareDialogModalProps> = ({
  document: doc,
  ownerName = 'Alexander Wright',
  onClose,
  onOpenAnalytics
}) => {
  // Sharing Method State
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'whatsapp' | 'telegram'>('link');

  // Basic Permissions State
  const [accessType, setAccessType] = useState<'anyone' | 'restricted'>('anyone');
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [printEnabled, setPrintEnabled] = useState(true);
  const [expiryHours, setExpiryHours] = useState<number | null>(168); // Default 7 Days

  // Advanced Accordion State (Progressive Disclosure)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [burnAfterScan, setBurnAfterScan] = useState(false);
  const [maxViews, setMaxViews] = useState<number | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState(`CAREBUDDY SHARE - ${doc?.name || 'CONFIDENTIAL'}`);
  const [allowedEmailsInput, setAllowedEmailsInput] = useState('');

  // Previous Shares Accordion State
  const [isPreviousSharesOpen, setIsPreviousSharesOpen] = useState(false);
  const [previousShares, setPreviousShares] = useState<SecureShare[]>([]);

  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeShare, setActiveShare] = useState<SecureShare | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock body scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Load active shares for this document
  useEffect(() => {
    if (!doc) return;
    const shares = loadShares().filter((s) => s.documentId === doc.id && s.status === 'active');
    setPreviousShares(shares);

    // If an active share exists, populate default activeShare
    if (shares.length > 0) {
      setActiveShare(shares[0]);
    }
  }, [doc]);

  if (!doc) return null;

  const currentShareUrl = activeShare ? buildShareUrl(activeShare.shareId) : '';

  // Trigger link generation with animation
  const handleGenerateLink = () => {
    setIsGenerating(true);

    const allowedEmails = allowedEmailsInput
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const calculatedMaxViews = burnAfterScan ? 1 : maxViews;

    setTimeout(() => {
      const newShare = createShareForDocument(doc, ownerName, {
        expiryHours,
        passwordEnabled,
        password,
        otpEnabled,
        emailVerificationEnabled: accessType === 'restricted',
        allowedEmails,
        maxViews: calculatedMaxViews,
        downloadEnabled,
        printEnabled,
        saveImageEnabled: downloadEnabled,
        copyTextEnabled: true,
        aiExplanationEnabled: true,
        watermarkEnabled,
        watermarkText: watermarkText.trim() || `CAREBUDDY SHARE - ${doc.name}`,
        notifyOnView: true,
        notifyOnDownload: true
      });

      setActiveShare(newShare);
      setIsGenerating(false);
      setHasGenerated(true);
      setPreviousShares((prev) => [newShare, ...prev]);

      // Direct external share triggers if channel selected
      if (shareMethod === 'whatsapp') {
        const text = encodeURIComponent(`CareBuddy Shared Document: ${doc.name}\n${buildShareUrl(newShare.shareId)}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      } else if (shareMethod === 'telegram') {
        const text = encodeURIComponent(`CareBuddy Shared Document: ${doc.name}`);
        const url = encodeURIComponent(buildShareUrl(newShare.shareId));
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
      } else if (shareMethod === 'email') {
        const subject = encodeURIComponent(`CareBuddy Shared Document: ${doc.name}`);
        const body = encodeURIComponent(`Hello,\n\nPlease review the shared document "${doc.name}" via CareBuddy Secure Share:\n\n${buildShareUrl(newShare.shareId)}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    }, 1000);
  };

  const handleCopyLink = () => {
    if (!currentShareUrl) return;
    navigator.clipboard.writeText(currentShareUrl);
    setCopiedLink(true);
    showToast('📋 Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenSharedPage = () => {
    if (!activeShare) return;
    window.location.hash = `#s/${activeShare.shareId}`;
    showToast('🚀 Opening shared document file view...');
    onClose();
  };

  const handleRevoke = (shareId: string) => {
    revokeShareLink(shareId);
    setPreviousShares((prev) => prev.filter((s) => s.shareId !== shareId));
    if (activeShare && activeShare.shareId === shareId) {
      setActiveShare((prev) => (prev ? { ...prev, status: 'revoked' } : null));
    }
    showToast('🚫 Share link disabled!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative transition-all">
        
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

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Share Document
              </h2>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                {doc.name}
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

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">

          {/* 1. GENERATING LOADING ANIMATION STATE */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Generating Secure Link...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Applying AES-256 permissions and creating secure share link...
                </p>
              </div>

              <div className="w-full max-w-xs h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                />
              </div>
            </motion.div>
          )}

          {/* 2. POST-GENERATION SUCCESS STATE */}
          {!isGenerating && hasGenerated && activeShare && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Success Badge */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    Share Link Generated Successfully
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Anyone with this encrypted link can access the document based on your permissions.
                  </p>
                </div>
              </div>

              {/* Secure Link Access Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Encrypted Share Link
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    AES-256 Protected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentShareUrl}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Expiration Window:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeShare.expiryDate ? new Date(activeShare.expiryDate).toLocaleDateString() : 'No Expiry'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Access Restriction:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activeShare.emailVerificationEnabled ? 'Email Restricted' : 'Anyone with link'}
                    </span>
                  </div>
                  {activeShare.watermarkEnabled && (
                    <div className="flex items-center justify-between">
                      <span>Watermark Security:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Enabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[11px]"
                >
                  <Copy className="w-4 h-4 text-blue-500" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: doc.name,
                        text: `CareBuddy Shared Document: ${doc.name}`,
                        url: currentShareUrl
                      });
                    } else {
                      handleCopyLink();
                    }
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[11px]"
                >
                  <Share2 className="w-4 h-4 text-purple-500" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleOpenSharedPage}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Page</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setHasGenerated(false)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  ← Configure New Share Link
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. INITIAL PRE-GENERATION FORM (PROGRESSIVE DISCLOSURE) */}
          {!isGenerating && !hasGenerated && (
            <div className="space-y-5">
              
              {/* SECTION 1: Sharing Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  1. Sharing Destination
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareMethod('link')}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      shareMethod === 'link'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Direct Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareMethod('whatsapp')}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      shareMethod === 'whatsapp'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareMethod('email')}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      shareMethod === 'email'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareMethod('telegram')}
                    className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      shareMethod === 'telegram'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Send className="w-4 h-4 text-sky-500" />
                    <span>Telegram</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: Who Can Access & Permissions */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  2. Access & Permissions
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccessType('anyone')}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer ${
                      accessType === 'anyone'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Anyone with link</div>
                      <div className="text-[10px] text-slate-500">Public direct access</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessType('restricted')}
                    className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 cursor-pointer ${
                      accessType === 'restricted'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Restricted</div>
                      <div className="text-[10px] text-slate-500">Email whitelist</div>
                    </div>
                  </button>
                </div>

                {/* Direct Action Permission Checkboxes */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={downloadEnabled}
                      onChange={(e) => setDownloadEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Allow Download
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printEnabled}
                      onChange={(e) => setPrintEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Allow Print
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 3: Expiration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  3. Link Expiration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpiryHours(24)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer ${
                      expiryHours === 24
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    24 Hours
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpiryHours(168)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer ${
                      expiryHours === 168
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpiryHours(null)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold cursor-pointer ${
                      expiryHours === null
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Never
                  </button>
                </div>
              </div>

              {/* SECTION 4: ADVANCED SETTINGS ACCORDION (PROGRESSIVE DISCLOSURE) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Advanced Settings</span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {isAdvancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4"
                    >
                      {/* Password Protection */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            Password Protection
                          </span>
                          <input
                            type="checkbox"
                            checked={passwordEnabled}
                            onChange={(e) => setPasswordEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </label>
                        {passwordEnabled && (
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set custom password..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        )}
                      </div>

                      {/* 2FA OTP */}
                      <div className="space-y-1">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                            Require OTP 2FA Verification
                          </span>
                          <input
                            type="checkbox"
                            checked={otpEnabled}
                            onChange={(e) => setOtpEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Burn After Scan / Max Views */}
                      <div className="space-y-1">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                            Burn After Scan (1-Time View)
                          </span>
                          <input
                            type="checkbox"
                            checked={burnAfterScan}
                            onChange={(e) => setBurnAfterScan(e.target.checked)}
                            className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Watermark Stamp */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            Dynamic Watermark Stamp
                          </span>
                          <input
                            type="checkbox"
                            checked={watermarkEnabled}
                            onChange={(e) => setWatermarkEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </label>
                        {watermarkEnabled && (
                          <input
                            type="text"
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value)}
                            placeholder="CONFIDENTIAL WATERMARK"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        )}
                      </div>

                      {/* Restricted Whitelist Emails */}
                      {accessType === 'restricted' && (
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-slate-300 block">
                            Allowed Email Addresses (comma separated)
                          </label>
                          <input
                            type="text"
                            value={allowedEmailsInput}
                            onChange={(e) => setAllowedEmailsInput(e.target.value)}
                            placeholder="user1@example.com, doctor@hospital.org"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECTION 5: PREVIOUS SHARES ACCORDION (PROGRESSIVE DISCLOSURE) */}
              {previousShares.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setIsPreviousSharesOpen(!isPreviousSharesOpen)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Previous Active Shares ({previousShares.length})</span>
                    </div>
                    {isPreviousSharesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {isPreviousSharesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto"
                      >
                        {previousShares.map((s) => (
                          <div
                            key={s.shareId}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block truncate">
                                TOKEN: {s.shareId}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Views: {s.viewCount} • {s.expiryDate ? `Expires: ${new Date(s.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(buildShareUrl(s.shareId));
                                  showToast('Copied token link!');
                                }}
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Copy
                              </button>

                              {onOpenAnalytics && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAnalytics(s.shareId)}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Analytics
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRevoke(s.shareId)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Disable
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* PRIMARY ACTION BUTTON */}
              <button
                type="button"
                onClick={handleGenerateLink}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Secure Share Link</span>
              </button>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1 font-mono">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            CareBuddy Progressive Disclosure Sharing
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
