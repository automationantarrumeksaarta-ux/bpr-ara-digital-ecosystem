import express from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';

/**
 * CRM Nasabah.
 *
 * Menggantikan modul Customer 360 yang membaca `INITIAL_CUSTOMERS` — array
 * kosong yang tidak pernah diisi apa pun — sehingga isinya selalu kosong
 * betapa pun banyak data yang sudah diunggah.
 *
 * Yang dipakai sekarang adalah data yang memang ada: tabel `loans`, `savings`,
 * dan `deposits` hasil unggahan nominatif. Satu nasabah dirangkum dari seluruh
 * produk yang dimilikinya, karena itulah pertanyaan yang sebenarnya dipakai
 * orang CRM di BPR: siapa yang punya kredit tapi belum menabung, siapa yang
 * menabung besar tapi belum pernah mengambil kredit, dan siapa yang sedang
 * bermasalah.
 *
 * CATATAN soal pencocokan. Tabel simpanan dan deposito tidak menyimpan CIF —
 * kolomnya hanya nomor rekening dan nama. Jadi penggabungan antar produk
 * terpaksa memakai nama yang dinormalkan. Itu tidak sempurna: dua orang
 * bernama sama akan menyatu, dan satu orang yang namanya ditulis berbeda di
 * dua produk akan terpisah. Keterbatasan ini dilaporkan apa adanya lewat
 * `diagnostik`, bukan disembunyikan.
 */

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

const NPL = ['KL', 'D', 'M'];
const URUTAN_KOL = ['L', 'DPK', 'KL', 'D', 'M'];

function penggunaDari(req: express.Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    return db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(payload.id) as any ?? null;
  } catch {
    return null;
  }
}

/** Kunci pencocokan antar produk: nama tanpa gelar, spasi rangkap, dan tanda baca. */
const kunciNama = (nama: string): string =>
  String(nama ?? '')
    .toLowerCase()
    .replace(/\b(bpk|bapak|ibu|sdr|sdri|hj|h|drs|dra|ir|st|se|mm|msi|spd)\.?\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface Nasabah {
  kunci: string;
  nama: string;
  cif: string | null;
  ao: string | null;
  wilayah: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  alamat: string | null;
  /* kredit */
  jumlahKredit: number;
  bakiDebet: number;
  tunggakan: number;
  kolektibilitasTerburuk: string | null;
  bermasalah: boolean;
  /* simpanan */
  jumlahTabungan: number;
  saldoTabungan: number;
  jumlahDeposito: number;
  saldoDeposito: number;
  /** kredit | simpanan | keduanya */
  hubungan: 'kredit' | 'simpanan' | 'keduanya';
}

function rangkumNasabah(): { daftar: Nasabah[]; diagnostik: Record<string, unknown> } {
  const peta = new Map<string, Nasabah>();

  const ambil = (kunci: string, nama: string): Nasabah => {
    let n = peta.get(kunci);
    if (!n) {
      n = {
        kunci, nama, cif: null, ao: null, wilayah: null, kecamatan: null,
        kelurahan: null, alamat: null,
        jumlahKredit: 0, bakiDebet: 0, tunggakan: 0,
        kolektibilitasTerburuk: null, bermasalah: false,
        jumlahTabungan: 0, saldoTabungan: 0,
        jumlahDeposito: 0, saldoDeposito: 0,
        hubungan: 'kredit',
      };
      peta.set(kunci, n);
    }
    return n;
  };

  const kredit = db.prepare(`
    SELECT customer_name, account_number, address, outstanding, tunggakan_pokok,
           tunggakan_bunga, collectibility, officer_name, kabupaten, kecamatan, kelurahan
    FROM loans
  `).all() as any[];

  for (const r of kredit) {
    const nama = String(r.customer_name ?? '').trim();
    if (!nama) continue;
    const n = ambil(kunciNama(nama), nama);
    n.jumlahKredit++;
    n.bakiDebet += Number(r.outstanding) || 0;
    n.tunggakan += (Number(r.tunggakan_pokok) || 0) + (Number(r.tunggakan_bunga) || 0);
    n.ao ??= r.officer_name || null;
    n.wilayah ??= r.kabupaten || null;
    n.kecamatan ??= r.kecamatan || null;
    n.kelurahan ??= r.kelurahan || null;
    n.alamat ??= r.address || null;
    n.cif ??= r.account_number || null;

    const kol = String(r.collectibility ?? '').toUpperCase();
    if (URUTAN_KOL.includes(kol)) {
      const kini = n.kolektibilitasTerburuk;
      if (!kini || URUTAN_KOL.indexOf(kol) > URUTAN_KOL.indexOf(kini)) {
        n.kolektibilitasTerburuk = kol;
      }
    }
    if (NPL.includes(kol)) n.bermasalah = true;
  }

  const tambahSimpanan = (tabel: 'savings' | 'deposits') => {
    let baris: any[] = [];
    try {
      baris = db.prepare(`SELECT customer_name, balance, officer_name FROM ${tabel}`).all() as any[];
    } catch {
      return 0;
    }
    for (const r of baris) {
      const nama = String(r.customer_name ?? '').trim();
      if (!nama) continue;
      const n = ambil(kunciNama(nama), nama);
      n.ao ??= r.officer_name || null;
      if (tabel === 'savings') {
        n.jumlahTabungan++;
        n.saldoTabungan += Number(r.balance) || 0;
      } else {
        n.jumlahDeposito++;
        n.saldoDeposito += Number(r.balance) || 0;
      }
    }
    return baris.length;
  };

  const nTabungan = tambahSimpanan('savings');
  const nDeposito = tambahSimpanan('deposits');

  const daftar = [...peta.values()].map(n => {
    const punyaKredit = n.jumlahKredit > 0;
    const punyaSimpanan = n.jumlahTabungan + n.jumlahDeposito > 0;
    n.hubungan = punyaKredit && punyaSimpanan ? 'keduanya' : punyaKredit ? 'kredit' : 'simpanan';
    return n;
  });

  return {
    daftar,
    diagnostik: {
      barisKredit: kredit.length,
      barisTabungan: nTabungan,
      barisDeposito: nDeposito,
      nasabahUnik: daftar.length,
      /*
       * Disebutkan terbuka karena memengaruhi cara membaca angkanya: tanpa CIF
       * bersama, penggabungan antar produk hanya seakurat penulisan namanya.
       */
      catatanPencocokan:
        'Tabel simpanan dan deposito tidak menyimpan CIF, sehingga penggabungan antar produk '
        + 'memakai nama yang dinormalkan. Nasabah dengan nama yang ditulis berbeda antar produk '
        + 'akan terhitung terpisah.',
    },
  };
}

/* ------------------------------------------------------------------- rute */

router.get('/nasabah', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  try {
    const { daftar, diagnostik } = rangkumNasabah();

    if (daftar.length === 0) {
      return res.json({
        tersedia: false,
        alasan: 'Belum ada data nasabah. Unggah berkas nominatif kredit, tabungan, atau deposito lewat menu Data Center.',
        data: [], ringkas: null, diagnostik,
      });
    }

    const totalBaki = daftar.reduce((s, n) => s + n.bakiDebet, 0);
    const totalSimpanan = daftar.reduce((s, n) => s + n.saldoTabungan + n.saldoDeposito, 0);

    res.json({
      tersedia: true,
      data: daftar.sort((a, b) =>
        (b.bakiDebet + b.saldoTabungan + b.saldoDeposito) -
        (a.bakiDebet + a.saldoTabungan + a.saldoDeposito)),
      ringkas: {
        totalNasabah: daftar.length,
        hanyaKredit: daftar.filter(n => n.hubungan === 'kredit').length,
        hanyaSimpanan: daftar.filter(n => n.hubungan === 'simpanan').length,
        keduanya: daftar.filter(n => n.hubungan === 'keduanya').length,
        bermasalah: daftar.filter(n => n.bermasalah).length,
        totalBakiDebet: totalBaki,
        totalSimpanan,
      },
      diagnostik,
    });
  } catch (e) {
    console.error('CRM error:', e);
    res.status(500).json({ error: 'Gagal memuat data nasabah' });
  }
});

/** Rincian seluruh rekening milik satu nasabah. */
router.get('/nasabah/:kunci', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Tidak memiliki akses' });

  try {
    const kunci = decodeURIComponent(req.params.kunci);
    const { daftar } = rangkumNasabah();
    const nasabah = daftar.find(n => n.kunci === kunci);
    if (!nasabah) return res.status(404).json({ error: 'Nasabah tidak ditemukan' });

    const cocok = (nama: string) => kunciNama(nama) === kunci;

    const kredit = (db.prepare(`
      SELECT account_number, customer_name, outstanding, limit_amount, tunggakan_pokok,
             tunggakan_bunga, collectibility, officer_name, tanggal_jatuh_tempo,
             taksasi, ikatan, jumlah_angsuran, angsuran_masuk, frek_tunggakan
      FROM loans
    `).all() as any[]).filter(r => cocok(r.customer_name));

    const ambilSimpanan = (tabel: string) => {
      try {
        return (db.prepare(`SELECT * FROM ${tabel}`).all() as any[]).filter(r => cocok(r.customer_name));
      } catch { return []; }
    };

    res.json({
      success: true,
      nasabah,
      kredit,
      tabungan: ambilSimpanan('savings'),
      deposito: ambilSimpanan('deposits'),
    });
  } catch (e) {
    console.error('CRM detail error:', e);
    res.status(500).json({ error: 'Gagal memuat rincian nasabah' });
  }
});

export default router;
