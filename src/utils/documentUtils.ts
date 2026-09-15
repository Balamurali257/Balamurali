import { DocumentItem } from '../types';

/**
 * Downloads strictly the IMAGE of the document item (.png)
 * so that opening the downloaded file in photos or image viewers works
 * seamlessly with 100% image format compatibility.
 */
export async function downloadDocument(doc: DocumentItem): Promise<void> {
  try {
    const rawName = doc.originalName || doc.name;
    const cleanName = rawName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanName}_image.png`;

    // 1. Handle data:image URLs directly
    if (doc.fileUrl && doc.fileUrl.startsWith('data:image/')) {
      triggerImageDownload(doc.fileUrl, filename);
      return;
    }

    // 2. Handle remote image URLs (e.g. Unsplash, blob, http/https)
    if (doc.fileUrl && !doc.fileUrl.startsWith('data:application/pdf')) {
      const convertedPng = await convertImageToPngBase64(doc.fileUrl);
      if (convertedPng) {
        triggerImageDownload(convertedPng, filename);
        return;
      }
    }

    // 3. Fallback: Generate high-resolution Document Card PNG image
    const cardPng = await generateDocumentCardPng(doc);
    triggerImageDownload(cardPng, filename);
  } catch (err) {
    console.error('Error downloading document image:', err);
    alert('An error occurred while downloading the document image.');
  }
}

/**
 * Triggers browser image download via hidden <a> element
 */
function triggerImageDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts any image URL to a clean PNG Base64 Data URL using HTML Canvas
 */
function convertImageToPngBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 900;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };
  });
}

/**
 * Generates a full high-resolution 1200x1600 PNG Image of the document record
 */
async function generateDocumentCardPng(doc: DocumentItem): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark Slate Vault Canvas Background
  const grad = ctx.createLinearGradient(0, 0, 1200, 1500);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(1, '#1E293B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 1500);

  // Outer Border Frame
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, 1160, 1460);

  // 2. Header Banner
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(40, 40, 1120, 120);

  ctx.fillStyle = '#2563EB'; // Blue accent tab
  ctx.fillRect(40, 40, 16, 120);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('DIGITAL DOCUMENT VAULT', 80, 95);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('OFFICIAL ENCRYPTED DOCUMENT IMAGE RECORD', 80, 130);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px monospace';
  ctx.fillText(`ID: ${doc.id}`, 820, 95);
  ctx.fillText(`DATE: ${new Date(doc.uploadDate).toLocaleDateString()}`, 820, 125);

  // 3. Document Name & Category Title Block
  let currentY = 210;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(doc.name, 50, currentY);

  currentY += 45;

  ctx.fillStyle = '#3B82F6';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`Category: ${doc.category} (${doc.subCategory})`, 50, currentY);

  if (doc.expiryDate) {
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(`Expires: ${doc.expiryDate}`, 780, currentY);
  }

  currentY += 30;

  // Horizontal Divider Line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, currentY);
  ctx.lineTo(1150, currentY);
  ctx.stroke();

  currentY += 30;

  // 4. Try rendering main preview image if available
  if (doc.fileUrl && !doc.fileUrl.startsWith('data:application/pdf')) {
    try {
      const imgData = await loadImageElement(doc.fileUrl);
      if (imgData) {
        // Render framed image box
        ctx.fillStyle = '#020617';
        ctx.fillRect(50, currentY, 1100, 520);
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, currentY, 1100, 520);

        // Aspect ratio object-fit contain
        const maxW = 1060;
        const maxH = 480;
        let drawW = imgData.naturalWidth || maxW;
        let drawH = imgData.naturalHeight || maxH;

        const ratio = Math.min(maxW / drawW, maxH / drawH);
        drawW = drawW * ratio;
        drawH = drawH * ratio;

        const drawX = 50 + (1100 - drawW) / 2;
        const drawY = currentY + (520 - drawH) / 2;

        ctx.drawImage(imgData, drawX, drawY, drawW, drawH);
        currentY += 550;
      }
    } catch (e) {
      console.warn('Could not render image preview onto canvas:', e);
    }
  }

  // 5. AI Executive Summary Card
  if (doc.aiSummary && currentY < 1200) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(50, currentY, 1100, 140);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, currentY, 1100, 140);

    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('AI EXECUTIVE SUMMARY', 80, currentY + 38);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '20px sans-serif';
    wrapTextOnCanvas(ctx, doc.aiSummary, 80, currentY + 75, 1040, 28);

    currentY += 170;
  }

  // 6. OCR Text Block
  if (doc.ocrText && currentY < 1350) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(50, currentY, 1100, 180);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, currentY, 1100, 180);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('EXTRACTED OCR TEXT STREAM', 80, currentY + 35);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '17px monospace';
    wrapTextOnCanvas(ctx, doc.ocrText, 80, currentY + 70, 1040, 24);

    currentY += 200;
  }

  // 7. Official Vault Watermark Seal at bottom
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('✓ VERIFIED AES-256 ENCRYPTED VAULT RECORD', 50, 1430);

  ctx.fillStyle = '#64748B';
  ctx.font = '16px sans-serif';
  ctx.fillText('Generated by Personal Vault Security System', 780, 1430);

  return canvas.toDataURL('image/png');
}

/**
 * Utility to load image element with crossOrigin
 */
function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

/**
 * Utility to wrap canvas text nicely across lines
 */
function wrapTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

/**
 * Returns a fallback thumbnail SVG Data URL if an image fails to load
 */
export function getFallbackThumbnailUrl(docName: string, category: string): string {
  const bgColors: Record<string, string> = {
    Identity: '%231e3a8a',
    Medical: '%23881337',
    Financial: '%23064e3b',
    Property: '%237c2d12',
    Vehicle: '%234c1d95',
    Education: '%23164e63',
    Business: '%231f2937',
    Personal: '%23581c87',
  };

  const bg = bgColors[category] || '%231e293b';
  const cleanName = encodeURIComponent(docName.slice(0, 24));
  const cleanCat = encodeURIComponent(category.toUpperCase());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bg}"/>
    <rect x="20" y="20" width="360" height="260" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <path d="M160 80h80v20h-80zM140 120h120v10h-120zM140 145h120v10h-120zM140 170h80v10h-80z" fill="rgba(255,255,255,0.3)"/>
    <rect x="30" y="30" width="100" height="24" rx="12" fill="%232563eb"/>
    <text x="80" y="46" font-family="sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${cleanCat}</text>
    <text x="200" y="230" font-family="sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${cleanName}</text>
    <text x="200" y="255" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.6)" text-anchor="middle">ENCRYPTED VAULT DOCUMENT</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${svg}`;
}
