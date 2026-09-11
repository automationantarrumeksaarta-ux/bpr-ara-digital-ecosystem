import express from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';

/**
 * Sistem Peringatan Dini (Early Warning System) berbasis data kredit sungguhan.
 *
 * Sebelumnya EWS di aplikasi ini tidak pernah menyentuh data pinjaman sama
 * sekali. `runEwsEngine()` di AppContext memang ada, tetapi tidak pernah
 * dipanggil dari mana pun. Satu-satunya jalur yang hidup adalah mengunggah
 * berkas .xls di peramban, yang membaca kolom rupiah "Tungakan" seolah-olah
 * satuan hari lalu membuat peringatan tanpa kode, tanpa modul, dan dengan
 * nomor nasabah karangan sehingga tombol "Investigasi" tidak menuju siapa pun.
 *
 * Berkas ini menggantinya: seluruh peringatan dihitung dari tabel `loans`,
 * yaitu hasil unggah Nominatif Kredit. Tidak ada angka yang dikarang. Bila
 * kolom sumbernya kosong, aturannya tidak berjalan dan itu dilaporkan apa
 * adanya lewat `diagnostik`.
 *
 * Peringatan dihitung ulang setiap kali diminta, bukan disimpan. Data kredit
 * berubah tiap kali nominatif diunggah, dan peringatan yang mengendap di tabel
 * akan menunjuk keadaan yang sudah lewat. Yang disimpan hanya tindak lanjut
 * petugas, di tabel terpisah.
 */

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

/* ------------------------------------------------------------------ ambang */

/**
 * Ambang batas, dikumpulkan di satu tempat supaya bisa ditinjau tanpa membaca
 * kode. Angka-angka ini mengikuti praktik pengawasan kredit yang lazim, bukan
 * ketetapan OJK, jadi silakan disesuaikan dengan kebijakan internal BPR.
 */
export const AMBANG = {
  /** Tunggakan sebanyak ini atau lebih, padahal belum digolongkan NPL. */
  FT_PERINGATAN: 2,
  /** Dianggap membayar kurang bila di bawah persentase ini dari jadwal. */
  BAYAR_CUKUP: 0.95,
  /** Kredit sebesar ini ke atas yang berhenti membayar dinaikkan ke merah. */
  NOMINAL_BESAR: 100_000_000,
  /** Portofolio minimum sebelum NPL seorang petugas layak dibandingkan. */
  MIN_PORTOFOLIO_PETUGAS: 5,
  /** Selisih NPL petugas terhadap rata-rata bank yang dianggap menonjol. */
  SELISIH_NPL_PETUGAS: 15,
  /** Pengikatan yang lemah bila kredit bermasalah: eksekusi jauh lebih sulit. */
  IKATAN_LEMAH: /skmht|tanpa ikatan/i,
};

const NPL = ['KL', 'D', 'M'];

/* ------------------------------------------------------------------ bentuk */

export type TingkatEws = 'RED' | 'YELLOW';

export interface PeringatanEws {
  id: string;
  kode: string;
  kategori: 'PERILAKU_BAYAR' | 'TUNGGAKAN' | 'JATUH_TEMPO' | 'AGUNAN' | 'PENGIKATAN' | 'KONSENTRASI';
  tingkat: TingkatEws;
  judul: string;
  keterangan: string;
  /** Nomor rekening, atau nama petugas untuk peringatan konsentrasi. */
  acuan: string;
  nama: string;
  petugas: string | null;
  wilayah: string | null;
  kelurahan: string | null;
  kolektibilitas: string | null;
  bakiDebet: number;
  /** Angka yang memicu peringatan, untuk pengurutan. */
  nilai: number;
  tindakLanjut: { status: string; catatan: string | null; diperbaruiPada: string } | null;
}

interface BarisPinjaman {
  account_number: string;
  customer_name: string;
  officer_name: string | null;
  kabupaten: string | null;
  kelurahan: string | null;
  kecamatan: string | null;
  collectibility: string;
  outstanding: number;
  jumlah_angsuran: number;
  angsuran_masuk: number;
  frek_tunggakan: number;
  tunggakan_pokok: number;
  tunggakan_bunga: number;
  tanggal_jatuh_tempo: string | null;
  taksasi: number;
  ikatan: string | null;
}

/* ------------------------------------------------------------- tindak lanjut */

function siapkanTabel() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ews_tindak_lanjut (
      peringatan_id TEXT PRIMARY KEY,
      status        TEXT NOT NULL,
      catatan       TEXT,
      oleh          TEXT,
      diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
siapkanTabel();

const rupiah = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

/* -------------------------------------------------------------------- aturan */

/**
 * Menyusun seluruh peringatan dari tabel `loans`.
 *
 * Setiap aturan memberi alasan yang bisa ditelusuri ke kolom sumbernya, supaya
 * petugas tahu kenapa sebuah rekening muncul dan tidak perlu menebak.
 */
export function hitungPeringatan(): {
  peringatan: PeringatanEws[];
  ringkas: Record<string, number>;
  diagnostik: Record<string, unknown>;
} {
  const rows = db.prepare(`
    SELECT account_number, customer_name, officer_name, kabupaten, kecamatan, kelurahan,
           collectibility, COALESCE(outstanding,0) AS outstanding,
           COALESCE(jumlah_angsuran,0) AS jumlah_angsuran,
           COALESCE(angsuran_masuk,0)  AS angsuran_masuk,
           COALESCE(frek_tunggakan,0)  AS frek_tunggakan,
           COALESCE(tunggakan_pokok,0) AS tunggakan_pokok,
           COALESCE(tunggakan_bunga,0) AS tunggakan_bunga,
           tanggal_jatuh_tempo, COALESCE(taksasi,0) AS taksasi, ikatan
    FROM loans
  `).all() as BarisPinjaman[];

  const hasil: PeringatanEws[] = [];
  const dasar = (r: BarisPinjaman) => ({
    nama: r.customer_name,
    petugas: r.officer_name,
    wilayah: r.kabupaten,
    kelurahan: r.kelurahan,
    kolektibilitas: r.collectibility,
    bakiDebet: r.outstanding,
    acuan: r.account_number,
  });

  const hariIni = Date.now();

  for (const r of rows) {
    const bermasalah = NPL.includes(r.collectibility);

    /* 1 — Berhenti membayar padahal jadwalnya ada.
     *
     * Inilah tanda paling awal, dan justru yang paling luput: rekening masih
     * tercatat Lancar sehingga tidak muncul di laporan NPL mana pun, padahal
     * bulan ini tidak menyetor sama sekali. */
    if (!bermasalah && r.jumlah_angsuran > 0 && r.angsuran_masuk <= 0) {
      const besar = r.outstanding >= AMBANG.NOMINAL_BESAR;
      hasil.push({
        ...dasar(r),
        id: `BAYAR-0-${r.account_number}`,
        kode: 'EWS-BAYAR-01',
        kategori: 'PERILAKU_BAYAR',
        tingkat: besar ? 'RED' : 'YELLOW',
        judul: 'Berhenti membayar bulan ini',
        keterangan:
          `Jadwal angsuran bulan ini ${rupiah(r.jumlah_angsuran)}, tidak ada setoran masuk. ` +
          `Kolektibilitas masih ${r.collectibility}, jadi belum terhitung NPL.`,
        nilai: r.outstanding,
        tindakLanjut: null,
      });
    }

    /* 2 — Membayar tetapi kurang dari jadwal. */
    else if (!bermasalah && r.jumlah_angsuran > 0 &&
             r.angsuran_masuk > 0 && r.angsuran_masuk < r.jumlah_angsuran * AMBANG.BAYAR_CUKUP) {
      const kurang = r.jumlah_angsuran - r.angsuran_masuk;
      hasil.push({
        ...dasar(r),
        id: `BAYAR-SEBAGIAN-${r.account_number}`,
        kode: 'EWS-BAYAR-02',
        kategori: 'PERILAKU_BAYAR',
        tingkat: 'YELLOW',
        judul: 'Setoran kurang dari jadwal',
        keterangan:
          `Dijadwalkan ${rupiah(r.jumlah_angsuran)}, masuk ${rupiah(r.angsuran_masuk)}. ` +
          `Kurang ${rupiah(kurang)}.`,
        nilai: kurang,
        tindakLanjut: null,
      });
    }

    /* 3 — Tunggakan menumpuk padahal belum digolongkan bermasalah. */
    if (!bermasalah && r.frek_tunggakan >= AMBANG.FT_PERINGATAN) {
      hasil.push({
        ...dasar(r),
        id: `FT-${r.account_number}`,
        kode: 'EWS-TUNGGAKAN-01',
        kategori: 'TUNGGAKAN',
        tingkat: r.frek_tunggakan >= AMBANG.FT_PERINGATAN * 2 ? 'RED' : 'YELLOW',
        judul: `${r.frek_tunggakan} angsuran tertunggak`,
        keterangan:
          `Tunggakan pokok ${rupiah(r.tunggakan_pokok)} dan bunga ${rupiah(r.tunggakan_bunga)}, ` +
          `masih digolongkan ${r.collectibility}. Periksa apakah penggolongannya sudah tepat.`,
        nilai: r.frek_tunggakan,
        tindakLanjut: null,
      });
    }

    /* 4 — Sudah lewat jatuh tempo tetapi baki debet belum nol. */
    if (r.tanggal_jatuh_tempo && r.outstanding > 0) {
      const jt = new Date(r.tanggal_jatuh_tempo).getTime();
      if (Number.isFinite(jt) && jt < hariIni) {
        const hari = Math.floor((hariIni - jt) / 86_400_000);
        hasil.push({
          ...dasar(r),
          id: `JT-${r.account_number}`,
          kode: 'EWS-TEMPO-01',
          kategori: 'JATUH_TEMPO',
          tingkat: bermasalah ? 'YELLOW' : 'RED',
          judul: `Lewat jatuh tempo ${hari.toLocaleString('id-ID')} hari`,
          keterangan:
            `Jatuh tempo ${r.tanggal_jatuh_tempo}, baki debet masih ${rupiah(r.outstanding)}. ` +
            (bermasalah
              ? 'Sudah tergolong bermasalah, perlu langkah penyelesaian.'
              : 'Belum digolongkan bermasalah walaupun sudah lewat tempo.'),
          nilai: hari,
          tindakLanjut: null,
        });
      }
    }

    /* 5 — Agunan tidak lagi menutup baki debet. */
    if (r.taksasi > 0 && r.outstanding > r.taksasi) {
      const selisih = r.outstanding - r.taksasi;
      hasil.push({
        ...dasar(r),
        id: `AGUNAN-${r.account_number}`,
        kode: 'EWS-AGUNAN-01',
        kategori: 'AGUNAN',
        tingkat: bermasalah ? 'RED' : 'YELLOW',
        judul: 'Agunan tidak menutup baki debet',
        keterangan:
          `Baki debet ${rupiah(r.outstanding)} melampaui taksasi ${rupiah(r.taksasi)}. ` +
          `Selisih ${rupiah(selisih)} tidak terjamin.`,
        nilai: selisih,
        tindakLanjut: null,
      });
    }

    /* 6 — Bermasalah dengan pengikatan yang lemah.
     *
     * SKMHT belum memberi hak eksekusi seperti APHT, dan "tanpa ikatan" berarti
     * tidak ada dasar kebendaan sama sekali. Bila kreditnya sudah bermasalah,
     * inilah yang menentukan seberapa besar yang bisa ditarik kembali. */
    if (bermasalah && r.ikatan && AMBANG.IKATAN_LEMAH.test(r.ikatan)) {
      hasil.push({
        ...dasar(r),
        id: `IKATAN-${r.account_number}`,
        kode: 'EWS-IKATAN-01',
        kategori: 'PENGIKATAN',
        tingkat: 'RED',
        judul: 'Bermasalah dengan pengikatan lemah',
        keterangan:
          `Kolektibilitas ${r.collectibility} dengan pengikatan "${r.ikatan}". ` +
          `Eksekusi agunan tidak dapat langsung dilakukan, dahulukan penyelesaian secara musyawarah.`,
        nilai: r.outstanding,
        tindakLanjut: null,
      });
    }
  }

  /* 7 — Pemusatan kredit bermasalah pada satu petugas. */
  const perPetugas = new Map<string, { n: number; baki: number; npl: number }>();
  for (const r of rows) {
    const p = r.officer_name?.trim();
    if (!p) continue;
    const o = perPetugas.get(p) ?? { n: 0, baki: 0, npl: 0 };
    o.n++; o.baki += r.outstanding;
    if (NPL.includes(r.collectibility)) o.npl += r.outstanding;
    perPetugas.set(p, o);
  }
  const bakiBank = rows.reduce((s, r) => s + r.outstanding, 0);
  const nplBank = rows.filter(r => NPL.includes(r.collectibility)).reduce((s, r) => s + r.outstanding, 0);
  const rasioBank = bakiBank > 0 ? (nplBank / bakiBank) * 100 : 0;

  for (const [petugas, o] of perPetugas) {
    if (o.n < AMBANG.MIN_PORTOFOLIO_PETUGAS || o.baki <= 0) continue;
    const rasio = (o.npl / o.baki) * 100;
    if (rasio - rasioBank < AMBANG.SELISIH_NPL_PETUGAS) continue;
    hasil.push({
      id: `PETUGAS-${petugas}`,
      kode: 'EWS-KONSENTRASI-01',
      kategori: 'KONSENTRASI',
      tingkat: rasio - rasioBank >= AMBANG.SELISIH_NPL_PETUGAS * 2 ? 'RED' : 'YELLOW',
      judul: `NPL portofolio ${petugas} ${rasio.toFixed(1)}%`,
      keterangan:
        `${o.n} rekening senilai ${rupiah(o.baki)}, bermasalah ${rupiah(o.npl)}. ` +
        `Rata-rata bank ${rasioBank.toFixed(1)}%.`,
      acuan: petugas,
      nama: petugas,
      petugas,
      wilayah: null,
      kelurahan: null,
      kolektibilitas: null,
      bakiDebet: o.baki,
      nilai: rasio,
      tindakLanjut: null,
    });
  }

  // Tempelkan tindak lanjut yang sudah dicatat petugas.
  const lanjut = db.prepare('SELECT peringatan_id, status, catatan, diperbarui_pada FROM ews_tindak_lanjut').all() as any[];
  const petaLanjut = new Map(lanjut.map(l => [l.peringatan_id, l]));
  for (const p of hasil) {
    const l = petaLanjut.get(p.id);
    if (l) p.tindakLanjut = { status: l.status, catatan: l.catatan, diperbaruiPada: l.diperbarui_pada };
  }

  // Merah dulu, lalu nominal terbesar.
  hasil.sort((a, b) =>
    a.tingkat === b.tingkat ? b.bakiDebet - a.bakiDebet : a.tingkat === 'RED' ? -1 : 1);

  const belum = hasil.filter(p => !p.tindakLanjut || p.tindakLanjut.status === 'TERBUKA');
  const ringkas = {
    total: hasil.length,
    merah: hasil.filter(p => p.tingkat === 'RED').length,
    kuning: hasil.filter(p => p.tingkat === 'YELLOW').length,
    belumDitangani: belum.length,
    sudahDitangani: hasil.length - belum.length,
    // Nilai yang dipertaruhkan dihitung dari rekening unik, bukan dijumlah
    // per peringatan — satu rekening bisa memicu beberapa aturan sekaligus.
    nilaiTerdampak: [...new Map(
      hasil.filter(p => p.kategori !== 'KONSENTRASI').map(p => [p.acuan, p.bakiDebet]),
    ).values()].reduce((s, v) => s + v, 0),
  };

  const kolomKosong = (nama: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM loans WHERE ${nama} IS NULL OR ${nama} = 0`).get() as any).n;

  return {
    peringatan: hasil,
    ringkas,
    diagnostik: {
      totalPinjaman: rows.length,
      rasioNplBank: Number(rasioBank.toFixed(2)),
      tanpaJadwalAngsuran: kolomKosong('jumlah_angsuran'),
      tanpaTanggalJatuhTempo: (db.prepare('SELECT COUNT(*) AS n FROM loans WHERE tanggal_jatuh_tempo IS NULL').get() as any).n,
      tanpaTaksasi: kolomKosong('taksasi'),
      ambang: AMBANG,
    },
  };
}

/* ------------------------------------------------------------------- rute */

function wajibMasuk(req: express.Request, res: express.Response): any | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Tidak memiliki akses' });
    return null;
  }
  try {
    return jwt.verify(header.slice(7), JWT_SECRET) as any;
  } catch {
    res.status(401).json({ error: 'Sesi tidak berlaku' });
    return null;
  }
}

router.get('/alerts', (req, res) => {
  if (!wajibMasuk(req, res)) return;
  try {
    const jumlah = (db.prepare('SELECT COUNT(*) AS n FROM loans').get() as any).n;
    if (jumlah === 0) {
      return res.json({
        tersedia: false,
        alasan: 'Belum ada data kredit. Unggah berkas Nominatif Kredit lewat menu Data Center terlebih dahulu.',
        peringatan: [],
        ringkas: { total: 0, merah: 0, kuning: 0, belumDitangani: 0, sudahDitangani: 0, nilaiTerdampak: 0 },
      });
    }
    res.json({ tersedia: true, ...hitungPeringatan() });
  } catch (e) {
    console.error('EWS error:', e);
    res.status(500).json({ error: 'Gagal menghitung peringatan dini' });
  }
});

/** Mencatat tindak lanjut. Peringatannya sendiri tetap dihitung dari data. */
router.put('/alerts/:id/tindak-lanjut', (req, res) => {
  const pengguna = wajibMasuk(req, res);
  if (!pengguna) return;

  const { status, catatan } = req.body ?? {};
  const SAH = ['TERBUKA', 'DITINDAKLANJUTI', 'SELESAI', 'DIABAIKAN'];
  if (!SAH.includes(status)) {
    return res.status(400).json({ error: `Status harus salah satu dari: ${SAH.join(', ')}` });
  }

  try {
    db.prepare(`
      INSERT INTO ews_tindak_lanjut (peringatan_id, status, catatan, oleh, diperbarui_pada)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(peringatan_id) DO UPDATE SET
        status = excluded.status, catatan = excluded.catatan,
        oleh = excluded.oleh, diperbarui_pada = CURRENT_TIMESTAMP
    `).run(req.params.id, status, catatan ?? null, pengguna.username ?? pengguna.id ?? null);
    res.json({ success: true });
  } catch (e) {
    console.error('EWS tindak lanjut error:', e);
    res.status(500).json({ error: 'Gagal menyimpan tindak lanjut' });
  }
});

export default router;
