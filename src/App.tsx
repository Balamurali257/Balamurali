import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { DocumentDetailModal } from './components/DocumentDetailModal';
import { UploadModal } from './components/UploadModal';
import { PhotoScannerModal } from './components/PhotoScannerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { EmergencyMedicalView } from './components/EmergencyMedicalView';
import { RemindersView } from './components/RemindersView';
import { SecurityView } from './components/SecurityView';
import { AIAssistantView } from './components/AIAssistantView';
import { AdminPanelView } from './components/AdminPanelView';
import { SettingsView } from './components/SettingsView';
import { AISearchModal } from './components/AISearchModal';
import { ProfilesModal } from './components/ProfilesModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginView } from './components/LoginView';
import { SharedDocumentView } from './components/SharedDocumentView';
import { StorageAnalyticsModal } from './components/StorageAnalyticsModal';

import {
  INITIAL_USER,
  INITIAL_DOCUMENTS,
  INITIAL_REMINDERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PROFILES,
} from './data/initialData';
import { DocumentItem, UserProfile, ReminderItem, StorageStats, VaultProfile } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeShareId, setActiveShareId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/s/')) {
      return path.replace('/s/', '').split('/')[0];
    }
    if (path.startsWith('/share/')) {
      return path.replace('/share/', '').split('/')[0];
    }
    const hash = window.location.hash;
    if (hash.startsWith('#s/')) {
      return hash.replace('#s/', '');
    }
    if (hash.startsWith('#share/')) {
      return hash.replace('#share/', '');
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('s') || params.get('share') || params.get('shareId');
  });

  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname;
      if (path.startsWith('/s/')) {
        setActiveShareId(path.replace('/s/', '').split('/')[0]);
        return;
      }
      if (path.startsWith('/share/')) {
        setActiveShareId(path.replace('/share/', '').split('/')[0]);
        return;
      }
      const hash = window.location.hash;
      if (hash.startsWith('#s/')) {
        setActiveShareId(hash.replace('#s/', ''));
        return;
      }
      if (hash.startsWith('#share/')) {
        setActiveShareId(hash.replace('#share/', ''));
        return;
      }
      const params = new URLSearchParams(window.location.search);
      setActiveShareId(params.get('s') || params.get('share') || params.get('shareId'));
    };

    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);
    return () => {
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);

  // Sync dark mode class on document element for complete theme toggling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<'Admin' | 'User'>('User');

  const handleNavigate = (newView: string) => {
    if (newView === 'upload') {
      if (currentView !== 'documents') {
        setViewHistory((prev) => [...prev, currentView]);
        setCurrentView('documents');
      }
      setShowUploadModal(true);
      return;
    }
    if (newView !== currentView) {
      setViewHistory((prev) => [...prev, currentView]);
      setCurrentView(newView);
    }
  };

  const handleGoBack = () => {
    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentView(prevView);
    } else {
      setCurrentView('dashboard');
    }
  };

  // Vault State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Multi-User Profile State
  const [profiles, setProfiles] = useState<VaultProfile[]>(INITIAL_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [showProfilesModal, setShowProfilesModal] = useState<boolean>(false);

  // Modals & Triggers
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const handleAskAIAboutDocument = (doc: DocumentItem) => {
    setSelectedDocument(null);
    setAiAssistantPrompt(`Summarize and analyze my ${doc.name} (${doc.category} - ${doc.subCategory || doc.fileType}). Extract key details, expiration dates, and actionable insights.`);
    handleNavigate('assistant');
  };
  const [showPhotoScannerModal, setShowPhotoScannerModal] = useState(false);
  const [showAISearchModal, setShowAISearchModal] = useState(false);
  const [showStorageAnalyticsModal, setShowStorageAnalyticsModal] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  // Filter documents based on active profile
  const filteredDocuments = documents.filter((doc) => {
    if (selectedProfileId === 'all') return true;
    return doc.ownerProfileId === selectedProfileId;
  });

  // Handle Profile Management Handlers
  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === 'prof_alex' || p.relationship === 'Self' || p.isPrimary
          ? {
              ...p,
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              avatarUrl: updatedUser.avatarUrl || p.avatarUrl,
            }
          : p
      )
    );
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (profileId === 'all') {
      const primary = profiles.find((p) => p.isPrimary || p.relationship === 'Self') || profiles[0];
      if (primary) {
        setUser((prev) => ({
          ...prev,
          id: `usr_${primary.id}`,
          name: primary.name,
          email: primary.email || 'alex.wright@vault.internal',
          phone: primary.phone || '+1 (555) 234-5678',
          avatarUrl: primary.avatarUrl,
          bloodGroup: primary.bloodGroup || 'O Positive (O+)',
          dob: primary.dob || '1992-05-14',
          role: 'Admin',
        }));
      }
    } else {
      const selected = profiles.find((p) => p.id === profileId);
      if (selected) {
        setUser((prev) => ({
          ...prev,
          id: `usr_${selected.id}`,
          name: selected.name,
          email: selected.email || `${selected.name.toLowerCase().replace(/\s+/g, '.')}@vault.internal`,
          phone: selected.phone || '+1 (555) 234-5678',
          avatarUrl: selected.avatarUrl,
          bloodGroup: selected.bloodGroup || prev.bloodGroup,
          dob: selected.dob || prev.dob,
          role: selected.role === 'Admin' ? 'Admin' : 'User',
          medicalProfile: {
            ...prev.medicalProfile,
            allergies: selected.allergies || prev.medicalProfile?.allergies || [],
          },
        }));
      }
    }
  };

  const handleAddProfile = (newProf: VaultProfile) => {
    setProfiles((prev) => [...prev, newProf]);
  };

  const handleUpdateProfile = (updated: VaultProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (updated.id === 'prof_alex' || updated.relationship === 'Self' || updated.isPrimary) {
      setUser((prev) => ({
        ...prev,
        name: updated.name,
        email: updated.email || prev.email,
        phone: updated.phone || prev.phone,
        avatarUrl: updated.avatarUrl || prev.avatarUrl,
      }));
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (selectedProfileId === id) {
      setSelectedProfileId('all');
    }
  };

  // Handle Photo Scanner Auto-Upload & Auto-Jump to Category
  const handlePhotoScanCategoryJump = (category: string, docId?: string) => {
    setActiveCategoryFilter(category);
    setCurrentView('documents');
  };

  // Sync Dark Mode class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Ctrl + K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowAISearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute storage stats dynamically
  const totalUsedBytes = documents.reduce((acc, d) => acc + (d.isDeleted ? 0 : d.size), 0);
  const categoryUsage = documents.reduce((acc, d) => {
    if (!d.isDeleted) {
      acc[d.category] = (acc[d.category] || 0) + d.size;
    }
    return acc;
  }, {} as Record<DocumentItem['category'], number>);

  const storageStats: StorageStats = {
    totalAllocatedGB: 10,
    totalUsedBytes,
    categoryUsage,
    totalDocumentsCount: documents.filter((d) => !d.isDeleted).length,
    encryptedDocumentsCount: documents.filter((d) => !d.isDeleted && d.encrypted).length,
    expiredDocumentsCount: documents.filter((d) => !d.isDeleted && d.expiryDate && new Date(d.expiryDate) < new Date()).length,
    expiringSoonCount: documents.filter((d) => !d.isDeleted && d.expiryDate && new Date(d.expiryDate) >= new Date()).length,
  };

  // Handlers
  const handleToggleFavorite = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d))
    );
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isDeleted: true, deletedAt: new Date().toISOString() } : d))
    );
  };

  const handleRestoreDocument = (id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isDeleted: false, deletedAt: undefined } : d))
    );
  };

  const handleAddDocument = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleUpdateDocument = (updatedDoc: DocumentItem) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    setSelectedDocument(updatedDoc);
  };

  const handleAddReminder = (newReminder: ReminderItem) => {
    setReminders((prev) => [newReminder, ...prev]);
  };

  const handleToggleCompleteReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  if (activeShareId) {
    return (
      <SharedDocumentView
        shareId={activeShareId}
        onClose={() => {
          setActiveShareId(null);
          window.location.hash = '';
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginView
        onLogin={(loggedUser) => {
          if (loggedUser) {
            handleUpdateUser(loggedUser);
          }
          setIsLoggedIn(true);
        }}
        profiles={profiles}
        userEmail=""
        userName=""
      />
    );
  }

  return (
    <div className={`min-h-screen w-full ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navbar */}
      <Navbar
        user={user}
        onUpdateUser={handleUpdateUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAISearch={() => setShowAISearchModal(true)}
        onOpenEmergencyCard={() => handleNavigate('emergency')}
        onOpenAIAssistant={() => handleNavigate('assistant')}
        onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
        currentRole={currentRole}
        onToggleRole={() => setCurrentRole(currentRole === 'Admin' ? 'User' : 'Admin')}
        onNavigate={handleNavigate}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={handleSelectProfile}
        onOpenManageProfiles={() => setShowProfilesModal(true)}
        onLogout={() => setIsLoggedIn(false)}
        onGoBack={handleGoBack}
        canGoBack={viewHistory.length > 0 || currentView !== 'dashboard'}
      />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
          currentRole={currentRole}
          storageStats={storageStats}
          onOpenManageProfiles={() => setShowProfilesModal(true)}
          onOpenStorageAnalytics={() => setShowStorageAnalyticsModal(true)}
          onLogout={() => setIsLoggedIn(false)}
        />

        {/* Main Content Area */}
        <main className={`flex-1 ${currentView === 'assistant' ? 'p-0 sm:p-2 md:p-3 pb-16 md:pb-2 max-w-none h-[calc(100vh-105px)]' : 'p-4 sm:p-6 lg:p-8 pb-32 md:pb-8 max-w-7xl'} mx-auto w-full flex flex-col min-h-0 overflow-hidden`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ willChange: 'opacity, transform' }}
              className="w-full h-full flex flex-col flex-1"
            >
              {currentView === 'dashboard' && (
                <DashboardView
                  user={user}
                  documents={filteredDocuments}
                  reminders={reminders}
                  storageStats={storageStats}
                  onNavigate={handleNavigate}
                  onSelectDocument={(doc) => setSelectedDocument(doc)}
                  onQuickUpload={() => setShowUploadModal(true)}
                  onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
                  onOpenStorageAnalytics={() => setShowStorageAnalyticsModal(true)}
                />
              )}

              {currentView === 'documents' && (
                <DocumentsView
                  documents={filteredDocuments}
                  onSelectDocument={(doc) => setSelectedDocument(doc)}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteDocument={handleDeleteDocument}
                  onRestoreDocument={handleRestoreDocument}
                  onOpenUpload={() => setShowUploadModal(true)}
                  onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
                  initialCategory={activeCategoryFilter}
                />
              )}

              {currentView === 'emergency' && (
                <EmergencyMedicalView user={user} onUpdateUser={handleUpdateUser} />
              )}

              {currentView === 'reminders' && (
                <RemindersView
                  reminders={reminders}
                  onAddReminder={handleAddReminder}
                  onToggleComplete={handleToggleCompleteReminder}
                  onDeleteReminder={handleDeleteReminder}
                />
              )}

              {currentView === 'assistant' && (
                <AIAssistantView
                  user={user}
                  documents={filteredDocuments}
                  onSelectDocument={(doc) => setSelectedDocument(doc)}
                  onBack={() => setCurrentView('dashboard')}
                  initialPrompt={aiAssistantPrompt}
                  onClearInitialPrompt={() => setAiAssistantPrompt(null)}
                />
              )}

              {currentView === 'security' && (
                <SecurityView
                  user={user}
                  auditLogs={auditLogs}
                  onUpdateUser={handleUpdateUser}
                />
              )}

              {currentView === 'admin' && (
                <AdminPanelView storageStats={storageStats} documents={documents} />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  user={user}
                  documents={documents}
                  onUpdateUser={handleUpdateUser}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  onOpenStorageAnalytics={() => setShowStorageAnalyticsModal(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      {showStorageAnalyticsModal && (
        <StorageAnalyticsModal
          isOpen={showStorageAnalyticsModal}
          onClose={() => setShowStorageAnalyticsModal(false)}
          documents={documents}
          storageStats={storageStats}
          profiles={profiles}
          onSelectDocument={(doc) => setSelectedDocument(doc)}
          onNavigateToCategory={(cat) => handlePhotoScanCategoryJump(cat)}
          onDeleteDocument={handleDeleteDocument}
        />
      )}
      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdateDocument={handleUpdateDocument}
          onDeleteDocument={(id) => {
            handleDeleteDocument(id);
            setSelectedDocument(null);
          }}
          onAskAIAboutDoc={handleAskAIAboutDocument}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onAddDocument={handleAddDocument}
          onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
          profiles={profiles}
        />
      )}

      {showPhotoScannerModal && (
        <PhotoScannerModal
          onClose={() => setShowPhotoScannerModal(false)}
          onAddDocument={handleAddDocument}
          onNavigateToCategory={handlePhotoScanCategoryJump}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
        />
      )}

      {showAISearchModal && (
        <AISearchModal
          documents={filteredDocuments}
          onClose={() => setShowAISearchModal(false)}
          onSelectDocument={(doc) => setSelectedDocument(doc)}
        />
      )}

      {showProfilesModal && (
        <ProfilesModal
          profiles={profiles}
          documents={documents}
          selectedProfileId={selectedProfileId}
          onClose={() => setShowProfilesModal(false)}
          onSelectProfile={(id) => {
            handleSelectProfile(id);
            setShowProfilesModal(false);
          }}
          onAddProfile={handleAddProfile}
          onUpdateProfile={handleUpdateProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {showOnboardingModal && (
        <OnboardingModal
          user={user}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={(updatedUser, firstDoc) => {
            setUser(updatedUser);
            if (firstDoc) {
              setDocuments((prev) => [firstDoc, ...prev]);
            }
            setShowOnboardingModal(false);
            setCurrentView('dashboard');
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenPhotoScanner={() => setShowPhotoScannerModal(true)}
        onOpenAISearch={() => setShowAISearchModal(true)}
        currentRole={currentRole}
        onToggleRole={() => setCurrentRole(currentRole === 'Admin' ? 'User' : 'Admin')}
        storageStats={storageStats}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={(id) => setSelectedProfileId(id)}
        onOpenManageProfiles={() => setShowProfilesModal(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={() => setIsLoggedIn(false)}
        onGoBack={handleGoBack}
        canGoBack={viewHistory.length > 0 || currentView !== 'dashboard'}
      />
    </div>
  );
}
