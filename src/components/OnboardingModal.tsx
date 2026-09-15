import React, { useState } from 'react';
import {
  Sparkles,
  User,
  ShieldCheck,
  FolderLock,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  FileText
} from 'lucide-react';
import { UserProfile, DocumentItem, CategoryType } from '../types';

interface OnboardingModalProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile, firstDoc?: DocumentItem) => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profileName, setProfileName] = useState(user.name);
  const [vaultName, setVaultName] = useState(`${user.name.split(' ')[0]}'s Personal Vault`);
  const [selectedPresetDoc, setSelectedPresetDoc] = useState<'passport' | 'medical' | 'tax' | null>('passport');

  const handleFinish = () => {
    let createdDoc: DocumentItem | undefined = undefined;

    if (selectedPresetDoc === 'passport') {
      createdDoc = {
        id: `doc_onboard_${Date.now()}`,
        name: 'US Passport - Alexander.pdf',
        originalName: 'US_Passport_Official.pdf',
        category: 'Identity',
        subCategory: 'Passport',
        fileType: 'pdf',
        size: 1845000,
        uploadDate: new Date().toISOString(),
        expiryDate: '2027-02-15',
        tags: ['Passport', 'Travel', 'Identity', 'Official'],
        notes: 'Uploaded during Vault Onboarding Setup.',
        isFavorite: true,
        isPinned: true,
        isArchived: false,
        isDeleted: false,
        encrypted: true,
        encryptionKeyHash: 'AES256-ONBOARD-KEY',
        version: 1,
        fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
        ocrText: 'UNITED STATES OF AMERICA PASSPORT. SURNAME: WRIGHT. GIVEN NAME: ALEXANDER. PASSPORT NO: C8829104. NATIONALITY: USA. DOB: 14 OCT 1990.',
        aiSummary: 'Official US Passport document for Alexander Wright. Expiry Date: February 15, 2027.',
        extractedMetadata: {
          'Passport Number': 'C8829104',
          'Country': 'United States',
          'Expiry Date': '2027-02-15',
          'MRZ Code': 'P<USAWRIGHT<<ALEXANDER<<<<<<<<<<<<<<<<<<'
        },
        sharedLinks: [],
        ownerProfileId: 'prof_alex'
      };
    } else if (selectedPresetDoc === 'medical') {
      createdDoc = {
        id: `doc_onboard_${Date.now()}`,
        name: 'Diagnostic Blood Panel 2026.pdf',
        originalName: 'labcorp_blood_panel.pdf',
        category: 'Medical',
        subCategory: 'Lab Report',
        fileType: 'pdf',
        size: 2100000,
        uploadDate: new Date().toISOString(),
        expiryDate: '2027-08-10',
        tags: ['Medical', 'Blood Test', 'Lab Corp'],
        notes: 'Comprehensive diagnostic blood panel result.',
        isFavorite: true,
        isPinned: true,
        isArchived: false,
        isDeleted: false,
        encrypted: true,
        encryptionKeyHash: 'AES256-LAB-KEY',
        version: 1,
        fileUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
        ocrText: 'LABCORP DIAGNOSTICS REPORT. PATIENT: ALEXANDER WRIGHT. BLOOD TYPE: O POSITIVE. CHOLESTEROL: 185 mg/dL. GLUCOSE: 92 mg/dL.',
        aiSummary: 'Diagnostic blood test panel. Normal range cholesterol and glucose levels.',
        extractedMetadata: {
          'Hospital/Lab': 'LabCorp Diagnostics',
          'Blood Group': 'O Positive',
          'Allergies Noted': 'Penicillin'
        },
        sharedLinks: [],
        ownerProfileId: 'prof_alex'
      };
    }

    onComplete(
      {
        ...user,
        name: profileName,
      },
      createdDoc
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative text-white flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">First-Time Setup Wizard</h2>
              <p className="text-[10px] text-slate-400">Step {step} of 3 • Guided Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* STEP 1: PROFILE SETUP */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold">Personal Profile Setup</h3>
                <p className="text-xs text-slate-400">
                  Welcome! Let's personalize your primary profile for AI summary tags & emergency cards.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Zero-Trust: Your personal details are stored exclusively in your local encrypted vault.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE VAULT NAME */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                  <FolderLock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold">Choose Your Vault Name</h3>
                <p className="text-xs text-slate-400">
                  Name your primary document vault and configure AES-256 client encryption.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vault Title</label>
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AES-256 Vault Encryption</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      ENABLED
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Document OCR & Indexing Engine</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD FIRST DOCUMENT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold">Upload First Vault Document</h3>
                <p className="text-xs text-slate-400">
                  Select a starter document to populate your vault with instant AI extraction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPresetDoc('passport')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedPresetDoc === 'passport'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">US Passport ID</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Auto-extracts passport number, expiration date & MRZ code.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPresetDoc('medical')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedPresetDoc === 'medical'
                      ? 'bg-rose-600/20 border-rose-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">Blood Lab Report</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Auto-extracts blood type, cholesterol & diagnostic health values.</p>
                </button>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ready to initialize your vault workspace with automated OCR scanning!</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Setup & Open Vault</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
