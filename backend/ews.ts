import express from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { JWT_SECRET, wajibPeran, PERAN_LIHAT_NASABAH } from './keamanan.js';

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


/* ------------------------------------------------------------------ ambang */

/**
 * Ambang batas, dikumpulkan di satu tempat supaya bisa ditinjau tanpa membaca
 * kode. Angka-angka ini mengikuti praktik pengawasan kredit yang lazim, bukan
 * ketetapan OJK, jadi silakan disesuaikan dengan kebijakan internal BPR.
 */
export const AMBANG = {
  /**
   * Jumlah angsuran tertunggak yang membuat sebuah rekening menyentuh
   * penggolongan Kurang Lancar. Dipakai sebagai titik acuan jalur DPK menuju
   * KL: pada FT satu langkah di bawah angka ini, satu kali gagal bayar lagi
   * sudah cukup untuk menyeberang.
   */
  FT_AMBANG_KL: 3,
  /** Dianggap membayar kurang bila di bawah persentase ini dari jadwal. */
  BAYAR_CUKUP: 0.95,
  /** Kredit sebesar ini ke atas dinaikkan satu tingkat perhatian. */
  NOMINAL_BESAR: 100_000_000,
};

/**
 * Golongan yang berada di luar lingkup peringatan dini.
 *
 * KL, D, dan M bukan lagi peringatan dini — kreditnya sudah bermasalah, dan
 * yang dibutuhkan adalah penagihan serta penyelesaian, bukan pemantauan.
 * Ketiganya ditangani modul Collection & Recovery.
 */
const NPL = ['KL', 'D', 'M'];

/** Golongan yang dipantau di sini. */
const DIPANTAU = ['L', 'DPK'];

/* ------------------------------------------------------------------ bentuk */

export type TingkatEws = 'RED' | 'YELLOW';

/**
 * Dua jalur penurunan yang dipantau.
 *
 * EWS di sini sengaja hanya mengurus perpindahan ke bawah satu tingkat dari
 * golongan yang belum bermasalah: Lancar yang mulai goyah menuju Dalam
 * Perhatian Khusus, dan DPK yang mendekati Kurang Lancar. Begitu sebuah
 * rekening sudah KL, D, atau M, ia keluar dari layar ini.
 */
export type JalurEws = 'L_KE_DPK' | 'DPK_KE_KL';

export type KategoriEws = 'PERILAKU_BAYAR' | 'TUNGGAKAN' | 'JATUH_TEMPO';

export interface PeringatanEws {
  id: string;
  kode: string;
  kategori: KategoriEws;
  /** Perpindahan yang sedang diantisipasi. */
  jalur: JalurEws;
  tingkat: TingkatEws;
  judul: string;
  keterangan: string;
  /** Nomor rekening. */
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
           tanggal_jatuh_tempo
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

  /**
   * Kredit besar dinaikkan satu tingkat perhatian.
   *
   * Bukan karena gejalanya berbeda, melainkan karena akibatnya berbeda: satu
   * rekening miliaran yang turun ke DPK menggeser rasio portofolio jauh lebih
   * besar daripada sepuluh rekening kecil dengan gejala yang sama.
   */
  const naikkanBilaBesar = (tingkat: TingkatEws, baki: number): TingkatEws =>
    tingkat === 'YELLOW' && baki >= AMBANG.NOMINAL_BESAR ? 'RED' : tingkat;

  let dilewatiNpl = 0;
  let dilewatiTakDikenal = 0;
  let tanpaBuktiTunggakan = 0;

  for (const r of rows) {
    const kol = String(r.collectibility ?? '').trim().toUpperCase();

    /*
     * Lingkup peringatan dini dibatasi pada dua perpindahan saja: Lancar yang
     * mulai goyah menuju DPK, dan DPK yang mendekati Kurang Lancar. Rekening
     * yang sudah KL, D, atau M tidak ditampilkan di sini — persoalannya bukan
     * lagi memperingatkan, melainkan menagih, dan itu ada di modul Collection
     * & Recovery. Jumlah yang dilewati tetap dilaporkan lewat `diagnostik`
     * supaya jelas bahwa mereka tidak hilang, hanya tidak dibahas di layar ini.
     */
    if (!DIPANTAU.includes(kol)) {
      if (NPL.includes(kol)) dilewatiNpl++;
      else dilewatiTakDikenal++;
      continue;
    }

    const lancar = kol === 'L';
    const jalur: JalurEws = lancar ? 'L_KE_DPK' : 'DPK_KE_KL';
    const tujuan = lancar ? 'DPK' : 'Kurang Lancar';

    /* 1 — Tunggakan sebagai syarat masuk, lalu perilaku bayar sebagai pembeda
     *     tingkat keparahannya.
     *
     * Keduanya digabung menjadi satu peringatan per rekening, bukan dua, karena
     * yang dibutuhkan petugas adalah satu daftar kerja berisi nama yang harus
     * didatangi — bukan nama yang sama muncul dua kali dengan sudut pandang
     * berbeda.
     *
     * Tunggakan dijadikan syarat masuk setelah memeriksa data nominatif yang
     * ada. Dari 79 rekening Lancar yang kolom "angsuran masuk"-nya nol, 71 di
     * antaranya sama sekali tidak punya tunggakan, baik nominal maupun
     * frekuensi. Rekening Lancar tanpa tunggakan menurut definisinya memang
     * tidak sedang menunggak; setoran yang belum tercatat jauh lebih mungkin
     * berarti tanggal jatuh temponya belum tiba pada saat nominatif diambil.
     * Menandai ketujuh puluh satu rekening itu sebagai "berhenti membayar"
     * berarti mengisi daftar kerja dengan tujuh puluh satu kunjungan sia-sia,
     * dan membuat delapan rekening yang benar-benar bermasalah tenggelam di
     * antaranya. Jumlah yang tidak lolos syarat ini tetap dilaporkan lewat
     * `diagnostik` supaya keputusan ini bisa ditinjau, bukan disembunyikan. */
    const tunggakanNominal = r.tunggakan_pokok + r.tunggakan_bunga;
    const adaTunggakan = r.frek_tunggakan >= 1 || tunggakanNominal > 0;

    if (!adaTunggakan) {
      if (r.jumlah_angsuran > 0 && r.angsuran_masuk < r.jumlah_angsuran * AMBANG.BAYAR_CUKUP) {
        tanpaBuktiTunggakan++;
      }
    } else {
      const berhentiBayar = r.jumlah_angsuran > 0 && r.angsuran_masuk <= 0;
      const kurangBayar =
        r.jumlah_angsuran > 0 &&
        r.angsuran_masuk > 0 &&
        r.angsuran_masuk < r.jumlah_angsuran * AMBANG.BAYAR_CUKUP;

      /* Jarak ke ambang Kurang Lancar. Hanya bermakna pada jalur DPK. */
      const sisaLangkah = AMBANG.FT_AMBANG_KL - r.frek_tunggakan;

      let tingkat: TingkatEws = 'YELLOW';
      if (berhentiBayar) tingkat = 'RED';
      else if (!lancar && sisaLangkah <= 1) tingkat = 'RED';
      else if (lancar && r.frek_tunggakan >= 2) tingkat = 'RED';
      tingkat = naikkanBilaBesar(tingkat, r.outstanding);

      /* Rincian tunggakan, dipakai pada semua ragam keterangan di bawah. */
      const rincian =
        (r.frek_tunggakan >= 1 ? `FT ${r.frek_tunggakan}, ` : '') +
        `tunggakan pokok ${rupiah(r.tunggakan_pokok)} dan bunga ${rupiah(r.tunggakan_bunga)}`;

      /* Keadaan setoran bulan berjalan. */
      const setoran = berhentiBayar
        ? `Jadwal angsuran ${rupiah(r.jumlah_angsuran)}, tidak ada setoran masuk.`
        : kurangBayar
          ? `Dijadwalkan ${rupiah(r.jumlah_angsuran)}, masuk ${rupiah(r.angsuran_masuk)}, ` +
            `kurang ${rupiah(r.jumlah_angsuran - r.angsuran_masuk)}.`
          : 'Setoran bulan berjalan masih sesuai jadwal.';

      /* Apa artinya bagi perpindahan golongan. */
      const arah = lancar
        ? 'Rekening yang sudah menunggak umumnya tidak lagi memenuhi syarat golongan Lancar. ' +
          'Periksa apakah penggolongannya masih tepat atau sudah harus turun ke DPK.'
        : sisaLangkah <= 0
          ? `FT sudah menyentuh ambang ${AMBANG.FT_AMBANG_KL}. Penggolongan Kurang Lancar ` +
            'tinggal menunggu penetapan.'
          : sisaLangkah === 1
            ? `FT ${r.frek_tunggakan} dari ambang ${AMBANG.FT_AMBANG_KL}. Satu kali gagal bayar ` +
              'lagi sudah cukup untuk menyeberang ke Kurang Lancar.'
            : `FT ${r.frek_tunggakan} dari ambang ${AMBANG.FT_AMBANG_KL} untuk Kurang Lancar.`;

      hasil.push({
        ...dasar(r),
        id: `TUNGGAKAN-${r.account_number}`,
        kode: berhentiBayar || kurangBayar ? 'EWS-BAYAR-01' : 'EWS-TUNGGAKAN-01',
        jalur,
        kategori: berhentiBayar || kurangBayar ? 'PERILAKU_BAYAR' : 'TUNGGAKAN',
        tingkat,
        judul: berhentiBayar
          ? 'Menunggak dan berhenti membayar'
          : kurangBayar
            ? 'Menunggak dan setoran kurang dari jadwal'
            : r.frek_tunggakan >= 1
              ? `${r.frek_tunggakan} angsuran tertunggak`
              : 'Ada tunggakan berjalan',
        keterangan: `${rincian}. ${setoran} ${arah}`,
        nilai: r.frek_tunggakan > 0 ? r.frek_tunggakan : tunggakanNominal,
        tindakLanjut: null,
      });
    }

    /* 2 — Sudah lewat jatuh tempo tetapi baki debet belum nol.
     *
     * Pada rekening yang belum bermasalah, ini janggal: kreditnya seharusnya
     * sudah lunas. Selama baki debet masih ada, penurunan golongan tinggal
     * menunggu waktu. */
    if (r.tanggal_jatuh_tempo && r.outstanding > 0) {
      const jt = new Date(r.tanggal_jatuh_tempo).getTime();
      if (Number.isFinite(jt) && jt < hariIni) {
        const hari = Math.floor((hariIni - jt) / 86_400_000);
        hasil.push({
          ...dasar(r),
          id: `JT-${r.account_number}`,
          kode: 'EWS-TEMPO-01',
          jalur,
          kategori: 'JATUH_TEMPO',
          tingkat: 'RED',
          judul: `Lewat jatuh tempo ${hari.toLocaleString('id-ID')} hari`,
          keterangan:
            `Jatuh tempo ${r.tanggal_jatuh_tempo}, baki debet masih ${rupiah(r.outstanding)} ` +
            `padahal golongannya masih ${kol}. Selesaikan pelunasan atau perpanjangan sebelum ` +
            `turun ke ${tujuan}.`,
          nilai: hari,
          tindakLanjut: null,
        });
      }
    }
  }

  // Tempelkan tindak lanjut yang sudah dicatat petugas.
  const lanjut = db.prepare('SELECT peringatan_id, status, catatan, diperbarui_pada FROM ews_tindak_lanjut').all() as any[];
  const petaLanjut = new Map(lanjut.map(l => [l.peringatan_id, l]));
  for (const p of hasil) {
    const l = petaLanjut.get(p.id);
    if (l) p.tindakLanjut = { status: l.status, catatan: l.catatan, diperbaruiPada: l.diperbarui_pada };
  }

  /*
   * Merah dulu, lalu jalur yang paling dekat dengan NPL, baru nominal terbesar.
   * DPK yang mendekati KL didahulukan atas Lancar yang mulai goyah karena
   * jaraknya ke NPL tinggal satu langkah.
   */
  hasil.sort((a, b) => {
    if (a.tingkat !== b.tingkat) return a.tingkat === 'RED' ? -1 : 1;
    if (a.jalur !== b.jalur) return a.jalur === 'DPK_KE_KL' ? -1 : 1;
    return b.bakiDebet - a.bakiDebet;
  });

  const belum = hasil.filter(p => !p.tindakLanjut || p.tindakLanjut.status === 'TERBUKA');

  /*
   * Rekening unik, bukan jumlah peringatan. Satu rekening bisa memicu beberapa
   * aturan sekaligus — misalnya menunggak sekaligus berhenti membayar — dan
   * menjumlahkan baki debetnya per peringatan akan menghitungnya berkali-kali.
   */
  const bakiUnik = (daftar: PeringatanEws[]) =>
    [...new Map(daftar.map(p => [p.acuan, p.bakiDebet])).values()].reduce((s, v) => s + v, 0);

  const lKeDpk = hasil.filter(p => p.jalur === 'L_KE_DPK');
  const dpkKeKl = hasil.filter(p => p.jalur === 'DPK_KE_KL');

  const ringkas = {
    total: hasil.length,
    merah: hasil.filter(p => p.tingkat === 'RED').length,
    kuning: hasil.filter(p => p.tingkat === 'YELLOW').length,
    belumDitangani: belum.length,
    sudahDitangani: hasil.length - belum.length,
    nilaiTerdampak: bakiUnik(hasil),
    /* Per jalur, karena keduanya menuntut tindakan yang berbeda. */
    lKeDpk: new Set(lKeDpk.map(p => p.acuan)).size,
    dpkKeKl: new Set(dpkKeKl.map(p => p.acuan)).size,
    nilaiLKeDpk: bakiUnik(lKeDpk),
    nilaiDpkKeKl: bakiUnik(dpkKeKl),
  };

  const kolomKosong = (nama: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM loans WHERE ${nama} IS NULL OR ${nama} = 0`).get() as any).n;

  const cacahGolongan = (gol: string[]) =>
    rows.filter(r => gol.includes(String(r.collectibility ?? '').trim().toUpperCase())).length;

  return {
    peringatan: hasil,
    ringkas,
    diagnostik: {
      totalPinjaman: rows.length,
      /* Populasi yang benar-benar diperiksa aturan di atas. */
      rekeningLancar: cacahGolongan(['L']),
      rekeningDpk: cacahGolongan(['DPK']),
      dilewatiKarenaNpl: dilewatiNpl,
      dilewatiKarenaGolonganTidakDikenal: dilewatiTakDikenal,
      /*
       * Rekening yang setorannya belum penuh tetapi tunggakannya nol. Tidak
       * ditandai karena tidak dapat dibedakan dari tanggal jatuh tempo yang
       * belum tiba saat nominatif diambil. Dilaporkan agar keputusan ini
       * terlihat dan bisa ditinjau.
       */
      setoranBelumPenuhTanpaTunggakan: tanpaBuktiTunggakan,
      tanpaJadwalAngsuran: kolomKosong('jumlah_angsuran'),
      tanpaTanggalJatuhTempo: (db.prepare('SELECT COUNT(*) AS n FROM loans WHERE tanggal_jatuh_tempo IS NULL').get() as any).n,
      ambang: AMBANG,
      catatanLingkup:
        'Peringatan dini hanya mencakup rekening Lancar yang berpotensi turun ke DPK dan '
        + 'rekening DPK yang mendekati Kurang Lancar. Rekening yang sudah KL, D, atau M '
        + 'ditangani modul Collection & Recovery, bukan di sini.',
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

/* Peringatan menyebut nama nasabah dan nomor rekeningnya. */
router.get('/alerts', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
  if (!wajibMasuk(req, res)) return;
  try {
    const jumlah = (db.prepare('SELECT COUNT(*) AS n FROM loans').get() as any).n;
    if (jumlah === 0) {
      return res.json({
        tersedia: false,
        alasan: 'Belum ada data kredit. Unggah berkas Nominatif Kredit lewat menu Data Center terlebih dahulu.',
        peringatan: [],
        ringkas: {
          total: 0, merah: 0, kuning: 0, belumDitangani: 0, sudahDitangani: 0,
          nilaiTerdampak: 0, lKeDpk: 0, dpkKeKl: 0, nilaiLKeDpk: 0, nilaiDpkKeKl: 0,
        },
      });
    }
    res.json({ tersedia: true, ...hitungPeringatan() });
  } catch (e) {
    console.error('EWS error:', e);
    res.status(500).json({ error: 'Gagal menghitung peringatan dini' });
  }
});

/** Mencatat tindak lanjut. Peringatannya sendiri tetap dihitung dari data. */
router.put('/alerts/:id/tindak-lanjut', wajibPeran(PERAN_LIHAT_NASABAH), (req, res) => {
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
