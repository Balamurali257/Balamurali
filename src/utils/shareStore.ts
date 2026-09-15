import { SecureShare, ShareAccessLog, DocumentItem } from '../types';

const SHARE_STORAGE_KEY = 'carebuddy_secure_shares_v2';

// Seed initial demo shares for instant out-of-the-box demo
const INITIAL_DEMO_SHARES: SecureShare[] = [
  {
    shareId: '8XFa7L2PmA',
    documentId: 'doc_passport_01',
    documentName: 'US Official Passport - Alexander Wright',
    documentCategory: 'Identity',
    documentFileType: 'pdf',
    ownerId: 'usr_1',
    ownerName: 'Alexander Wright',
    createdDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    passwordEnabled: false,
    otpEnabled: false,
    emailVerificationEnabled: false,
    viewCount: 14,
    maxViews: 50,
    downloadEnabled: true,
    printEnabled: true,
    saveImageEnabled: true,
    copyTextEnabled: true,
    aiExplanationEnabled: true,
    watermarkEnabled: true,
    watermarkText: 'CAREBUDDY VAULT SHARE - CONFIDENTIAL',
    notifyOnView: true,
    notifyOnDownload: true,
    status: 'active',
    lastAccessDate: new Date(Date.now() - 3600000).toISOString(),
    accessAnalytics: [
      {
        id: 'acc_101',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ip: '192.168.1.45',
        city: 'New York',
        country: 'United States',
        device: 'Desktop',
        os: 'macOS',
        browser: 'Chrome',
        action: 'View',
        durationSeconds: 42,
        status: 'Success'
      },
      {
        id: 'acc_102',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ip: '172.56.21.9',
        city: 'San Francisco',
        country: 'United States',
        device: 'Mobile',
        os: 'iOS',
        browser: 'Safari',
        action: 'Download',
        status: 'Success'
      },
      {
        id: 'acc_103',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        ip: '82.165.197.1',
        city: 'London',
        country: 'United Kingdom',
        device: 'Tablet',
        os: 'iOS',
        browser: 'Safari',
        action: 'AI Explanation',
        status: 'Success'
      }
    ]
  },
  {
    shareId: '9M2pL04QkR',
    documentId: 'doc_medical_01',
    documentName: 'Comprehensive Blood Panel & Lipid Profile',
    documentCategory: 'Medical',
    documentFileType: 'pdf',
    ownerId: 'usr_1',
    ownerName: 'Alexander Wright',
    createdDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 24 * 3600000).toISOString(),
    passwordEnabled: true,
    password: '1234',
    otpEnabled: false,
    emailVerificationEnabled: false,
    viewCount: 6,
    maxViews: 10,
    downloadEnabled: true,
    printEnabled: true,
    saveImageEnabled: false,
    copyTextEnabled: true,
    aiExplanationEnabled: true,
    watermarkEnabled: true,
    watermarkText: 'MEDICAL SHARE - DR. MITCHELL CLINIC',
    notifyOnView: true,
    notifyOnDownload: true,
    status: 'active',
    lastAccessDate: new Date(Date.now() - 14400000).toISOString(),
    accessAnalytics: [
      {
        id: 'acc_201',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        ip: '198.51.100.22',
        city: 'Boston',
        country: 'United States',
        device: 'Desktop',
        os: 'Windows',
        browser: 'Edge',
        action: 'View',
        status: 'Success'
      }
    ]
  }
];

export function loadShares(): SecureShare[] {
  try {
    const raw = localStorage.getItem(SHARE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_SHARES));
      return INITIAL_DEMO_SHARES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load shares from storage:', err);
    return INITIAL_DEMO_SHARES;
  }
}

export function saveShares(shares: SecureShare[]): void {
  try {
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(shares));
  } catch (err) {
    console.error('Failed to save shares to storage:', err);
  }
}

export function generateShareId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function buildShareUrl(shareId: string): string {
  const origin = window.location.origin || 'https://carebuddy.app';
  return `${origin}/#s/${shareId}`;
}

export function buildSecureDownloadUrl(shareId: string): string {
  const origin = window.location.origin || 'https://carebuddy.app';
  return `${origin}/api/share/${shareId}/file`;
}

export function getShareById(shareId: string): SecureShare | null {
  const shares = loadShares();
  const share = shares.find((s) => s.shareId === shareId);
  if (!share) return null;

  // Check auto-expiration dynamically
  if (share.status === 'active') {
    if (share.expiryDate && new Date(share.expiryDate) < new Date()) {
      share.status = 'expired';
      saveShares(shares);
    } else if (share.maxViews !== null && share.viewCount >= share.maxViews) {
      share.status = 'max_views_reached';
      saveShares(shares);
    }
  }

  return share;
}

export function createShareForDocument(
  doc: DocumentItem,
  ownerName: string,
  settings: {
    expiryHours: number | null; // null for never
    passwordEnabled: boolean;
    password?: string;
    otpEnabled: boolean;
    emailVerificationEnabled: boolean;
    allowedEmails?: string[];
    maxViews: number | null;
    downloadEnabled: boolean;
    printEnabled: boolean;
    saveImageEnabled: boolean;
    copyTextEnabled: boolean;
    aiExplanationEnabled: boolean;
    watermarkEnabled: boolean;
    watermarkText?: string;
    notifyOnView: boolean;
    notifyOnDownload: boolean;
  }
): SecureShare {
  const shares = loadShares();
  const shareId = generateShareId();

  let expiryDateIso: string | null = null;
  if (settings.expiryHours !== null && settings.expiryHours > 0) {
    expiryDateIso = new Date(Date.now() + settings.expiryHours * 3600 * 1000).toISOString();
  }

  const newShare: SecureShare = {
    shareId,
    documentId: doc.id,
    documentName: doc.name,
    documentCategory: doc.category,
    documentFileType: doc.fileType,
    ownerId: doc.ownerProfileId || 'usr_1',
    ownerName: ownerName || 'Alexander Wright',
    createdDate: new Date().toISOString(),
    expiryDate: expiryDateIso,
    passwordEnabled: settings.passwordEnabled,
    password: settings.password || '',
    otpEnabled: settings.otpEnabled,
    otpCode: settings.otpEnabled ? Math.floor(100000 + Math.random() * 900000).toString() : undefined,
    emailVerificationEnabled: settings.emailVerificationEnabled,
    allowedEmails: settings.allowedEmails || [],
    viewCount: 0,
    maxViews: settings.maxViews,
    downloadEnabled: settings.downloadEnabled,
    printEnabled: settings.printEnabled,
    saveImageEnabled: settings.saveImageEnabled,
    copyTextEnabled: settings.copyTextEnabled,
    aiExplanationEnabled: settings.aiExplanationEnabled,
    watermarkEnabled: settings.watermarkEnabled,
    watermarkText: settings.watermarkText || `CAREBUDDY SHARE - ${shareId}`,
    notifyOnView: settings.notifyOnView,
    notifyOnDownload: settings.notifyOnDownload,
    status: 'active',
    accessAnalytics: []
  };

  shares.unshift(newShare);
  saveShares(shares);
  return newShare;
}

export function updateShareSettings(shareId: string, updates: Partial<SecureShare>): SecureShare | null {
  const shares = loadShares();
  const index = shares.findIndex((s) => s.shareId === shareId);
  if (index === -1) return null;

  shares[index] = { ...shares[index], ...updates };
  saveShares(shares);
  return shares[index];
}

export function revokeShareLink(shareId: string): SecureShare | null {
  return updateShareSettings(shareId, { status: 'revoked' });
}

export function recordShareAccess(
  shareId: string,
  logEntry: Omit<ShareAccessLog, 'id' | 'timestamp'>
): SecureShare | null {
  const shares = loadShares();
  const index = shares.findIndex((s) => s.shareId === shareId);
  if (index === -1) return null;

  const share = shares[index];
  const newLog: ShareAccessLog = {
    ...logEntry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString()
  };

  share.accessAnalytics.unshift(newLog);
  share.lastAccessDate = newLog.timestamp;

  if (logEntry.action === 'View' && logEntry.status === 'Success') {
    share.viewCount += 1;
    if (share.maxViews !== null && share.viewCount >= share.maxViews) {
      share.status = 'max_views_reached';
    }
  }

  saveShares(shares);
  return share;
}
