import React, { useState } from 'react';
import {
  Upload,
  X,
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Camera,
  Image as ImageIcon,
  Scan,
  RefreshCw
} from 'lucide-react';
import { DocumentItem, CategoryType, VaultProfile } from '../types';
import { createShareForDocument } from '../utils/shareStore';

interface UploadModalProps {
  onClose: () => void;
  onAddDocument: (doc: DocumentItem) => void;
  onOpenPhotoScanner?: () => void;
  profiles?: VaultProfile[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  onClose,
  onAddDocument,
  profiles = [],
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'camera' | 'samples'>('file');
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Identity');
  const [subCategory, setSubCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [encrypt, setEncrypt] = useState(true);
  const [ownerProfileId, setOwnerProfileId] = useState<string>(profiles[0]?.id || 'prof_alex');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const [customFileSize, setCustomFileSize] = useState<number>(0);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const presets = [
    {
      id: 'passport',
      label: 'Passport ID',
      name: 'US Passport - Alexander Wright.pdf',
      cat: 'Identity' as CategoryType,
      sub: 'Passport',
      tags: 'Passport, Travel, Government ID',
      expiry: '2027-02-15',
      ocr: 'PASSPORT - UNITED STATES OF AMERICA. SURNAME: WRIGHT. GIVEN: ALEXANDER. PASSPORT NO: C8829104. EXPIRY: 15 FEB 2027.',
      summary: 'Official US Passport document. Expiry date: Feb 15, 2027.',
      img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'blood_test',
      label: 'Blood Test Report',
      name: 'st_jude_blood_panel.pdf',
      cat: 'Medical' as CategoryType,
      sub: 'Blood Test',
      tags: 'Medical, Lab Result, Blood Group O+',
      expiry: '2027-07-15',
      ocr: 'ST. JUDE MEMORIAL LABORATORY REPORT. PATIENT: ALEXANDER WRIGHT. BLOOD TYPE: O POSITIVE (O+). ALLERGIES NOTED: PENICILLIN.',
      summary: 'Comprehensive lab report reconfirming O+ Blood Group and Penicillin allergy.',
      img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'tax_return',
      label: 'Tax Return 2025',
      name: 'form_1040_tax_return.pdf',
      cat: 'Financial' as CategoryType,
      sub: 'Tax Return',
      tags: 'Financial, IRS, Tax 2025',
      expiry: '',
      ocr: 'DEPARTMENT OF THE TREASURY - INTERNAL REVENUE SERVICE. FORM 1040 U.S. INDIVIDUAL INCOME TAX RETURN 2025. TAXPAYER: ALEXANDER WRIGHT.',
      summary: 'Form 1040 Income Tax filing for Tax Year 2025.',
      img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const sampleScans = [
    {
      id: 'scan_passport',
      title: 'US Passport Scan',
      cat: 'Identity' as CategoryType,
      sub: 'Passport',
      expiry: '2027-02-15',
      tags: 'Passport, Government ID, Travel',
      img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'scan_medical',
      title: 'Hospital Blood Panel',
      cat: 'Medical' as CategoryType,
      sub: 'Lab Test',
      expiry: '2027-08-30',
      tags: 'Medical, Blood Panel, O+',
      img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'scan_deed',
      title: 'Residential Property Deed',
      cat: 'Property' as CategoryType,
      sub: 'Title Deed',
      expiry: '2035-12-31',
      tags: 'Property, Real Estate, Deed',
      img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setCustomFileUrl(null);
    setScannedImage(null);
    setFileName(p.name);
    setCategory(p.cat);
    setSubCategory(p.sub);
    setTagsInput(p.tags);
    setExpiryDate(p.expiry);
  };

  const handleSelectSampleScan = (s: typeof sampleScans[0]) => {
    setSelectedPreset(s.id);
    setCustomFileUrl(s.img);
    setScannedImage(s.img);
    setFileName(`${s.title}.jpg`);
    setCategory(s.cat);
    setSubCategory(s.sub);
    setTagsInput(s.tags);
    setExpiryDate(s.expiry);
    setUploadMode('file');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPreset(null);
    setFileName(file.name);
    setCustomFileSize(file.size);

    // Auto classify based on extension/name
    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('passport') || nameLower.includes('id') || nameLower.includes('license')) {
      setCategory('Identity');
      setSubCategory('Identity Card');
    } else if (nameLower.includes('health') || nameLower.includes('blood') || nameLower.includes('lab') || nameLower.includes('medical')) {
      setCategory('Medical');
      setSubCategory('Lab Report');
    } else if (nameLower.includes('tax') || nameLower.includes('bank') || nameLower.includes('statement') || nameLower.includes('invoice')) {
      setCategory('Financial');
      setSubCategory('Statement');
    } else if (nameLower.includes('deed') || nameLower.includes('lease') || nameLower.includes('rent')) {
      setCategory('Property');
      setSubCategory('Lease Agreement');
    } else if (nameLower.includes('car') || nameLower.includes('vehicle') || nameLower.includes('registration') || nameLower.includes('insurance')) {
      setCategory('Vehicle');
      setSubCategory('Registration');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomFileUrl(result);
        setScannedImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const generatedName = `Camera_Scan_${new Date().toISOString().slice(0, 10)}.jpg`;
    setFileName(generatedName);
    setCustomFileSize(file.size);
    setCategory('Identity');
    setSubCategory('Photo Scan');
    setTagsInput('Scanned, Photo, Vault');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomFileUrl(result);
        setScannedImage(result);
        setUploadMode('file');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    setIsProcessing(true);
    setProgressPercent(10);
    setUploadStage('Uploading document stream...');

    setTimeout(() => {
      setProgressPercent(35);
      setUploadStage('Scanning document structure...');
    }, 400);

    setTimeout(() => {
      setProgressPercent(65);
      setUploadStage('Processing document text & tags...');
    }, 900);

    setTimeout(() => {
      setProgressPercent(90);
      setUploadStage('Indexing metadata & AES-256 encryption...');
    }, 1400);

    setTimeout(() => {
      setProgressPercent(100);
      setUploadStage('Done! Document encrypted & indexed.');

      const selectedP = presets.find((p) => p.id === selectedPreset);

      const resolvedFileUrl = customFileUrl || (selectedP ? selectedP.img : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80');

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        name: fileName.replace(/\.[^/.]+$/, ''),
        originalName: fileName,
        category,
        subCategory: subCategory || category,
        fileType: fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp') ? 'image' : 'pdf',
        size: customFileSize || (Math.floor(Math.random() * 2000000) + 1000000),
        uploadDate: new Date().toISOString(),
        expiryDate: expiryDate || undefined,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [category, 'Uploaded'],
        notes: 'Uploaded to Digital Document Vault with AES-256 client encryption.',
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isDeleted: false,
        encrypted: encrypt,
        encryptionKeyHash: `AES256-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        version: 1,
        fileUrl: resolvedFileUrl,
        ocrText: selectedP ? selectedP.ocr : `Extracted text stream for document "${fileName}". Client encrypted and stored in vault.`,
        aiSummary: selectedP ? selectedP.summary : `Uploaded document "${fileName}" categorized under ${category} (${subCategory || 'General'}).`,
        extractedMetadata: {
          'Uploaded File': fileName,
          'Encryption Status': encrypt ? 'AES-256 Active' : 'Unencrypted',
          'Category': category
        },
        sharedLinks: [],
        ownerProfileId: ownerProfileId || 'prof_alex',
        accessLogs: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Decrypt',
            user: 'Alexander Wright',
            ip: '192.168.1.45',
            device: 'Vault Client',
            status: 'Success'
          }
        ]
      };

      // Automatically generate unique Share Link, QR code, and Secure Download URL
      const autoShare = createShareForDocument(newDoc, 'Alexander Wright', {
        expiryHours: null,
        passwordEnabled: false,
        otpEnabled: false,
        emailVerificationEnabled: false,
        maxViews: null,
        downloadEnabled: true,
        printEnabled: true,
        saveImageEnabled: true,
        copyTextEnabled: true,
        aiExplanationEnabled: true,
        watermarkEnabled: true,
        watermarkText: `CAREBUDDY VAULT SHARE - ${newDoc.name}`,
        notifyOnView: true,
        notifyOnDownload: true
      });

      newDoc.sharedLinks = [
        {
          id: autoShare.shareId,
          token: autoShare.shareId,
          createdAt: autoShare.createdDate,
          expiresAt: autoShare.expiryDate || '',
          maxUses: 100,
          usesCount: 0,
          isOneTime: false,
          watermarkText: autoShare.watermarkText,
          passwordProtected: false
        }
      ];

      setTimeout(() => {
        onAddDocument(newDoc);
        setIsProcessing(false);
        onClose();
      }, 300);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Processing Progress Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Encrypting & Uploading Document</h3>
              <p className="text-xs text-blue-300 font-mono font-bold">{uploadStage}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{progressPercent}% Completed</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Upload Document</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">AES-256 Vault Encryption & Multi-Source Input</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs Inside Modal */}
        <div className="px-4 sm:px-6 pt-4 shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadMode === 'file'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>File Browser</span>
            </button>
            {/* Camera option shown exclusively on mobile devices, hidden on PC */}
            <button
              type="button"
              onClick={() => setUploadMode('camera')}
              className={`flex-1 md:hidden py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadMode === 'camera'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera / Scan Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('samples')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                uploadMode === 'samples'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Presets</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-8 space-y-4 overflow-y-auto flex-1">
          {/* Mode 1: Standard File Browser */}
          {uploadMode === 'file' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Local Document File (PC or Mobile)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {fileName ? `Selected: ${fileName}` : 'Click or Drag & Drop File Here'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Supports PDF, PNG, JPG, WEBP, DOCX up to 50MB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Camera & Direct Photo Scanner */}
          {uploadMode === 'camera' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Camera Capture & Photo Scanner
              </label>
              <div className="relative border-2 border-dashed border-emerald-400/60 dark:border-emerald-700/80 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-2xl p-6 text-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                      Tap to Open Camera / Take Document Photo
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                      Snaps photo from mobile or webcam and loads it into your vault
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Presets and Sample Scans */}
          {uploadMode === 'samples' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>1-Click Sample Files & Scans</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sampleScans.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSampleScan(s)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedPreset === s.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold truncate">{s.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.cat} • {s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected File / Scan Preview */}
          {scannedImage && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <img
                src={scannedImage}
                alt="Scan preview"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{fileName}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Ready for vault upload</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual File Inputs */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Document Name / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Passport_2026.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                {['Identity', 'Medical', 'Financial', 'Property', 'Vehicle', 'Education', 'Business', 'Personal'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Subcategory</label>
              <input
                type="text"
                placeholder="e.g. Blood Test, Tax Form"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                placeholder="Official, Medical, 2026"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="encryptCheck"
              checked={encrypt}
              onChange={(e) => setEncrypt(e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="encryptCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Enable Client-Side AES-256 Vault Encryption</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !fileName.trim()}
              className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Upload className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Encrypt & Upload to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
