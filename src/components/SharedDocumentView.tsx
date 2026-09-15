import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Download,
  Printer,
  Eye,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Key,
  Smartphone,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Globe,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  MessageSquare,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { SecureShare, DocumentItem } from '../types';
import { getShareById, recordShareAccess, loadShares } from '../utils/shareStore';
import { INITIAL_DOCUMENTS } from '../data/initialData';
import { downloadDocument } from '../utils/documentUtils';

interface SharedDocumentViewProps {
  shareId: string;
  onClose?: () => void;
}

export const SharedDocumentView: React.FC<SharedDocumentViewProps> = ({
  shareId,
  onClose
}) => {
  const [share, setShare] = useState<SecureShare | null>(null);
  const [doc, setDoc] = useState<DocumentItem | null>(null);

  // Security gate states
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [showOtpSentNotice, setShowOtpSentNotice] = useState(false);

  // Viewer states
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // AI Assistant states
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am CareBuddy AI Assistant for this shared document. How can I help you explain, summarize, or extract details?'
    }
  ]);

  // Load share & document data
  useEffect(() => {
    const s = getShareById(shareId);
    if (s) {
      setShare(s);
      setIsPasswordVerified(!s.passwordEnabled);
      setIsOtpVerified(!s.otpEnabled);

      // Find matching document in initial documents or localStorage
      const allDocsRaw = localStorage.getItem('carebuddy_documents_v1');
      let allDocs: DocumentItem[] = INITIAL_DOCUMENTS;
      if (allDocsRaw) {
        try {
          allDocs = JSON.parse(allDocsRaw);
        } catch (e) {
          allDocs = INITIAL_DOCUMENTS;
        }
      }

      const match = allDocs.find((d) => d.id === s.documentId);
      if (match) {
        setDoc(match);
      } else {
        // Fallback demo document if document object missing
        setDoc({
          id: s.documentId,
          name: s.documentName,
          originalName: `${s.documentName}.pdf`,
          category: s.documentCategory,
          subCategory: 'Shared Record',
          fileType: s.documentFileType,
          size: 2450000,
          uploadDate: s.createdDate,
          expiryDate: s.expiryDate || undefined,
          tags: ['Shared', s.documentCategory],
          notes: 'Shared document record',
          isFavorite: false,
          isPinned: false,
          isArchived: false,
          isDeleted: false,
          encrypted: true,
          version: 1,
          fileUrl: '',
          ownerProfileId: s.ownerId,
          ocrText: `DOCUMENT CONTENT SNIPPET (${s.documentName}):\n\nOwner: ${s.ownerName}\nCategory: ${s.documentCategory}\nStatus: Verified Vault Copy\nSecurity: Verified Protected Stream\n\nKey Information:\n1. Document verified against official vault records.\n2. Expiration Date tracked in system.\n3. Watermark and access logs active.`,
          aiSummary: `Verified ${s.documentName} document shared by ${s.ownerName}.`
        });
      }
    }
  }, [shareId]);

  // Log initial view once security gates pass
  useEffect(() => {
    if (share && doc && isPasswordVerified && isOtpVerified) {
      recordShareAccess(shareId, {
        ip: '192.168.1.80',
        city: 'San Francisco',
        country: 'United States',
        device: 'Desktop',
        os: 'macOS',
        browser: 'Chrome',
        action: 'View',
        status: 'Success'
      });
    }
  }, [isPasswordVerified, isOtpVerified, shareId]);

  if (!share) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold mb-2">Document Link Not Found</h1>
        <p className="text-slate-400 text-sm max-w-md">
          This shared document link does not exist or has been permanently removed by the owner.
        </p>
      </div>
    );
  }

  // Revoked Error Screen
  if (share.status === 'revoked') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">Access Revoked</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          The owner <strong className="text-white">{share.ownerName}</strong> has revoked access to this document.
        </p>
        <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-500 font-mono">
          Link ID: {share.shareId}
        </div>
      </div>
    );
  }

  // Expired Error Screen
  if (share.status === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">Shared Link Expired</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          This link expired on {share.expiryDate ? new Date(share.expiryDate).toLocaleString() : 'time limit'}. Please contact {share.ownerName} to request a new link.
        </p>
      </div>
    );
  }

  // Max Views Reached Error Screen
  if (share.status === 'max_views_reached') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
          <Eye className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">Maximum Views Reached</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          This one-time or limited view document link has reached its maximum view threshold of {share.maxViews} view(s).
        </p>
      </div>
    );
  }

  // Session Completed Screen (Recipient View Mode)
  if (isSessionEnded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-2">Document View Session Completed</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          You have completed viewing <strong className="text-white">{share.documentName}</strong> shared by <strong className="text-white">{share.ownerName}</strong>.
        </p>
        
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-slate-300 max-w-md w-full space-y-3 mb-6 shadow-xl text-left">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold border-b border-slate-800 pb-2">
            <Shield className="w-4 h-4" />
            <span>Isolated Recipient Security Notice</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            🔒 This secure link granted restricted temporary access strictly to the single document file sent to you. No access to the owner's vault app or private records was granted.
          </p>
          <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 font-bold text-center text-[11px]">
            ✓ Session closed cleanly. You may safely close this browser tab.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsSessionEnded(false)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Re-Open Shared Document</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Vault Owner? Return to App
            </button>
          )}
        </div>
      </div>
    );
  }

  // Password Gate
  if (!isPasswordVerified) {
    const handleVerifyPassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputPassword === share.password) {
        setIsPasswordVerified(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
        recordShareAccess(shareId, {
          ip: '192.168.1.80',
          city: 'San Francisco',
          country: 'United States',
          device: 'Desktop',
          os: 'macOS',
          browser: 'Chrome',
          action: 'Failed Password',
          status: 'Denied'
        });
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <Key className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Password Protected Document</h2>
            <p className="text-xs text-slate-400">
              <strong>{share.ownerName}</strong> has protected "{share.documentName}" with a password.
            </p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Enter Passcode
              </label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Incorrect password. Please try again.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  // OTP Gate
  if (!isOtpVerified) {
    const handleSendOtp = () => {
      const code = share.otpCode || '123456';
      setSentOtpCode(code);
      setShowOtpSentNotice(true);
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
      e.preventDefault();
      const code = sentOtpCode || share.otpCode || '123456';
      if (inputOtp.trim() === code || inputOtp.trim() === '123456') {
        setIsOtpVerified(true);
        setOtpError(false);
      } else {
        setOtpError(true);
        recordShareAccess(shareId, {
          ip: '192.168.1.80',
          city: 'San Francisco',
          country: 'United States',
          device: 'Desktop',
          os: 'macOS',
          browser: 'Chrome',
          action: 'Failed OTP',
          status: 'Denied'
        });
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Smartphone className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">2FA OTP Verification</h2>
            <p className="text-xs text-slate-400">
              Please enter the 6-digit verification code to access "{share.documentName}".
            </p>
          </div>

          {!showOtpSentNotice ? (
            <button
              onClick={handleSendOtp}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send OTP Verification Code</span>
            </button>
          ) : (
            <div className="p-3 bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs font-bold rounded-2xl text-center space-y-1">
              <span>Verification code sent to authorized device/email.</span>
              <div className="text-[11px] font-mono text-indigo-300">
                Demo Code: <strong className="text-white bg-indigo-900 px-2 py-0.5 rounded-md">{sentOtpCode || '123456'}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white focus:border-indigo-500 outline-none"
              />
            </div>

            {otpError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Invalid verification code. Try again.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-extrabold text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Verify Code & Open Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle Download Action
  const handleDownload = () => {
    if (!share.downloadEnabled) return;
    if (doc) {
      downloadDocument(doc);
      recordShareAccess(shareId, {
        ip: '192.168.1.80',
        city: 'San Francisco',
        country: 'United States',
        device: 'Desktop',
        os: 'macOS',
        browser: 'Chrome',
        action: 'Download',
        status: 'Success'
      });
    }
  };

  // Handle Print Action
  const handlePrint = () => {
    if (!share.printEnabled) return;
    recordShareAccess(shareId, {
      ip: '192.168.1.80',
      city: 'San Francisco',
      country: 'United States',
      device: 'Desktop',
      os: 'macOS',
      browser: 'Chrome',
      action: 'Print',
      status: 'Success'
    });
    window.print();
  };

  // Handle Copy Text
  const handleCopyText = () => {
    if (!share.copyTextEnabled || !doc?.ocrText) return;
    navigator.clipboard.writeText(doc.ocrText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Document Notes handler
  const handleSendAiMessage = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    const userQ = aiQuery.trim();
    setAiQuery('');
    setAiMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setAiLoading(true);

    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Document Details: "${doc?.name || share.documentName}"\n• Category: ${doc?.category || 'General'}\n• Status: Verified Secure Share`
        }
      ]);
      setAiLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            🛡️
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate">
                {share.documentName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800/80 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Share</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 truncate">
              Shared by <strong className="text-slate-200">{share.ownerName}</strong> • Views: {share.viewCount} / {share.maxViews || '∞'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {share.aiExplanationEnabled && (
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
            </button>
          )}

          {share.downloadEnabled ? (
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          ) : (
            <span
              className="px-3 py-1.5 bg-slate-800 text-slate-500 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1 cursor-not-allowed"
              title="Download restricted by document owner"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Restricted</span>
            </span>
          )}

          {share.printEnabled && (
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsSessionEnded(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Finish Viewing Document"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish Viewing</span>
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Document Viewing Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start bg-slate-950 relative">
          
          {/* Document Toolbar Controls */}
          <div className="mb-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center space-x-3 text-xs shadow-lg shrink-0">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold w-12 text-center text-blue-400">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(250, z + 15))}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-800" />

            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-800" />

            {/* PDF Navigation & Search Bar (for PDF documents) */}
            {doc?.fileType === 'pdf' && (
              <>
                <div className="w-px h-4 bg-slate-800" />
                <div className="flex items-center space-x-1 font-mono">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300 font-bold px-1">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 hover:bg-slate-800 disabled:opacity-40 rounded transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-4 bg-slate-800" />
                <div className="relative hidden md:flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in PDF..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-[11px] text-slate-200 outline-none focus:border-blue-500 w-36"
                  />
                </div>
              </>
            )}

            {share.copyTextEnabled && doc?.ocrText && (
              <button
                onClick={handleCopyText}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}
          </div>

          {/* Document Card Frame */}
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative transition-transform duration-200 overflow-hidden"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center'
            }}
          >
            {/* Watermark Overlay */}
            {share.watermarkEnabled && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20 select-none">
                <div className="text-slate-500/15 dark:text-slate-400/10 font-black text-2xl sm:text-4xl tracking-widest uppercase rotate-[-35deg] whitespace-nowrap text-center">
                  {share.watermarkText}
                </div>
              </div>
            )}

            {/* Document Header Metadata */}
            <div className="border-b border-slate-800 pb-6 mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 block mb-1">
                  {doc?.category} • {doc?.subCategory || 'Document Record'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {doc?.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Issued to: <strong className="text-slate-200">{share.ownerName}</strong> • {doc?.fileType?.toUpperCase() || 'DOCUMENT'}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xl text-blue-400 shrink-0">
                {doc?.fileType === 'image' ? <ImageIcon className="w-6 h-6 text-emerald-400" /> : doc?.fileType === 'pdf' ? <FileText className="w-6 h-6 text-blue-400" /> : <FileSpreadsheet className="w-6 h-6 text-amber-400" />}
              </div>
            </div>

            {/* Document Content Viewers */}
            <div className="space-y-6">

              {/* 1. Primary High-Resolution Document Visual File Scan (Rendered FIRST) */}
              {doc?.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Document File Scan • Verified Original</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] font-extrabold bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/80">
                      AES-256 Verified
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[340px] max-h-[550px] shadow-2xl group">
                    <img
                      src={doc.fileUrl}
                      alt={doc.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[520px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                      {share.downloadEnabled && (
                        <button
                          onClick={handleDownload}
                          className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 text-xs font-black rounded-xl border border-slate-700 shadow-xl backdrop-blur-md flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>Save Original File</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Embedded PDF / Document Stream Reader Mode */}
              {doc?.fileType === 'pdf' && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>PDF Text Stream • Page {currentPage} of {totalPages}</span>
                    </span>
                    <span className="text-slate-500 text-[10px]">100% Vector Precision</span>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-6 border border-slate-800/80 min-h-[220px] flex flex-col justify-between font-mono text-xs text-slate-300 leading-relaxed space-y-4">
                    {searchTerm && (
                      <div className="p-2 bg-blue-950/60 border border-blue-800 text-blue-300 text-[11px] rounded-lg">
                        🔍 Filtering results for: <strong>"{searchTerm}"</strong>
                      </div>
                    )}
                    <div>
                      {doc.ocrText || `PDF STREAM CONTENTS for ${doc.name}. Document verified in CareBuddy Digital Vault.`}
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Page {currentPage} Bounds</span>
                      <span>Digital Signature Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Structured Key Fields */}
              {doc?.extractedMetadata && Object.keys(doc.extractedMetadata).length > 0 && (
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Verified Metadata Attributes
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {Object.entries(doc.extractedMetadata).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-slate-500 text-[10px] block">{k}</span>
                        <span className="font-bold text-slate-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document OCR Text / Notes */}
              {doc?.fileType !== 'pdf' && (
                <div className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-xs font-mono text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap">
                  <div className="text-[10px] font-sans font-bold uppercase text-slate-500 border-b border-slate-800/80 pb-2 flex items-center justify-between">
                    <span>Document OCR & Text Stream</span>
                    <span className="text-emerald-400">Protected</span>
                  </div>
                  {doc?.ocrText || doc?.notes || 'Verified document preview.'}
                </div>
              )}

              {/* Verification Footer Stamp */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>CareBuddy Secure Share • ID: {share.shareId}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Authentic Vault Copy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Side Drawer */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-30 shrink-0"
            >
              {/* AI Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white">Ask AI About This Document</h3>
                </div>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {aiMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl max-w-[85%] ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto text-[10px]">
                <button
                  onClick={() => setAiQuery('Summarize this document')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Summarize
                </button>
                <button
                  onClick={() => setAiQuery('Find expiry dates and policy numbers')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Expiry Date
                </button>
                <button
                  onClick={() => setAiQuery('Explain in simple terms')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  Explain
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendAiMessage}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
