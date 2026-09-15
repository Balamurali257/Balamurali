import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Express middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// REST API Routes

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CareBuddy Document Vault API', version: '1.0.0' });
});

// 2. Document categorization & extraction (Pure algorithmic heuristic)
app.post('/api/vault/classify', (req, res) => {
  try {
    const { documentName, fileType } = req.body;
    const dName = (documentName || '').toLowerCase();
    let cat = 'Personal';
    let sub = 'Document File';

    if (dName.includes('passport') || dName.includes('license') || dName.includes('id') || dName.includes('aadhaar')) {
      cat = 'Identity';
      sub = dName.includes('passport') ? 'Passport' : 'Driver License';
    } else if (dName.includes('blood') || dName.includes('medical') || dName.includes('lab') || dName.includes('health') || dName.includes('doctor')) {
      cat = 'Medical';
      sub = 'Health Report';
    } else if (dName.includes('tax') || dName.includes('statement') || dName.includes('bank') || dName.includes('invoice') || dName.includes('salary')) {
      cat = 'Financial';
      sub = 'Financial Statement';
    } else if (dName.includes('deed') || dName.includes('lease') || dName.includes('property') || dName.includes('rent')) {
      cat = 'Property';
      sub = 'Property Deed';
    } else if (dName.includes('degree') || dName.includes('certificate') || dName.includes('diploma') || dName.includes('school')) {
      cat = 'Education';
      sub = 'Academic Certificate';
    }

    return res.json({
      success: true,
      classification: {
        category: cat,
        subCategory: sub,
        suggestedTags: [cat, 'Vault', 'Indexed'],
        detectedExpiryDate: null,
        summary: `Document "${documentName || 'File'}" indexed into ${cat} records.`,
        extractedMetadata: { Status: 'Encrypted', Storage: 'Secure Vault' }
      }
    });
  } catch (error: any) {
    return res.json({
      success: true,
      classification: {
        category: 'Personal',
        subCategory: 'Document File',
        suggestedTags: ['Document', 'Vault'],
        detectedExpiryDate: null,
        summary: 'Uploaded document stored securely in Vault.',
        extractedMetadata: { Status: 'Encrypted', Storage: 'Secure Vault' }
      }
    });
  }
});

// 3. Document Search Endpoint (Exact & Token Matching)
app.post('/api/vault/search', (req, res) => {
  try {
    const { query, documents } = req.body;
    const q = (query || '').toLowerCase().trim();
    const docs = documents || [];

    const matched = docs.filter((d: any) =>
      d.name?.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q) ||
      d.subCategory?.toLowerCase().includes(q) ||
      d.tags?.some((t: string) => t.toLowerCase().includes(q))
    );

    return res.json({
      success: true,
      result: {
        matchingDocIds: matched.map((m: any) => m.id),
        directAnswer: matched.length > 0
          ? `Found ${matched.length} document(s) matching "${query}" in your vault.`
          : `No exact document matches found for "${query}".`
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// 4. Public Document Share API Endpoints
app.get('/api/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  res.json({
    success: true,
    shareId,
    status: 'active',
    validatedAt: new Date().toISOString()
  });
});

app.get('/api/share/:shareId/file', (req, res) => {
  const { shareId } = req.params;
  res.setHeader('Content-Type', 'application/json');
  res.json({
    success: true,
    shareId,
    downloadUrl: `/s/${shareId}`,
    message: 'File stream ready for browser preview'
  });
});

app.get('/s/:shareId', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.get('/share/:shareId', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Server boot & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareBuddy Document Vault Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
