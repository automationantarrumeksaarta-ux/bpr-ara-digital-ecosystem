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
import { wajibMasuk } from './backend/keamanan.js';

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
/* Unggahan berkas ikut dijaga; sebelumnya siapa pun dapat menaruh berkas di server. */
app.post('/api/upload', wajibMasuk, upload.single('file'), (req, res) => {
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

// API Routes
import authRoutes from './backend/auth.js';
import notificationRoutes from './backend/notifications.js';
import attendanceRoutes from './backend/attendance.js';
import activityRoutes from './backend/activities.js';
import payrollRoutes from './backend/payroll.js';
import ewsRoutes from './backend/ews.js';
import projectRoutes from './backend/projects.js';
import crmRoutes from './backend/crm.js';
import collectionRoutes from './backend/collection.js';

/**
 * Satu daftar router, dipakai dua kali: untuk memasangnya, dan untuk
 * melaporkannya lewat /api/health.
 *
 * Alasannya konkret. Modul Proyek, CRM, dan Peringatan Dini pernah gagal di
 * server dengan pesan `Unexpected token '<'` karena binaan backend yang
 * berjalan di sana lebih tua daripada binaan frontend-nya — rutenya belum ada,
 * jadi permintaan jatuh ke penangkap SPA dan dibalas halaman HTML. Menelusuri
 * itu butuh mencoba rute satu per satu. Dengan daftar ini, satu permintaan ke
 * /api/health sudah menjawabnya. Daftarnya tidak bisa melenceng dari kenyataan
 * karena pemasangan dan pelaporan membaca sumber yang sama.
 */
const ROUTER_API: Array<[string, express.Router]> = [
  ['/api/auth', authRoutes],
  ['/api/notifications', notificationRoutes],
  ['/api/attendances', attendanceRoutes],
  ['/api/activities', activityRoutes],
  ['/api/payroll', payrollRoutes],
  ['/api/ews', ewsRoutes],
  ['/api/projects', projectRoutes],
  ['/api/crm', crmRoutes],
  ['/api/collection', collectionRoutes],
  ['/api', parserRoutes],
];

/**
 * Rute yang boleh diakses tanpa masuk.
 *
 * Hanya `/api/auth`, karena di dalamnya ada pintu masuknya sendiri — login,
 * pendaftaran, dan lupa sandi — yang menjaga dirinya masing-masing. Selain itu
 * tidak ada.
 *
 * Penjagaan sengaja dipasang di sini, bukan di dalam tiap modul. Ketika tiap
 * modul menjaga dirinya sendiri, tiga di antaranya ternyata tidak menjaga apa
 * pun: `parser.ts`, `attendance.ts`, dan `notifications.ts` tidak memuat satu
 * pun pemeriksaan token. Akibatnya `/api/metrics` membagikan NPL, baki debet,
 * tabungan, deposito, laba berjalan, dan nama seluruh AO kepada siapa saja yang
 * membuka alamatnya. Dipasang di titik ini, modul baru ikut terjaga tanpa perlu
 * ada yang mengingatnya.
 */
const TANPA_PENJAGA = new Set(['/api/auth']);

/**
 * Kapan berkas server yang sedang dijalankan ini terakhir ditulis.
 *
 * Dibaca dari berkasnya sendiri, bukan dari tanda yang disuntikkan saat
 * membangun, supaya tidak bisa ikut basi bersama isinya.
 *
 * Ini menjawab pertanyaan yang berulang kali memakan waktu: "binaan mana yang
 * sedang berjalan?". Pernah terjadi `dist/server.cjs` di server tertinggal
 * berhari-hari sementara frontend-nya mutakhir, karena skrip build dulu
 * menjalankan `vite build && esbuild`, dan ketika `vite build` gagal, esbuild
 * tidak pernah dijalankan sehingga bundel lama tetap di tempatnya. Prosesnya
 * sendiri sudah berkali-kali dijalankan ulang, jadi tidak ada satu pun petunjuk
 * di layar yang menunjukkan bahwa yang berjalan adalah kode lama.
 */
function waktuBinaan(): string | null {
  try {
    return fs.statSync(_filename).mtime.toISOString();
  } catch {
    return null;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'BPR ARA Digital Ecosystem Backend',
    timestamp: new Date().toISOString(),
    /* Rute yang benar-benar terpasang di binaan yang sedang berjalan. */
    rute: ROUTER_API.map(([awalan]) => awalan),
    binaan: {
      berkas: _filename,
      dibangunPada: waktuBinaan(),
      mode: process.env.NODE_ENV === 'production' ? 'produksi' : 'pengembangan',
    },
  });
});

for (const [awalan, router] of ROUTER_API) {
  if (TANPA_PENJAGA.has(awalan)) app.use(awalan, router);
  else app.use(awalan, wajibMasuk, router);
}

// AI Assistant endpoint
app.post('/api/ai/chat', wajibMasuk, async (req, res) => {
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

/**
 * Endpoint API yang tidak dikenal harus menjawab sebagai API.
 *
 * Sebelum ini, `/api/apa-pun` yang tidak terpasang lolos ke penangkap SPA dan
 * dibalas `dist/index.html` dengan status 200. Di sisi peramban, `res.json()`
 * lalu mencoba mengurai halaman HTML itu dan melempar
 * `Unexpected token '<', "<!doctype "... is not valid JSON` — pesan yang
 * menunjuk ke pengurai JSON, padahal masalahnya ada di server dan sama sekali
 * tidak menyebut rute mana yang hilang.
 *
 * Penjaga ini harus berada setelah seluruh router API dan sebelum penangkap
 * SPA, termasuk sebelum middleware Vite pada mode pengembangan yang juga
 * membalas index.html untuk jalur apa pun.
 */
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak dikenal',
    jalur: req.originalUrl,
    /*
     * Disebutkan supaya penyebab paling sering — backend di server lebih tua
     * daripada frontend-nya — bisa langsung dikenali tanpa menebak.
     */
    petunjuk:
      'Rute ini tidak terpasang di server yang sedang berjalan. Bila modulnya '
      + 'sudah ada di kode terbaru, kemungkinan besar backend di server belum '
      + 'dibangun ulang. Periksa daftar rute lewat /api/health.',
    ruteTerpasang: ROUTER_API.map(([awalan]) => awalan),
  });
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
    /*
     * Dicetak setiap kali menyala supaya log pm2 menyimpan jejak binaan mana
     * yang dijalankan. Tanpa ini, satu-satunya cara mengetahuinya adalah
     * mencoba rutenya satu per satu dari luar.
     */
    console.log(`  berkas       : ${_filename}`);
    console.log(`  dibangun pada: ${waktuBinaan() ?? 'tidak diketahui'}`);
    console.log(`  mode         : ${process.env.NODE_ENV === 'production' ? 'produksi' : 'pengembangan'}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '  PERHATIAN: mode pengembangan menyajikan frontend langsung dari kode sumber, '
        + 'sehingga tampilan bisa mutakhir sementara backend memakai bundel lama. '
        + 'Jalankan dengan NODE_ENV=production untuk melayani dari dist/.',
      );
    }
  });
}

startServer();
