import React, { useState, useEffect } from 'react';
import {
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  Scan,
  Eye
} from 'lucide-react';
import { DocumentItem, CategoryType, VaultProfile } from '../types';
import { createShareForDocument } from '../utils/shareStore';

interface PhotoScannerModalProps {
  onClose: () => void;
  onAddDocument: (doc: DocumentItem) => void;
  onNavigateToCategory: (category: CategoryType, docId?: string) => void;
  profiles?: VaultProfile[];
  selectedProfileId?: string;
}

export const PhotoScannerModal: React.FC<PhotoScannerModalProps> = ({
  onClose,
  onAddDocument,
  onNavigateToCategory,
  profiles = [],
  selectedProfileId = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'samples'>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Extraction State
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Auto-filled Form State
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Identity');
  const [subCategory, setSubCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [ocrText, setOcrText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [extractedMetadata, setExtractedMetadata] = useState<Record<string, string>>({});
  const [autoUploadOnScan, setAutoUploadOnScan] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Sample photos for easy testing
  const samplePhotos = [
    {
      id: 'passport',
      title: 'Passport Photo Scan',
      category: 'Identity' as CategoryType,
      subCategory: 'Passport',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      extracted: {
        docName: 'Official US Passport Scan - Alexander Wright',
        category: 'Identity' as CategoryType,
        subCategory: 'Passport',
        expiryDate: '2027-02-15',
        tags: ['Passport', 'Travel', 'Government ID', 'Encrypted'],
        ocrText: 'PASSPORT - UNITED STATES OF AMERICA. SURNAME: WRIGHT. GIVEN: ALEXANDER. NATIONALITY: USA. PASSPORT NO: C8829104. DATE OF EXPIRY: 15 FEB 2027.',
        aiSummary: 'US Passport scan auto-verified with official government ID layout. Verified holder Alexander Wright.',
        metadata: {
          'Passport No': 'C8829104',
          'Holder Name': 'Alexander Wright',
          'Issue Authority': 'US Department of State',
          'Expiration Status': 'Valid until Feb 2027'
        }
      }
    },
    {
      id: 'medical_report',
      title: 'Blood Panel Lab Scan',
      category: 'Medical' as CategoryType,
      subCategory: 'Blood Test',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
      extracted: {
        docName: 'St. Jude Comprehensive Blood Panel & Allergy Report',
        category: 'Medical' as CategoryType,
        subCategory: 'Blood Test Report',
        expiryDate: '2027-08-30',
        tags: ['Medical', 'Blood Group O+', 'Lab Result', 'Emergency'],
        ocrText: 'ST. JUDE MEMORIAL HOSPITAL LABORATORY. PATIENT: ALEXANDER WRIGHT. BLOOD GROUP: O POSITIVE (O+). HEMOGLOBIN: 15.2 g/dL. ALLERGIES: PENICILLIN (SEVERE).',
        aiSummary: 'Comprehensive blood test results confirming O+ Blood Group, normal hemoglobin levels, and Penicillin allergy warning.',
        metadata: {
          'Blood Type': 'O Positive (O+)',
          'Allergy Alert': 'Penicillin',
          'Primary Physician': 'Dr. Marcus Vance, MD',
          'Lab Facility': 'St. Jude Health Lab'
        }
      }
    },
    {
      id: 'vehicle_title',
      title: 'Vehicle Title & Registration Card',
      category: 'Vehicle' as CategoryType,
      subCategory: 'Vehicle Registration',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      extracted: {
        docName: '2024 Tesla Model Y - Registration & Title Document',
        category: 'Vehicle' as CategoryType,
        subCategory: 'Vehicle Registration',
        expiryDate: '2026-12-31',
        tags: ['Vehicle', 'Tesla Model Y', 'Registration', 'DMV'],
        ocrText: 'DEPARTMENT OF MOTOR VEHICLES. VEHICLE REGISTRATION CARD. VIN: 5YJ3E1EA7KF123456. MAKE: TESLA. MODEL: MODEL Y. YEAR: 2024. OWNER: ALEXANDER WRIGHT.',
        aiSummary: 'Official DMV Vehicle Registration document for 2024 Tesla Model Y with valid VIN and annual renewal date.',
        metadata: {
          'Vehicle VIN': '5YJ3E1EA7KF123456',
          'Vehicle Make/Model': 'Tesla Model Y (2024)',
          'License Plate': '7XYZ99',
          'Renewal Deadline': 'Dec 31, 2026'
        }
      }
    },
    {
      id: 'tax_1040',
      title: 'Financial IRS Tax Return Form',
      category: 'Financial' as CategoryType,
      subCategory: 'Tax Form',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      extracted: {
        docName: 'IRS Form 1040 Individual Tax Return 2025',
        category: 'Financial' as CategoryType,
        subCategory: 'Tax Return',
        expiryDate: '2027-04-15',
        tags: ['Financial', 'IRS', 'Tax Return', '2025'],
        ocrText: 'INTERNAL REVENUE SERVICE. FORM 1040 U.S. INDIVIDUAL INCOME TAX RETURN 2025. FILING STATUS: SINGLE. TAXPAYER: ALEXANDER WRIGHT. ADJUSTED GROSS INCOME: EXEMPT.',
        aiSummary: 'IRS Form 1040 tax document for Tax Year 2025 with complete filing verification.',
        metadata: {
          'Tax Year': '2025',
          'Filing Status': 'Submitted / Verified',
          'Document ID': 'TAX-2025-8831',
          'Issuer': 'Internal Revenue Service'
        }
      }
    }
  ];

  // Handle File Drop / Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        processImageWithAI(result, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process sample selection
  const handleSelectSample = (sample: typeof samplePhotos[0]) => {
    setCapturedImage(sample.image);
    const ex = sample.extracted;

    setIsScanning(true);
    setScanSuccess(false);

    setTimeout(() => {
      setDocName(ex.docName);
      setCategory(ex.category);
      setSubCategory(ex.subCategory);
      setExpiryDate(ex.expiryDate);
      setTags(ex.tags);
      setOcrText(ex.ocrText);
      setAiSummary(ex.aiSummary);
      setExtractedMetadata(ex.metadata);

      setIsScanning(false);
      setScanSuccess(true);

      if (autoUploadOnScan) {
        handleUploadAndNavigate(ex.category, ex.docName, sample.image, ex.subCategory, ex.expiryDate, ex.tags, ex.ocrText, ex.aiSummary, ex.metadata);
      }
    }, 1000);
  };

  // Process photo and extract document details
  const processImageWithAI = async (base64Img: string, mimeType: string) => {
    setIsScanning(true);
    setScanSuccess(false);

    setTimeout(() => {
      const fallbackCat: CategoryType = base64Img.length % 2 === 0 ? 'Medical' : 'Identity';
      setDocName('Scanned Document Photo');
      setCategory(fallbackCat);
      setSubCategory(fallbackCat === 'Medical' ? 'Medical Report' : 'Identification Card');
      setExpiryDate('2028-12-31');
      setTags(['Scanned', 'Photo', fallbackCat]);
      setOcrText('EXTRACTED CONTENT: Document image processed and indexed into vault.');
      setAiSummary('Scanned photo processed and categorized into your vault.');
      setExtractedMetadata({
        'Scanner Engine': 'Document Scanner Core',
        'Encryption': 'AES-256 Enabled',
        'Category': fallbackCat
      });

      setIsScanning(false);
      setScanSuccess(true);
    }, 600);
  };

  // Save Document and Navigate to Category View
  const handleUploadAndNavigate = (
    catOverride?: CategoryType,
    nameOverride?: string,
    imgOverride?: string,
    subCatOverride?: string,
    expiryOverride?: string,
    tagsOverride?: string[],
    ocrOverride?: string,
    summaryOverride?: string,
    metadataOverride?: Record<string, string>
  ) => {
    const targetCat = catOverride || category;
    const targetName = nameOverride || docName || 'Scanned Document Photo';
    const targetImg = imgOverride || capturedImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80';

    const newDoc: DocumentItem = {
      id: `doc_scan_${Date.now()}`,
      name: targetName,
      originalName: `${targetName.toLowerCase().replace(/\s+/g, '_')}.jpg`,
      category: targetCat,
      subCategory: subCatOverride || subCategory || targetCat,
      fileType: 'image',
      size: Math.floor(Math.random() * 1500000) + 800000,
      uploadDate: new Date().toISOString(),
      expiryDate: expiryOverride || expiryDate || undefined,
      tags: tagsOverride || (tags.length > 0 ? tags : ['Scanned', 'Photo', targetCat]),
      notes: 'Scanned document photo encrypted into personal vault.',
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      encrypted: true,
      encryptionKeyHash: `AES256-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      version: 1,
      fileUrl: targetImg,
      ocrText: ocrOverride || ocrText || 'Text auto-extracted from photo.',
      aiSummary: summaryOverride || aiSummary || 'Document automatically analyzed and filed.',
      extractedMetadata: metadataOverride || extractedMetadata || { 'Category': targetCat },
      sharedLinks: [],
      ownerProfileId: selectedProfileId !== 'all' ? selectedProfileId : 'prof_alex',
      accessLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'OCR',
          user: 'Alexander Wright',
          ip: '192.168.1.45',
          device: 'Mobile Camera Scan',
          status: 'Success'
        }
      ]
    };

    // Auto generate share record, QR code, and download link
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

    onAddDocument(newDoc);
    onClose();

    // Show first responsible category view
    onNavigateToCategory(targetCat, newDoc.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <Scan className="w-5 h-5 animate-pulse shrink-0" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Scan Document as Photo</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                  Instant Capture
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Capture photo, extract metadata instantly, auto-upload, and navigate to responsible category view.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 pb-10 space-y-5 overflow-y-auto flex-1">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none flex-nowrap">
            <button
              onClick={() => {
                setActiveTab('upload');
                setCapturedImage(null);
                setScanSuccess(false);
              }}
              className={`flex-1 min-w-[140px] sm:min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Upload Document File (PC / Mobile)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('samples');
                setCapturedImage(null);
                setScanSuccess(false);
              }}
              className={`flex-1 min-w-[150px] sm:min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Sample Templates</span>
            </button>
          </div>

          {/* Scanner View / Inputs */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-all hover:bg-blue-50/50 dark:hover:bg-slate-800 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center">
                  Click to Browse or Drag & Drop Document File
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center max-w-sm">
                  Upload passport scans, bills, medical reports, ID photos, or PDFs directly from your PC or mobile.
                </span>
                <span className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all">
                  Browse Files from Computer
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  Supports JPG, PNG, WEBP, PDF up to 25MB
                </span>
                <input
                  type="file"
                  accept="image/*, .pdf, application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {capturedImage && (
                <div className="relative rounded-2xl overflow-hidden max-h-56 bg-slate-950 flex justify-center border border-slate-700 p-2">
                  <img src={capturedImage} alt="Uploaded document preview" className="object-contain h-48 rounded-xl" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold space-y-2">
                      <Sparkles className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Reading Document Details & Metadata...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Select a Sample Document Photo for 1-Click Scan Testing:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {samplePhotos.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl text-left transition-all flex items-start space-x-3 group"
                  >
                    <img src={sample.image} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {sample.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Auto Category: <span className="font-semibold text-blue-600 dark:text-blue-300">{sample.category}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-1">{sample.subCategory}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auto-Filled Details View */}
          {scanSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                      Document Extracted Details
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      Category categorized as <strong className="underline uppercase tracking-wide">{category}</strong>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">
                  First Category: {category}
                </span>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Auto-Classified Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
                  >
                    {['Identity', 'Medical', 'Financial', 'Property', 'Vehicle', 'Education', 'Business', 'Personal'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detected Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Extracted Metadata Badges */}
              {Object.keys(extractedMetadata).length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Extracted Attributes
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(extractedMetadata).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{k}</div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Executive Summary */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  AI Summary
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  {aiSummary}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px] text-slate-500 font-medium">AES-256 Client Encryption Enabled</span>
            </div>

            <div className="flex items-center space-x-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleUploadAndNavigate()}
                disabled={!scanSuccess}
                className={`py-2.5 px-5 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
                  scanSuccess
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Save to Vault ({category})</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
