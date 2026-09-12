import express from 'express';
import { db } from './db.js';
import { wajibPeran, PERAN_LIHAT_NASABAH } from './keamanan.js';

/**
 * Collection & Recovery: kredit bermasalah, janji bayar, dan tindak lanjutnya.
 *
 * Ketiga modul penagihan — Collection Management, PTP Tracker, dan NPL
 * Restructuring — sebelumnya membaca array kosong dari berkas contoh, sementara
 * tabel `loans` sudah memuat 355 rekening lengkap dengan kolektibilitas,
 * tunggakan pokok dan bunga, frekuensi tunggakan, nama petugas, serta tanggal
 * jatuh tempo. Kredit bermasalah senilai miliaran rupiah sudah ada di sistem
 * dan modul penagihannya sama sekali tidak melihatnya.
 *
 * Lebih buruk lagi, tombol simpan pada PTP dan NPL dipasangi penangan kosong
 * `() => {}`. Petugas dapat mengisi formulir, menekan simpan, melihat barisnya
 * muncul sesaat, lalu hilang tanpa satu pun pesan galat. Berkas ini menyediakan
 * tempat penyimpanannya.
 *
 * Daftar kredit bermasalahnya sendiri tidak disimpan — ia dihitung ulang dari
 * `loans` setiap kali diminta, karena nominatif diunggah berkala dan salinan
 * yang mengendap akan menunjuk keadaan yang sudah lewat. Yang disimpan hanya
 * hasil pekerjaan petugas: janji bayar dan catatan tindak lanjut.
 */

const router = express.Router();

/** Kolektibilitas yang tergolong NPL menurut OJK. */
const NPL = ['KL', 'D', 'M'];

/** Kolektibilitas berkas nominatif ke bentuk yang dipakai tampilan. */
const KOL_TAMPILAN: Record<string, string> = {
  L: 'KOL_1', DPK: 'KOL_2', KL: 'KOL_3', D: 'KOL_4', M: 'KOL_5',
};

export function siapkanTabelCollection() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS janji_bayar (
      id              TEXT PRIMARY KEY,
      account_number  TEXT,
      debtor_name     TEXT NOT NULL,
      ao_name         TEXT,
      branch          TEXT,
      promise_date    TEXT NOT NULL,
      promised_amount REAL NOT NULL DEFAULT 0,
      status          TEXT NOT NULL DEFAULT 'MENUNGGU',
      notes           TEXT,
      contact_wa      TEXT,
      dibuat_oleh     TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_janji_bayar_rekening ON janji_bayar(account_number);

    -- Catatan tindak lanjut menempel pada nomor rekening, bukan pada baris
    -- tabel loans. Unggahan nominatif berikutnya menulis ulang seluruh isi
    -- loans, dan catatan penagihan tidak boleh ikut terhapus bersamanya.
    CREATE TABLE IF NOT EXISTS collection_tindakan (
      account_number TEXT PRIMARY KEY,
      action_status  TEXT,
      action_notes   TEXT,
      oleh           TEXT,
      updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
siapkanTabelCollection();

/** Selisih hari dari sebuah tanggal ke hari ini; 0 bila belum lewat. */
function hariTerlambat(jatuhTempo: string | null, frekTunggakan: number): number {
  if (jatuhTempo) {
    const t = new Date(jatuhTempo).getTime();
    if (Number.isFinite(t) && t < Date.now()) {
      return Math.floor((Date.now() - t) / 86_400_000);
    }
  }
  /*
   * Bila belum lewat jatuh tempo, keterlambatannya diperkirakan dari frekuensi
   * tunggakan. Ini perkiraan, bukan hitungan hari sungguhan — nominatif memang
   * tidak menyimpan tanggal pembayaran terakhir.
   */
  return Math.max(0, Number(frekTunggakan) || 0) * 30;
}

/* ------------------------------------------------------- kredit bermasalah */

router.get('/kredit-bermasalah', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  try {
    const baris = db.prepare(`
      SELECT account_number, customer_name, officer_name, kabupaten, kecamatan, kelurahan,
             collectibility, COALESCE(outstanding,0) AS outstanding,
             COALESCE(tunggakan_pokok,0) AS tunggakan_pokok,
             COALESCE(tunggakan_bunga,0) AS tunggakan_bunga,
             COALESCE(frek_tunggakan,0)  AS frek_tunggakan,
             tanggal_jatuh_tempo, COALESCE(taksasi,0) AS taksasi, ikatan
      FROM loans
      WHERE collectibility IN ('KL','D','M')
    `).all() as any[];

    const tindakan = new Map(
      (db.prepare('SELECT * FROM collection_tindakan').all() as any[])
        .map(t => [t.account_number, t]),
    );

    const data = baris.map(r => {
      const t = tindakan.get(r.account_number);
      return {
        id: r.account_number,
        debtorName: r.customer_name,
        aoName: r.officer_name ?? '',
        branch: r.kabupaten ?? '',
        kol: KOL_TAMPILAN[String(r.collectibility).toUpperCase()] ?? 'KOL_3',
        outstandingPrincipal: r.outstanding,
        interestArrears: r.tunggakan_bunga,
        daysOverdue: hariTerlambat(r.tanggal_jatuh_tempo, r.frek_tunggakan),
        /* Nominatif tidak menyimpan tanggal pembayaran terakhir. Dikosongkan,
           bukan diisi tanggal perkiraan yang akan terbaca sebagai fakta. */
        lastPaymentDate: '',
        actionStatus: t?.action_status ?? 'BELUM_DITANGANI',
        actionNotes: t?.action_notes ?? '',
        region: [r.kecamatan, r.kelurahan].filter(Boolean).join(' · '),
        /* Tambahan di luar bentuk tampilan lama, berguna saat menagih. */
        tunggakanPokok: r.tunggakan_pokok,
        frekTunggakan: r.frek_tunggakan,
        taksasi: r.taksasi,
        ikatan: r.ikatan ?? '',
      };
    });

    const totalBaki = data.reduce((s, d) => s + d.outstandingPrincipal, 0);
    res.json({
      success: true,
      data,
      ringkas: {
        jumlahRekening: data.length,
        totalBakiDebet: totalBaki,
        totalTunggakanBunga: data.reduce((s, d) => s + d.interestArrears, 0),
        perKol: ['KOL_3', 'KOL_4', 'KOL_5'].map(k => ({
          kol: k,
          jumlah: data.filter(d => d.kol === k).length,
          baki: data.filter(d => d.kol === k).reduce((s, d) => s + d.outstandingPrincipal, 0),
        })),
        sudahDitangani: data.filter(d => d.actionStatus !== 'BELUM_DITANGANI').length,
      },
    });
  } catch (e) {
    console.error('Collection kredit bermasalah error:', e);
    res.status(500).json({ error: 'Gagal memuat daftar kredit bermasalah' });
  }
});

/** Mencatat tindak lanjut atas sebuah rekening bermasalah. */
router.put('/kredit-bermasalah/:rekening/tindakan', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  const { actionStatus, actionNotes } = req.body ?? {};
  const SAH = ['BELUM_DITANGANI', 'KUNJUNGAN', 'SURAT_TEGURAN', 'NEGOSIASI', 'RESTRUKTURISASI', 'LELANG', 'HAPUS_BUKU', 'LUNAS'];
  if (!SAH.includes(String(actionStatus))) {
    return res.status(400).json({ error: `Status tindakan harus salah satu dari: ${SAH.join(', ')}` });
  }
  try {
    db.prepare(`
      INSERT INTO collection_tindakan (account_number, action_status, action_notes, oleh, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(account_number) DO UPDATE SET
        action_status = excluded.action_status,
        action_notes  = excluded.action_notes,
        oleh          = excluded.oleh,
        updated_at    = CURRENT_TIMESTAMP
    `).run(req.params.rekening, actionStatus, actionNotes ?? null, req.pengguna?.name ?? null);
    res.json({ success: true });
  } catch (e) {
    console.error('Collection tindakan error:', e);
    res.status(500).json({ error: 'Gagal menyimpan tindak lanjut' });
  }
});

/* ------------------------------------------------------------- janji bayar */

const bentukJanji = (r: any) => ({
  id: r.id,
  accountNumber: r.account_number ?? '',
  debtorName: r.debtor_name,
  aoName: r.ao_name ?? '',
  branch: r.branch ?? '',
  promiseDate: r.promise_date,
  promisedAmount: r.promised_amount,
  status: r.status,
  notes: r.notes ?? '',
  contactWa: r.contact_wa ?? '',
  dibuatOleh: r.dibuat_oleh ?? '',
  createdAt: r.created_at,
});

router.get('/janji-bayar', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  try {
    const baris = db.prepare(
      'SELECT * FROM janji_bayar ORDER BY promise_date DESC, created_at DESC',
    ).all() as any[];
    const data = baris.map(bentukJanji);
    res.json({
      success: true,
      data,
      ringkas: {
        total: data.length,
        menunggu: data.filter(d => d.status === 'MENUNGGU').length,
        terealisasi: data.filter(d => d.status === 'TEREALISASI').length,
        ingkar: data.filter(d => d.status === 'INGKAR_JANJI').length,
        nilaiMenunggu: data.filter(d => d.status === 'MENUNGGU')
          .reduce((s, d) => s + d.promisedAmount, 0),
      },
    });
  } catch (e) {
    console.error('Janji bayar error:', e);
    res.status(500).json({ error: 'Gagal memuat janji bayar' });
  }
});

router.post('/janji-bayar', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  const { accountNumber, debtorName, aoName, branch, promiseDate, promisedAmount, notes, contactWa } = req.body ?? {};

  const kurang: string[] = [];
  if (!String(debtorName ?? '').trim()) kurang.push('nama debitur');
  if (!String(promiseDate ?? '').trim()) kurang.push('tanggal janji');
  if (!(Number(promisedAmount) > 0)) kurang.push('nominal janji');
  if (kurang.length > 0) {
    return res.status(400).json({ error: `Belum lengkap: ${kurang.join(', ')}.` });
  }

  try {
    const id = `ptp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    db.prepare(`
      INSERT INTO janji_bayar
        (id, account_number, debtor_name, ao_name, branch, promise_date, promised_amount, status, notes, contact_wa, dibuat_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'MENUNGGU', ?, ?, ?)
    `).run(
      id, accountNumber ?? null, String(debtorName).trim(), aoName ?? null, branch ?? null,
      String(promiseDate).trim(), Number(promisedAmount), notes ?? null, contactWa ?? null,
      req.pengguna?.name ?? null,
    );
    res.status(201).json({ success: true, data: bentukJanji(db.prepare('SELECT * FROM janji_bayar WHERE id = ?').get(id)) });
  } catch (e) {
    console.error('Simpan janji bayar error:', e);
    res.status(500).json({ error: 'Gagal menyimpan janji bayar' });
  }
});

router.put('/janji-bayar/:id', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  const { status, notes } = req.body ?? {};
  const SAH = ['MENUNGGU', 'TEREALISASI', 'INGKAR_JANJI'];
  if (status !== undefined && !SAH.includes(String(status))) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${SAH.join(', ')}` });
  }
  try {
    const info = db.prepare(`
      UPDATE janji_bayar
      SET status = COALESCE(?, status),
          notes  = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status ?? null, notes ?? null, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Janji bayar tidak ditemukan' });
    res.json({ success: true, data: bentukJanji(db.prepare('SELECT * FROM janji_bayar WHERE id = ?').get(req.params.id)) });
  } catch (e) {
    console.error('Ubah janji bayar error:', e);
    res.status(500).json({ error: 'Gagal memperbarui janji bayar' });
  }
});

export default router;
