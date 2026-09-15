export type CategoryType =
  | 'Identity'
  | 'Education'
  | 'Medical'
  | 'Financial'
  | 'Property'
  | 'Vehicle'
  | 'Business'
  | 'Personal';

export interface VaultProfile {
  id: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Family Shared' | 'Business Entity';
  role: 'Admin' | 'Member' | 'Dependent' | 'Guest';
  avatarUrl?: string;
  avatarColor: string;
  email?: string;
  phone?: string;
  dob?: string;
  bloodGroup?: string;
  allergies?: string[];
  isPrimary?: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  originalName: string;
  category: CategoryType;
  subCategory: string;
  fileType: 'pdf' | 'image' | 'doc' | 'sheet';
  size: number; // bytes
  uploadDate: string;
  expiryDate?: string;
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean; // in recycle bin
  deletedAt?: string;
  encrypted: boolean;
  encryptionKeyHash?: string;
  version: number;
  versions?: { version: number; date: string; size: number; note: string }[];
  fileUrl: string; // Base64 or object URL
  previewUrl?: string;
  ocrText?: string;
  aiSummary?: string;
  extractedMetadata?: Record<string, string>;
  sharedLinks?: SharedLink[];
  accessLogs?: AccessLog[];
  ownerProfileId: string;
  sharedProfileIds?: string[];
}

export interface ShareAccessLog {
  id: string;
  timestamp: string;
  ip: string;
  city: string;
  country: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge';
  action: 'View' | 'Download' | 'Print' | 'Save Image' | 'Copy Text' | 'AI Explanation' | 'Failed Password' | 'Failed OTP';
  durationSeconds?: number;
  status: 'Success' | 'Denied' | 'Failed';
}

export interface SecureShare {
  shareId: string; // e.g. "8XFa7L2PmA"
  documentId: string;
  documentName: string;
  documentCategory: CategoryType;
  documentFileType: 'pdf' | 'image' | 'doc' | 'sheet';
  ownerId: string;
  ownerName: string;
  createdDate: string; // ISO
  expiryDate: string | null; // ISO string or null for Never
  passwordEnabled: boolean;
  password?: string;
  otpEnabled: boolean;
  otpCode?: string;
  emailVerificationEnabled: boolean;
  allowedEmails?: string[];
  viewCount: number;
  maxViews: number | null; // null for unlimited
  downloadEnabled: boolean;
  printEnabled: boolean;
  saveImageEnabled: boolean;
  copyTextEnabled: boolean;
  aiExplanationEnabled: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
  notifyOnView: boolean;
  notifyOnDownload: boolean;
  status: 'active' | 'revoked' | 'expired' | 'max_views_reached';
  lastAccessDate?: string;
  accessAnalytics: ShareAccessLog[];
}

export interface SharedLink {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  usesCount: number;
  isOneTime: boolean;
  watermarkText?: string;
  passwordProtected: boolean;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  action: 'View' | 'Download' | 'Share' | 'Decrypt' | 'AI Summary' | 'OCR';
  user: string;
  ip: string;
  device: string;
  status: 'Success' | 'Denied' | 'Warning';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  avatarUrl?: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  dob: string;
  address: string;
  bio?: string;
  joinedDate?: string;
  securityPin?: string;
  isAvatarLocked?: boolean;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalProfile: {
    allergies: string[];
    chronicConditions: string[];
    medications: string[];
    primaryDoctor: string;
    hospitalPreference: string;
    insurancePolicyNo: string;
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    loginAlerts: boolean;
    autoLockMinutes: number;
    lastPasswordChange: string;
    trustedDevicesCount: number;
  };
}

export interface ReminderItem {
  id: string;
  title: string;
  category: 'Medicine' | 'Passport Renewal' | 'License Renewal' | 'Insurance Renewal' | 'Vaccination' | 'Medical Checkup' | 'Custom';
  dueDate: string;
  recurring: 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  completed: boolean;
  priority?: 'Low' | 'Medium' | 'High';
  documentId?: string;
  notes?: string;
  createdAt: string;
  assignedProfileId?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event: string;
  category: 'Auth' | 'Document' | 'Encryption' | 'Admin' | 'System';
  user: string;
  ip: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  details: string;
}

export interface StorageStats {
  totalAllocatedGB: number;
  totalUsedBytes: number;
  usedGB?: number;
  categoryUsage: Record<CategoryType, number>; // in bytes
  totalDocumentsCount: number;
  encryptedDocumentsCount: number;
  expiredDocumentsCount: number;
  expiringSoonCount: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedDocIds?: string[];
  latencyMs?: number;
}
