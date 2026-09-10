import express from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import db from './db.js';
import {
  resolveWilayah, resolveKabupaten, resolveKecamatan,
  normalizeKolektibilitas, isBermasalah, KOLEK_BERMASALAH,
} from './wilayah.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CATATAN: rute ini dulu terdaftar sebagai POST /api/upload dan tertutup total
// oleh handler upload lampiran di server.ts yang terdaftar lebih dahulu
// (multer .single('file') vs .array('files') -> LIMIT_UNEXPECTED_FILE / 500).
// Sekarang dipisah supaya keduanya bisa hidup berdampingan.
router.post('/reports/upload', upload.array('files'), (req, res) => {
  console.log('--- POST /api/reports/upload HIT! ---');
  console.log('Files received:', req.files ? (req.files as any[]).length : 0);
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results: string[] = [];

    // Process each uploaded file
    for (const file of files) {
      const filename = file.originalname;
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      
      // Simple router based on filename patterns
      if (filename.toLowerCase().includes('neraca')) {
        processNeraca(workbook);
        results.push(`Processed Neraca: ${filename}`);
      } else if (filename.toLowerCase().includes('rekap') || filename.toLowerCase().includes('npl')) {
        processRekapKredit(workbook);
        results.push(`Processed Rekap Kredit: ${filename}`);
      // Pola yang lebih spesifik harus diperiksa lebih dulu. Berkas
      // "Nom Depo Baru Agust 26.xls" mengandung "nom depo" DAN "depo baru";
      // pada urutan sebelumnya ia selalu tertangkap processNomDepo sehingga
      // laporan deposito baru tidak pernah diproses sebagai laporan pembukaan.
      } else if (filename.toLowerCase().includes('depo baru')) {
        processDepoBaru(workbook);
        results.push(`Processed Deposito Baru: ${filename}`);
      } else if (filename.toLowerCase().includes('tab baru')) {
        processTabBaru(workbook);
        results.push(`Processed Tabungan Baru: ${filename}`);
      } else if (filename.toLowerCase().includes('nom tab')) {
        processNomTab(workbook);
        results.push(`Processed Nominatif Tabungan: ${filename}`);
      } else if (filename.toLowerCase().includes('nom depo')) {
        processNomDepo(workbook);
        results.push(`Processed Nominatif Deposito: ${filename}`);
      } else if (filename.toLowerCase().includes('data aji') || filename.toLowerCase().includes('kredit')) {
        processNomKredit(workbook);
        results.push(`Processed Jadwal Tagihan/Mutasi Kredit: ${filename}`);
      } else {
        results.push(`Skipped unknown file: ${filename}`);
      }
    }

    res.json({ message: 'Files processed successfully', results });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    res.status(500).json({ error: 'Failed to process files', details: error.message });
  }
});

router.get('/metrics', (req, res) => {
  try {
    const macro = db.prepare(`
      SELECT 
        (SELECT npl_percentage FROM macro_financials WHERE npl_percentage IS NOT NULL ORDER BY period_date DESC LIMIT 1) as npl_percentage,
        (SELECT repayment_rate FROM macro_financials WHERE repayment_rate IS NOT NULL ORDER BY period_date DESC LIMIT 1) as repayment_rate,
        (SELECT total_outstanding FROM macro_financials WHERE total_outstanding IS NOT NULL ORDER BY period_date DESC LIMIT 1) as total_outstanding,
        (SELECT total_tabungan FROM macro_financials WHERE total_tabungan IS NOT NULL ORDER BY period_date DESC LIMIT 1) as total_tabungan,
        (SELECT total_deposito FROM macro_financials WHERE total_deposito IS NOT NULL ORDER BY period_date DESC LIMIT 1) as total_deposito,
        (SELECT current_year_profit FROM macro_financials WHERE current_year_profit IS NOT NULL ORDER BY period_date DESC LIMIT 1) as current_year_profit,
        (SELECT total_assets FROM macro_financials WHERE total_assets IS NOT NULL ORDER BY period_date DESC LIMIT 1) as total_assets
    `).get() as any;
    
    // Map DB columns to Frontend macroMetrics shape
    if (macro) {
      res.json({
        npl: macro.npl_percentage || 0,
        rr: macro.repayment_rate || 0,
        outstandingKredit: macro.total_outstanding || 0,
        totalTabungan: macro.total_tabungan || 0,
        totalDeposito: macro.total_deposito || 0,
        labaTahunBerjalan: macro.current_year_profit || 0,
        totalAset: macro.total_assets || 0,
        aoProgress: db.prepare('SELECT ao_name as name, (achieved / target) * 100 as progress FROM ao_performance WHERE achieved > 0 ORDER BY progress DESC LIMIT 10').all(),
        top10Kredit: db.prepare("SELECT borrower_name as borrowerName, outstanding_amount as plafon, kolektibilitas as status, 'LOAN-' || id as applicationId FROM ews_alerts ORDER BY outstanding_amount DESC LIMIT 10").all()
      });
    } else {
      res.json(null);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ews', (req, res) => {
  try {
    const alerts = db.prepare('SELECT * FROM ews_alerts ORDER BY updated_at DESC').all();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Agregat untuk Dashboard Heat Map & Risiko Pembiayaan (PE Kepatuhan).
 *
 * Seluruh angka dihitung dari tabel `loans` hasil upload nominatif kredit.
 * "Bermasalah" = NPL standar OJK (kolektibilitas KL, D, M) — lihat
 * KOLEK_BERMASALAH di backend/wilayah.ts.
 */
router.get('/kepatuhan/heatmap', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) AS n FROM loans').get() as { n: number };
    if (!total.n) {
      // Belum ada data terunggah — beri tahu frontend supaya menampilkan
      // keadaan kosong, bukan angka nol yang menyesatkan.
      return res.json({ tersedia: false, alasan: 'Belum ada data nominatif kredit yang diunggah.' });
    }

    const NPL = KOLEK_BERMASALAH.map(k => `'${k}'`).join(',');
    const bermasalah = `collectibility IN (${NPL})`;

    const portofolioWilayah = db.prepare(`
      SELECT
        kabupaten                                                   AS wilayah,
        COUNT(*)                                                    AS totalNasabah,
        COALESCE(SUM(outstanding), 0)                               AS totalBakiDebet,
        SUM(CASE WHEN ${bermasalah} THEN 1 ELSE 0 END)              AS nasabahBermasalah,
        COALESCE(SUM(CASE WHEN ${bermasalah} THEN outstanding ELSE 0 END), 0) AS bakiDebetBermasalah
      FROM loans
      WHERE kabupaten IS NOT NULL
      GROUP BY kabupaten
      ORDER BY nasabahBermasalah DESC
    `).all();

    const portofolioAO = db.prepare(`
      SELECT
        COALESCE(NULLIF(TRIM(officer_name), ''), 'Tanpa AO')        AS ao,
        COUNT(*)                                                    AS totalNasabah,
        SUM(CASE WHEN ${bermasalah} THEN 1 ELSE 0 END)              AS nasabahBermasalah,
        COALESCE(SUM(CASE WHEN ${bermasalah} THEN outstanding ELSE 0 END), 0) AS bakiDebetBermasalah
      FROM loans
      GROUP BY ao
      HAVING nasabahBermasalah > 0
      ORDER BY nasabahBermasalah DESC
    `).all();

    /** Rasio bermasalah per kategori (sektor / tujuan). */
    const perKategori = (kolom: 'sektor' | 'tujuan') => db.prepare(`
      SELECT
        ${kolom}                                                    AS kategori,
        COUNT(*)                                                    AS total,
        SUM(CASE WHEN ${bermasalah} THEN 1 ELSE 0 END)              AS bermasalah,
        ROUND(SUM(CASE WHEN ${bermasalah} THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 1) AS rasio
      FROM loans
      WHERE ${kolom} IS NOT NULL AND TRIM(${kolom}) != ''
      GROUP BY ${kolom}
      ORDER BY rasio DESC
    `).all();

    /** Rasio bermasalah per kategori dipecah per wilayah — pewarna heat map 2 & 3. */
    const perKategoriWilayah = (kolom: 'sektor' | 'tujuan') => {
      const baris = db.prepare(`
        SELECT
          ${kolom}   AS kategori,
          kabupaten  AS wilayah,
          ROUND(SUM(CASE WHEN ${bermasalah} THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 1) AS rasio
        FROM loans
        WHERE kabupaten IS NOT NULL AND ${kolom} IS NOT NULL AND TRIM(${kolom}) != ''
        GROUP BY ${kolom}, kabupaten
      `).all() as { kategori: string; wilayah: string; rasio: number }[];

      const peta: Record<string, Record<string, number>> = {};
      for (const b of baris) {
        (peta[b.kategori] ??= {})[b.wilayah] = b.rasio;
      }
      return peta;
    };

    const nasabahBermasalah = db.prepare(`
      SELECT
        account_number AS id, kabupaten AS wilayah, kecamatan,
        COALESCE(NULLIF(TRIM(officer_name), ''), 'Tanpa AO') AS ao,
        customer_name AS nama, collectibility AS kolektibilitas,
        sektor, tujuan,
        outstanding AS bakiDebet,
        (COALESCE(tunggakan_pokok, 0) + COALESCE(tunggakan_bunga, 0)) AS tunggakan,
        jumlah_tagihan AS jumlahTagihan, jumlah_angsuran AS jumlahAngsuran
      FROM loans
      WHERE ${bermasalah}
      ORDER BY outstanding DESC
      LIMIT 500
    `).all();

    const ringkas = db.prepare(`
      SELECT
        COUNT(*)                                                    AS totalNasabah,
        COALESCE(SUM(limit_amount), 0)                              AS totalPembiayaan,
        COALESCE(SUM(outstanding), 0)                               AS bakiDebet,
        SUM(CASE WHEN ${bermasalah} THEN 1 ELSE 0 END)              AS nasabahBermasalah,
        COALESCE(SUM(CASE WHEN ${bermasalah} THEN outstanding ELSE 0 END), 0) AS bakiDebetBermasalah
      FROM loans
    `).get() as any;

    const tanpaWilayah = db.prepare('SELECT COUNT(*) AS n FROM loans WHERE kabupaten IS NULL').get() as { n: number };

    /*
     * Angka RESMI berasal dari Laporan Rekap Nominatif Kredit, bukan dihitung
     * ulang dari nominatif kredit. Nominatif kredit adalah "Jadwal Tagihan"
     * — sebuah irisan portofolio pada tanggal tertentu — sehingga NPL yang
     * dihitung darinya tidak akan sama persis dengan yang dilaporkan ke OJK.
     * Keduanya ditampilkan berdampingan agar selisihnya terlihat, bukan
     * disembunyikan.
     */
    const resmi = db.prepare(`
      SELECT period_date AS periode, npl_percentage AS npl, repayment_rate AS rr,
             total_outstanding AS outstanding
      FROM macro_financials
      WHERE npl_percentage IS NOT NULL
      ORDER BY period_date DESC
      LIMIT 1
    `).get() ?? null;

    res.json({
      tersedia: true,
      ringkas: {
        ...ringkas,
        rasioBermasalah: ringkas.totalNasabah
          ? Number(((ringkas.nasabahBermasalah / ringkas.totalNasabah) * 100).toFixed(1))
          : 0,
      },
      portofolioWilayah,
      portofolioAO,
      rasioSektor: perKategori('sektor'),
      rasioTujuan: perKategori('tujuan'),
      sektorPerWilayah: perKategoriWilayah('sektor'),
      tujuanPerWilayah: perKategoriWilayah('tujuan'),
      nasabahBermasalah,
      resmi,
      diagnostik: {
        totalBaris: total.n,
        tanpaWilayah: tanpaWilayah.n,
        definisiBermasalah: KOLEK_BERMASALAH.join(', '),
      },
    });
  } catch (error: any) {
    console.error('Heatmap aggregate error:', error);
    res.status(500).json({ error: error.message });
  }
});
/* ------------------------------------------------------------------ helper umum */

/**
 * Ekspor nominatif kredit dari core banking menuliskan SETIAP DIGIT sebagai
 * HTML numeric character reference tanpa titik koma: "&#51&#56.&#55..."
 * adalah "38.769.000,00". Tanpa didekode, Baki Debet Rp 38.769.000 terbaca
 * menjadi 5156,55 — seluruh angka di dashboard jadi karangan.
 *
 * Berkas lain (tabungan, deposito, neraca, rekap) tidak terpengaruh, dan
 * dekoder ini tidak mengubah teks yang memang bersih.
 */
const decodeEntitas = (v: unknown): string =>
  String(v ?? '').replace(/&#(\d+);?/g, (_, d) => String.fromCharCode(Number(d)));

const teks = (v: unknown): string => decodeEntitas(v).replace(/\s+/g, ' ').trim();

const angka = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const bersih = decodeEntitas(v)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')   // titik pemisah ribuan
    .replace(',', '.');              // koma desimal
  const n = parseFloat(bersih);
  return Number.isFinite(n) ? n : 0;
};

const BULAN_ID = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
];

/**
 * Tanggal periode laporan, dibaca dari kop berkas.
 *
 * Sebelumnya SEMUA hasil parsing ditulis ke period_date '2026-07-31' yang
 * ditulis tetap di dalam kode, sehingga mengunggah laporan bulan mana pun
 * selalu menimpa baris yang sama dan riwayat antar periode tidak pernah
 * terbentuk.
 *
 * Mengembalikan null bila tidak ketemu — pemanggil yang memutuskan apakah
 * menolak berkas atau memakai tanggal hari ini.
 */
function bacaPeriode(rows: any[][], batasBaris = 15): string | null {
  for (let r = 0; r < Math.min(rows.length, batasBaris); r++) {
    for (const sel of rows[r] ?? []) {
      const s = teks(sel).toLowerCase();
      if (!s) continue;

      // "31 Juli 2026", "Per : 31 Agustus 2026", "Per Tanggal : 30 Juni 2026"
      const m = s.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
      if (m) {
        const bln = BULAN_ID.indexOf(m[2]);
        if (bln >= 0) {
          const d = new Date(Date.UTC(Number(m[3]), bln, Number(m[1])));
          return d.toISOString().slice(0, 10);
        }
      }

      // "01/08/2026"
      const m2 = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m2) {
        const d = new Date(Date.UTC(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1])));
        return d.toISOString().slice(0, 10);
      }
    }
  }
  return null;
}

/** Akhir bulan dari sebuah tanggal — dipakai menyeragamkan periode laporan. */
const akhirBulan = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00Z');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
};

const hariIni = () => new Date().toISOString().slice(0, 10);

/** Tulis satu kolom macro_financials tanpa menimpa kolom lain pada periode sama. */
function simpanMacro(periode: string, nilai: Record<string, number | null>) {
  const kolom = Object.keys(nilai).filter(k => nilai[k] !== null);
  if (kolom.length === 0) return;

  db.prepare(`INSERT OR IGNORE INTO macro_financials (period_date) VALUES (?)`).run(periode);
  const set = kolom.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE macro_financials SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE period_date = ?`)
    .run(...kolom.map(k => nilai[k]), periode);
}

/** Cari baris berlabel tertentu lalu ambil angka di kolom sebelahnya. */
function nilaiBerlabel(rows: any[][], cocok: (label: string) => boolean): number | null {
  for (const row of rows) {
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const label = teks(row[c]).toLowerCase();
      if (!label || !cocok(label)) continue;
      for (let j = c + 1; j < Math.min(c + 3, row.length); j++) {
        const v = angka(row[j]);
        if (v !== 0) return v;
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ NERACA */

/**
 * Peran berkas: rincian produk simpanan (Tabungan Umum/Wajib/Kejar,
 * Deposito 3/6/12 bulan) dan laba tahun berjalan.
 *
 * Versi sebelumnya memakai nilai cadangan yang ditulis tetap di dalam kode
 * (laba 181.325.116,58; aset 37.712.478.085; depo 3 bulan 1.120.000.000; dst).
 * Angka-angka itu persis isi Neraca 31 Juli 2026 — artinya bila Neraca bulan
 * lain gagal diurai, dashboard diam-diam menampilkan angka Juli 2026 seolah
 * data terbaru. Semua cadangan itu dibuang; kolom yang tidak ditemukan
 * dibiarkan kosong dan dicatat di log.
 */
function processNeraca(workbook: xlsx.WorkBook) {
  const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('NERACA')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const periode = bacaPeriode(rows) ?? hariIni();

  const persis = (target: string) => (l: string) => l === target;

  const laba = nilaiBerlabel(rows, persis('laba tahun berjalan'));
  const aset = nilaiBerlabel(rows, l => l === 'aset' || l === 'jumlah aset' || l === 'total aset');
  const kewajiban = nilaiBerlabel(rows, l => l === 'kewajiban' || l === 'jumlah kewajiban');

  const tabUmum = nilaiBerlabel(rows, persis('tabungan umum'));
  const tabWajib = nilaiBerlabel(rows, persis('tabungan wajib'));
  const tabKejar = nilaiBerlabel(rows, persis('tabungan kejar'));
  const depo3 = nilaiBerlabel(rows, persis('deposito 3 bulan'));
  const depo6 = nilaiBerlabel(rows, persis('deposito 6 bulan'));
  const depo12 = nilaiBerlabel(rows, persis('deposito 12 bulan'));

  simpanMacro(periode, {
    current_year_profit: laba,
    total_assets: aset,
    total_liabilities: kewajiban,
  });

  const breakdown = db.prepare(`
    INSERT INTO funding_breakdowns (period_date, account_type, amount)
    VALUES (?, ?, ?)
    ON CONFLICT(period_date, account_type) DO UPDATE SET amount = excluded.amount, updated_at = CURRENT_TIMESTAMP
  `);

  const rincian: [string, number | null][] = [
    ['Tabungan Umum', tabUmum],
    ['Tabungan Wajib', tabWajib],
    ['Tabungan Kejar', tabKejar],
    ['Deposito 3 Bulan', depo3],
    ['Deposito 6 Bulan', depo6],
    ['Deposito 12 Bulan', depo12],
  ];

  const hilang: string[] = [];
  for (const [nama, nilai] of rincian) {
    if (nilai === null) { hilang.push(nama); continue; }
    breakdown.run(periode, nama, nilai);
  }

  console.log(`Neraca ${periode}: laba=${laba ?? '-'} aset=${aset ?? '-'}, ${rincian.length - hilang.length}/${rincian.length} rincian simpanan tersimpan.`);
  if (hilang.length) console.warn('⚠️  Neraca: baris tidak ditemukan ->', hilang.join(', '));
}

/* ------------------------------------------------------------------ REKAP KREDIT */

/**
 * Peran berkas: sumber resmi NPL dan Repayment Rate.
 *
 * RR = persentase kredit Lancar (kolom Persen pada baris "L"). Sebelumnya RR
 * ditulis tetap 71.84 di dalam kode — kebetulan sama dengan isi berkas Juni
 * 2026, sehingga tidak pernah berubah walau laporan bulan lain diunggah.
 *
 * NPL dihitung dari NOMINAL baki debet (KL+D+M dibagi total), sesuai cara BPR
 * melaporkannya ke OJK — bukan dari jumlah rekening.
 */
function processRekapKredit(workbook: xlsx.WorkBook) {
  const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('NPL') || n.toUpperCase().includes('REKAP')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const periode = bacaPeriode(rows) ?? hariIni();

  // Cari baris header tabel: Kode | Keterangan | Jml Rek | Jumlah Pinjaman | Baki Debet | Persen
  let kolBaki = -1, kolPersen = -1, kolRek = -1, barisHeader = -1;
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r] ?? [];
    const label = row.map(c => teks(c).toLowerCase());
    const iBaki = label.findIndex(l => l.includes('baki debet'));
    if (iBaki < 0) continue;
    barisHeader = r;
    kolBaki = iBaki;
    kolPersen = label.findIndex(l => l.startsWith('persen'));
    kolRek = label.findIndex(l => l.includes('jml rek') || l.includes('jumlah rek'));
    break;
  }

  if (barisHeader < 0) {
    console.warn('⚠️  Rekap kredit: tabel kolektibilitas tidak ditemukan, berkas dilewati.');
    return;
  }

  const perKolek: Record<string, { rek: number; baki: number; persen: number }> = {};
  let totalBaki = 0;

  for (let r = barisHeader + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const kode = teks(row[0]).toUpperCase();
    const ket = teks(row[1]).toLowerCase().replace(/\s+/g, '');

    if (ket.startsWith('jumlah')) {
      totalBaki = angka(row[kolBaki]);
      break;
    }
    if (!['L', 'DPK', 'KL', 'D', 'M'].includes(kode)) continue;

    perKolek[kode] = {
      rek: kolRek >= 0 ? angka(row[kolRek]) : 0,
      baki: angka(row[kolBaki]),
      persen: kolPersen >= 0 ? angka(row[kolPersen]) : 0,
    };
  }

  if (Object.keys(perKolek).length === 0) {
    console.warn('⚠️  Rekap kredit: tidak ada baris kolektibilitas terbaca.');
    return;
  }

  if (!totalBaki) totalBaki = Object.values(perKolek).reduce((s, v) => s + v.baki, 0);

  const bakiNpl = ['KL', 'D', 'M'].reduce((s, k) => s + (perKolek[k]?.baki ?? 0), 0);
  const npl = totalBaki ? (bakiNpl / totalBaki) * 100 : 0;

  // RR = persentase kredit lancar. Pakai kolom Persen bila ada; kalau tidak,
  // hitung sendiri dari baki debet Lancar.
  const rr = perKolek.L?.persen || (totalBaki ? ((perKolek.L?.baki ?? 0) / totalBaki) * 100 : 0);

  simpanMacro(periode, {
    total_outstanding: totalBaki,
    npl_percentage: Number(npl.toFixed(2)),
    repayment_rate: Number(rr.toFixed(2)),
  });

  const ringkas = Object.entries(perKolek).map(([k, v]) => `${k}:${v.rek}`).join(' ');
  console.log(`Rekap kredit ${periode}: baki=${Math.round(totalBaki)} NPL=${npl.toFixed(2)}% RR=${rr.toFixed(2)}% (${ringkas})`);
}

/* ------------------------------------------------------------------ NOMINATIF TABUNGAN */

/**
 * Peran berkas: total tabungan, dan daftar rekening tabungan.
 * Sebelumnya totalnya hanya dicetak ke log dan tidak pernah disimpan.
 */
function processNomTab(workbook: xlsx.WorkBook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const periode = bacaPeriode(rows) ?? hariIni();
  const { header, kolom } = petakanKolomSimpanan(rows, 'TABUNGAN');
  if (kolom.saldo === undefined) {
    console.warn('⚠️  Nominatif tabungan: kolom saldo tidak ditemukan.');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO savings (account_number, customer_name, interest_rate, balance, officer_name, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(account_number) DO UPDATE SET
      customer_name = excluded.customer_name, interest_rate = excluded.interest_rate,
      balance = excluded.balance, officer_name = excluded.officer_name,
      updated_at = CURRENT_TIMESTAMP
  `);

  let total = 0, n = 0;
  db.transaction(() => {
    for (let r = header + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const rek = teks(row[kolom.rekening]);
      const nama = teks(row[kolom.nama]);
      if (!rek || !nama) continue;

      const saldo = angka(row[kolom.saldo]);
      insert.run(rek, nama, kolom.bunga !== undefined ? angka(row[kolom.bunga]) : null,
        saldo, kolom.ao !== undefined ? teks(row[kolom.ao]) : null);
      total += saldo;
      n++;
    }
  })();

  simpanMacro(periode, { total_tabungan: total });
  console.log(`Nominatif tabungan ${periode}: ${n} rekening, total ${Math.round(total)}`);
}

/* ------------------------------------------------------------------ NOMINATIF DEPOSITO */

/** Peran berkas: total deposito, dan daftar rekening deposito. */
function processNomDepo(workbook: xlsx.WorkBook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const periode = bacaPeriode(rows) ?? hariIni();
  const { header, kolom } = petakanKolomSimpanan(rows, 'DEPOSITO');
  if (kolom.saldo === undefined) {
    console.warn('⚠️  Nominatif deposito: kolom nominal tidak ditemukan.');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO deposits (account_number, customer_name, term, start_date, maturity_date,
                          interest_rate, balance, officer_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(account_number) DO UPDATE SET
      customer_name = excluded.customer_name, term = excluded.term,
      start_date = excluded.start_date, maturity_date = excluded.maturity_date,
      interest_rate = excluded.interest_rate, balance = excluded.balance,
      officer_name = excluded.officer_name, updated_at = CURRENT_TIMESTAMP
  `);

  let total = 0, n = 0;
  db.transaction(() => {
    for (let r = header + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const rek = teks(row[kolom.rekening]);
      const nama = teks(row[kolom.nama]);
      if (!rek || !nama) continue;

      const saldo = angka(row[kolom.saldo]);
      insert.run(
        rek, nama,
        kolom.jangka !== undefined ? teks(row[kolom.jangka]) : null,
        kolom.tglMulai !== undefined ? teks(row[kolom.tglMulai]) : null,
        kolom.tglJatuhTempo !== undefined ? teks(row[kolom.tglJatuhTempo]) : null,
        kolom.bunga !== undefined ? angka(row[kolom.bunga]) : null,
        saldo,
        kolom.ao !== undefined ? teks(row[kolom.ao]) : null,
      );
      total += saldo;
      n++;
    }
  })();

  simpanMacro(periode, { total_deposito: total });
  console.log(`Nominatif deposito ${periode}: ${n} rekening, total ${Math.round(total)}`);
}

/* ------------------------------------------------------------------ REKENING BARU */

/**
 * Peran kedua berkas "baru": pertumbuhan simpanan pada periode berjalan.
 *
 * processTabBaru sebelumnya menulis ke tabel ao_performance (pencapaian AO),
 * bukan ke pertumbuhan simpanan — dan processDepoBaru masih kerangka kosong,
 * sehingga laporan deposito baru tidak pernah menghasilkan apa pun.
 */
function prosesRekeningBaru(workbook: xlsx.WorkBook, jenis: 'TABUNGAN' | 'DEPOSITO') {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return;

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const periode = bacaPeriode(rows) ?? hariIni();
  const { header, kolom } = petakanKolomSimpanan(rows, jenis);
  if (kolom.saldo === undefined) {
    console.warn(`⚠️  ${jenis} baru: kolom nominal/saldo tidak ditemukan.`);
    return;
  }

  const insert = db.prepare(`
    INSERT INTO funding_growth (account_number, account_type, customer_name, open_date, balance, officer_name, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(account_number) DO UPDATE SET
      account_type = excluded.account_type, customer_name = excluded.customer_name,
      open_date = excluded.open_date, balance = excluded.balance,
      officer_name = excluded.officer_name, updated_at = CURRENT_TIMESTAMP
  `);

  let total = 0, n = 0;
  db.transaction(() => {
    for (let r = header + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const rek = teks(row[kolom.rekening]);
      const nama = teks(row[kolom.nama]);
      if (!rek || !nama) continue;

      const saldo = angka(row[kolom.saldo]);
      insert.run(rek, jenis, nama,
        kolom.tglMulai !== undefined ? teks(row[kolom.tglMulai]) : periode,
        saldo, kolom.ao !== undefined ? teks(row[kolom.ao]) : null);
      total += saldo;
      n++;
    }
  })();

  console.log(`${jenis} baru ${periode}: ${n} rekening, total ${Math.round(total)}`);
}

function processTabBaru(workbook: xlsx.WorkBook) {
  prosesRekeningBaru(workbook, 'TABUNGAN');
}

function processDepoBaru(workbook: xlsx.WorkBook) {
  prosesRekeningBaru(workbook, 'DEPOSITO');
}

/**
 * Pemetaan kolom untuk berkas simpanan (tabungan/deposito, lama maupun baru).
 * Judul kolomnya berbeda-beda antar laporan: "Saldo Akhir", "Jml Deposito",
 * "Saldo", "Nominal" — semuanya menunjuk nominal simpanan.
 */
function petakanKolomSimpanan(
  rows: any[][],
  jenis: 'TABUNGAN' | 'DEPOSITO',
): { header: number; kolom: Record<string, number> } {
  const POLA: Record<string, RegExp> = {
    rekening: /^(no\.?\s*)?rek(ening)?\.?$/i,
    nama: /^nama\s*(nasabah|peminjam|debitur)?$/i,
    saldo: jenis === 'DEPOSITO'
      ? /^(jml deposito|jumlah deposito|nominal|saldo( akhir)?)$/i
      : /^(saldo( akhir)?|nominal)$/i,
    bunga: /^suku bunga/i,
    ao: /^(ao|account officer|petugas)$/i,
    jangka: /^(jkw|jangka waktu)$/i,
    tglMulai: /^(tgl\.? (mulai|registrasi|register|valuta|trans)|tanggal (mulai|registrasi))/i,
    tglJatuhTempo: /^(tgl\.? (jth tempo|jt|jatuh tempo)|tanggal jatuh tempo)/i,
  };

  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r];
    if (!row) continue;
    const kolom: Record<string, number> = {};
    for (let c = 0; c < row.length; c++) {
      const sel = teks(row[c]);
      if (!sel) continue;
      for (const [nama, pola] of Object.entries(POLA)) {
        if (kolom[nama] === undefined && pola.test(sel)) kolom[nama] = c;
      }
    }
    if (kolom.rekening !== undefined && kolom.nama !== undefined && kolom.saldo !== undefined) {
      return { header: r, kolom };
    }
  }
  return { header: 11, kolom: {} };
}

/**
 * Cari baris header dan petakan nama kolom -> indeks.
 *
 * Menangani header dua baris (kolom bergabung): pada nominatif kredit,
 * "Tungakan" di baris atas membentang ke beberapa kolom dengan sub-judul
 * "Pokok / Bunga / Total" di baris bawah. Label induk dirambatkan ke kanan
 * lalu digabung dengan sub-judulnya, sehingga kolom 16 dikenali sebagai
 * "Tungakan Pokok" dan kolom 20 sebagai "Tungakan Total".
 *
 * Sebelumnya indeks kolom ditulis tetap (row[14], row[27], row[28]); satu
 * kolom bergeser di file CBS sudah cukup membuat seluruh data salah.
 */
function petakanKolom(data: any[][]): { header: number; kolom: Record<string, number> } {
  // Catatan ejaan: file asli menulis "Tungakan" (kurang satu g), dan kolom AO
  // diberi judul "Petugas". Keduanya harus ikut dikenali.
  const POLA: Record<string, RegExp> = {
    rekening: /^(no\.?\s*)?(rek|rekening|no rek)/i,
    nama: /^nama\s*(nasabah|debitur|peminjam)?/i,
    alamat: /^(alamat|almt)/i,
    kabupaten: /^(kabupaten|kab\.?|kota)$/i,
    kecamatan: /^kecamatan$/i,
    plafon: /^(plafon|plafond|limit|jumlah pinjaman)/i,
    bakiDebet: /^(baki\s*debet|outstanding|os|saldo pokok)/i,
    tunggakanPokok: /^tung+akan\s+pokok$/i,
    tunggakanBunga: /^tung+akan\s+bunga$/i,
    angsuran: /^jadwal angsuran.*total$/i,
    tagihan: /^(jumlah\s+)?tagihan$/i,
    kolektibilitas: /^(kol|kolek|kolektibilitas)$/i,
    ao: /^(ao|account officer|petugas|nama ao)$/i,
    sektor: /^sektor/i,
    tujuan: /^(tujuan|penggunaan)/i,
  };

  /** Gabungkan baris header dengan baris sub-header di bawahnya. */
  const labelGabungan = (baris: any[], sub: any[] | undefined): string[] => {
    const lebar = Math.max(baris.length, sub?.length ?? 0);
    const hasil: string[] = [];
    let induk = '';
    for (let c = 0; c < lebar; c++) {
      const atas = teks(baris[c]);
      if (atas) induk = atas;
      const bawah = sub ? teks(sub[c]) : '';
      // Kolom tanpa sub-judul memakai label induknya sendiri, tapi hanya pada
      // posisi aslinya — supaya "Baki Debet" tidak merambat ke kolom berikutnya.
      if (bawah) hasil[c] = `${induk} ${bawah}`.trim();
      else hasil[c] = atas;
    }
    return hasil;
  };

  for (let r = 0; r < Math.min(data.length, 25); r++) {
    const row = data[r];
    if (!row) continue;

    const label = labelGabungan(row, data[r + 1]);
    const kolom: Record<string, number> = {};
    for (let c = 0; c < label.length; c++) {
      const sel = label[c];
      if (!sel) continue;
      for (const [nama, pola] of Object.entries(POLA)) {
        if (kolom[nama] === undefined && pola.test(sel)) kolom[nama] = c;
      }
    }

    // header dianggap sah bila minimal nama + kolektibilitas ketemu
    if (kolom.nama !== undefined && kolom.kolektibilitas !== undefined) {
      // Bila baris berikutnya ikut terpakai sebagai sub-header, data mulai
      // dua baris di bawah.
      const adaSubHeader = (data[r + 1] ?? []).some((_: any, c: number) =>
        teks(data[r + 1][c]) && !teks(row[c]));
      return { header: adaSubHeader ? r + 1 : r, kolom };
    }
  }

  // cadangan: tata letak lama yang diasumsikan parser sebelumnya
  return {
    header: 7,
    kolom: { rekening: 2, nama: 3, bakiDebet: 14, kolektibilitas: 27, ao: 28 },
  };
}

function processNomKredit(workbook: xlsx.WorkBook) {
  const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('NOM_KREDIT') || n.toUpperCase().includes('AJI') || n.toUpperCase().includes('KREDIT')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;

  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const { header, kolom } = petakanKolom(data);
  console.log('Nominatif kredit — baris header:', header, 'kolom terdeteksi:', Object.keys(kolom).join(', '));

  const periode = new Date().toISOString().slice(0, 10);

  const insertLoan = db.prepare(`
    INSERT INTO loans (account_number, customer_name, address, limit_amount, outstanding,
                       tunggakan_pokok, tunggakan_bunga, collectibility, officer_name,
                       kabupaten, kecamatan, sektor, tujuan, jumlah_tagihan, jumlah_angsuran,
                       period_date, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(account_number) DO UPDATE SET
      customer_name = excluded.customer_name, address = excluded.address,
      limit_amount = excluded.limit_amount, outstanding = excluded.outstanding,
      tunggakan_pokok = excluded.tunggakan_pokok, tunggakan_bunga = excluded.tunggakan_bunga,
      collectibility = excluded.collectibility, officer_name = excluded.officer_name,
      kabupaten = excluded.kabupaten, kecamatan = excluded.kecamatan,
      sektor = excluded.sektor, tujuan = excluded.tujuan,
      jumlah_tagihan = excluded.jumlah_tagihan, jumlah_angsuran = excluded.jumlah_angsuran,
      period_date = excluded.period_date, updated_at = CURRENT_TIMESTAMP
  `);

  const insertEws = db.prepare(`
    INSERT INTO ews_alerts (borrower_name, ao_name, kolektibilitas, outstanding_amount, risk_level, status)
    VALUES (?, ?, ?, ?, ?, 'TERDETEKSI')
  `);

  db.prepare('DELETE FROM ews_alerts').run();

  let diproses = 0, tanpaWilayah = 0, bermasalah = 0;

  // Satu transaksi: ribuan baris nominatif jadi jauh lebih cepat, dan bila ada
  // baris rusak di tengah, tabel tidak tertinggal separuh terisi.
  const jalankan = db.transaction(() => {
    for (let r = header + 1; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;

      const nama = teks(row[kolom.nama]);
      const kolek = normalizeKolektibilitas(row[kolom.kolektibilitas]);
      // Baris tanpa kolektibilitas sah otomatis terbuang di sini — termasuk
      // baris header yang diulang di tengah berkas oleh CBS setiap ganti
      // halaman (nilainya harfiah "Kolek", "Petugas", "Kabupaten").
      if (!nama || !kolek) continue;

      const rekening = teks(row[kolom.rekening]) || `${periode}-${r}`;
      const alamat = teks(row[kolom.alamat]);

      // Kolom Kabupaten/Kecamatan tersendiri jauh lebih dapat dipercaya
      // daripada menebak dari teks alamat; alamat hanya dipakai bila kolom
      // itu tidak ada di berkas.
      const kabKolom = kolom.kabupaten !== undefined ? teks(row[kolom.kabupaten]) : '';
      const kecKolom = kolom.kecamatan !== undefined ? teks(row[kolom.kecamatan]) : '';

      let wilayah = resolveKabupaten(kabKolom);
      let kecamatan = wilayah || kecKolom ? resolveKecamatan(kecKolom, wilayah) : null;

      if (!wilayah) {
        const dariAlamat = resolveWilayah(`${kecKolom} ${alamat}`.trim());
        wilayah = dariAlamat.wilayah;
        kecamatan = kecamatan ?? dariAlamat.kecamatan;
      }
      if (!wilayah) tanpaWilayah++;

      const bakiDebet = angka(row[kolom.bakiDebet]);
      const tPokok = angka(row[kolom.tunggakanPokok]);
      const tBunga = angka(row[kolom.tunggakanBunga]);
      const angsuran = angka(row[kolom.angsuran]);
      // Bila kolom tagihan tidak ada di file, pakai total tunggakan sebagai proksi.
      const tagihan = kolom.tagihan !== undefined ? angka(row[kolom.tagihan]) : tPokok + tBunga;
      const ao = teks(row[kolom.ao]);

      insertLoan.run(
        rekening, nama, alamat, angka(row[kolom.plafon]), bakiDebet,
        tPokok, tBunga, kolek, ao,
        wilayah, kecamatan, teks(row[kolom.sektor]) || null, teks(row[kolom.tujuan]) || null,
        tagihan, angsuran, periode,
      );
      diproses++;

      if (isBermasalah(kolek)) {
        bermasalah++;
        insertEws.run(nama, ao, kolek, bakiDebet, kolek === 'KL' ? 'MEDIUM' : 'HIGH');
      }
    }
  });

  jalankan();

  console.log(`Nominatif kredit: ${diproses} baris, ${bermasalah} bermasalah (KL/D/M), ${tanpaWilayah} tanpa wilayah terdeteksi.`);
  if (tanpaWilayah > diproses * 0.3) {
    console.warn('⚠️  Lebih dari 30% baris tidak terpetakan ke kabupaten. Periksa kolom alamat / tambahkan alias di backend/wilayah.ts');
  }
}

export default router;
