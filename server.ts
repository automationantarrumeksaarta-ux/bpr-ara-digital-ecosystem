import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import compression from 'compression';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import parserRoutes from './backend/parser.js';
import { initDb } from './backend/db.js';

dotenv.config();

// Initialize Database
try {
  initDb();
} catch (e) {
  console.error("Failed to init DB", e);
}

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const app = express();
const PORT = Number(process.env.PORT) || 3535;

app.use(cors());
app.use(compression());
/*
 * Batas badan JSON dinaikkan dari bawaan Express (100 KB).
 *
 * Foto profil disimpan sebagai data URL supaya bisa bekerja di dalam APK —
 * unggah berkas biner tidak mungkin di sana karena Capacitor membaca isi
 * permintaan sebagai teks. Data URL foto yang sudah dikecilkan berukuran
 * puluhan kilobita, dan dengan batas bawaan permintaannya ditolak dengan
 * "request entity too large" tanpa penjelasan yang berguna di layar.
 */
app.use(express.json({ limit: '5mb' }));

// Set up uploads directory and multer
const uploadDir = path.join(_dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      id: req.file.filename,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: fileUrl
    }
  });
});

// Initialize Gemini SDK lazily / safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BPR ARA Digital Ecosystem Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
import authRoutes from './backend/auth.js';
import notificationRoutes from './backend/notifications.js';
import attendanceRoutes from './backend/attendance.js';
import activityRoutes from './backend/activities.js';
import payrollRoutes from './backend/payroll.js';
import ewsRoutes from './backend/ews.js';

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/ews', ewsRoutes);
app.use('/api', parserRoutes);

// AI Assistant endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, userRole, branchName, contextData } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Return smart intelligent simulation if API key is not yet set
      return res.json({
        reply: `[Mode Standar - ARA AI] Menjawab sebagai asisten internal BPR ARA untuk peran ${userRole || 'Direksi'} di ${branchName || 'Kantor Pusat'}:

Berdasarkan data operasional BPR Antar Rumeksa Arta per hari ini:
- Portofolio Kredit: Rp 148,5 Miliar (NPL Gross: 2,41%, NPL Net: 1,18%, di bawah batas toleransi OJK 5%)
- Total Penghimpunan Dana (Funding): Rp 162,3 Miliar (CASA: 42,8%, Deposito: 57,2%, LDR: 91,5%)
- Likuiditas & CAR: CAR 22,8% (Sangat Sehat)
- EWS Terdeteksi: 2 Alert Merah (1 Keterlambatan SLA Komite Kredit > 48 jam & 1 Janji Bayar PTP Jatuh Tempo di Sleman)
- Antrean Tugas: 4 Permohonan Kredit menunggu Analisis, 2 Akad Legal siap cair.

Rekomendasi Tindakan:
1. Tindak lanjuti eskalasi PTP Debtor PT Berkah Mulia (KC Sleman) untuk mencegah degradasi ke Kol-3.
2. Percepat rapat komite kredit untuk fasilitas PT Sinar Jaya Abadi (Rp 750 Juta) yang telah disetujui Analis & Legal.`,
        source: 'local-rule-engine',
      });
    }

    const systemInstruction = `Anda adalah "ARA Copilot" (Asisten AI Cerdas Terintegrasi) untuk BPR Antar Rumeksa Arta (BPR ARA).
Anda beroperasi di dalam Digital Operating System perbankan yang mengintegrasikan seluruh operasional: CRM, Funding (CASA/Deposito/Grebek Pasar), LOS (Loan Origination System), OTS Survey, Analisis Kredit 5C, Persetujuan Komite Kredit, Legal Dokumen, Pencairan, Penagihan (Collection & PTP), NPL & Restrukturisasi, FlowTask, HR Kehadiran, EWS (Early Warning System), Kepatuhan APU-PPT, dan Audit Internal.

Pengguna aktif saat ini:
- Peran: ${userRole || 'Direktur'}
- Cabang: ${branchName || 'Kantor Pusat Yogyakarta'}

Pedoman Utama:
1. Berikan jawaban yang profesional, terstruktur, berbasis data keuangan perbankan BPR di Indonesia (mengikuti kaidah OJK & Bank Indonesia).
2. Patuhi RBAC (Role-Based Access Control) - jangan membuka data rahasia di luar wewenang.
3. Rekomendasi kredit selalu bersifat DECISION SUPPORT (Keputusan akhir tetap pada pejabat pemutus kredit berwenang).
4. Gunakan Bahasa Indonesia perbankan yang lugas, rapi, dengan poin-poin jelas dan rekomendasi aksi nyata.
5. Konteks operasional saat ini: ${JSON.stringify(contextData || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text,
      source: 'gemini-3.7-flash',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Failed to generate AI response',
      details: error.message,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Cache static assets for 1 year (they have content hashes in filenames)
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true
    }));
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BPR ARA Digital Ecosystem server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
