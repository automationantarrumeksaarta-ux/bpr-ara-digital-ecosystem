import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

/**
 * Penjagaan akses terpusat.
 *
 * Sebelum berkas ini ada, tiap modul backend menjaga dirinya sendiri — dan tiga
 * di antaranya tidak menjaga apa pun. `parser.ts`, `attendance.ts`, dan
 * `notifications.ts` tidak memuat satu pun pemeriksaan token, padahal di
 * situlah endpoint `/api/metrics` berada. Endpoint itu mengembalikan NPL, baki
 * debet, tabungan, deposito, laba berjalan, total aset, dan nama seluruh AO
 * kepada siapa pun yang membuka alamatnya tanpa perlu masuk. `/api/ews`
 * mengembalikan nama nasabah beserta kolektibilitasnya dengan cara yang sama,
 * dan `POST /api/attendances/clock-in` menerima absensi atas nama siapa pun
 * karena identitasnya diambil dari badan permintaan.
 *
 * Menjaga di satu tempat berarti endpoint baru ikut terjaga tanpa perlu
 * diingat. Rute dipasang lewat penjaga ini di server.ts, bukan dijaga satu per
 * satu di dalam modulnya.
 */

/* --------------------------------------------------------------- rahasia */

const BERKAS_RAHASIA = path.join(process.cwd(), 'data', '.rahasia-jwt');

/**
 * Kunci penanda tangan token.
 *
 * Sebelumnya nilainya `process.env.JWT_SECRET || 'ara_secret_key_2026'`,
 * ditulis di enam berkas. Nilai cadangan yang tertulis di kode bukan cadangan:
 * siapa pun yang pernah melihat kode dapat menempa token untuk akun mana pun,
 * termasuk Super Admin. Bila variabel lingkungannya tidak disetel, kunci acak
 * dibuat sekali lalu disimpan, supaya token tetap berlaku antar-nyala ulang
 * tanpa pernah ada nilai yang bisa ditebak dari kode.
 */
function muatRahasia(): string {
  const dariEnv = process.env.JWT_SECRET;
  if (dariEnv && dariEnv.trim() !== '') return dariEnv;

  try {
    if (fs.existsSync(BERKAS_RAHASIA)) {
      const isi = fs.readFileSync(BERKAS_RAHASIA, 'utf8').trim();
      if (isi) return isi;
    }
    const baru = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(path.dirname(BERKAS_RAHASIA), { recursive: true });
    fs.writeFileSync(BERKAS_RAHASIA, baru, { mode: 0o600 });
    console.warn(
      'JWT_SECRET tidak disetel. Kunci acak dibuat dan disimpan di data/.rahasia-jwt. '
      + 'Seluruh sesi yang sedang berjalan menjadi tidak berlaku dan pengguna perlu masuk lagi.',
    );
    return baru;
  } catch (e) {
    /*
     * Bila penyimpanan gagal, kunci acak dalam memori tetap jauh lebih baik
     * daripada nilai yang tertulis di kode. Akibatnya sesi berakhir setiap kali
     * server dinyalakan ulang, dan itu disebutkan terang-terangan di log.
     */
    console.error(
      'Gagal menyimpan kunci JWT; memakai kunci sementara dalam memori. '
      + 'Semua sesi akan berakhir setiap server dinyalakan ulang. Setel JWT_SECRET untuk menghentikannya.',
      e,
    );
    return crypto.randomBytes(48).toString('hex');
  }
}

export const JWT_SECRET = muatRahasia();

/* ----------------------------------------------------------------- peran */

/**
 * Membandingkan nama peran tanpa terpengaruh huruf besar-kecil, spasi, dan
 * tanda baca.
 *
 * Daftar izin yang sudah ada menuliskan 'Pengembangan SDM', 'Koordinator
 * Collection', dan 'CRM & Digitalisasi', sedangkan peran yang benar-benar
 * dipakai sistem adalah 'PENGEMBANGAN SDM', 'KOORDINATOR COLLECTION', dan
 * 'CRM & DIGITALISASI'. Perbandingan persis membuat ketiganya tidak pernah
 * cocok, sehingga orang yang seharusnya berwenang justru ditolak tanpa ada
 * yang menyadarinya.
 */
const normalkan = (s: unknown): string =>
  String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function punyaPeran(pengguna: any, daftar: string[]): boolean {
  if (!pengguna) return false;
  const milik = [normalkan(pengguna.role), normalkan(pengguna.roleTier)];
  return daftar.some(p => milik.includes(normalkan(p)));
}

/** Peran dengan kewenangan penuh atas pengaturan sistem. */
export const PERAN_ADMIN = ['Super Admin', 'Master Admin'];

/**
 * Peran yang boleh membaca data tingkat nasabah dan direktori pegawai.
 *
 * Angka ringkas seperti NPL dan baki debet total tidak termasuk di sini: itu
 * angka manajemen yang memang dipakai seluruh dashboard internal, dan
 * membatasinya akan mematikan layar utama bagi hampir semua orang. Yang
 * dibatasi adalah data yang menyebut orang per orang.
 */
export const PERAN_LIHAT_NASABAH = [
  ...PERAN_ADMIN,
  'Direktur Utama', 'Direktur YMFK', 'Komisaris Utama', 'Komisaris',
  'PE Kepatuhan, Manrisk, APU PPT',
  'PE Audit Intern & Strategi Anti Fraud',
  'PE Literasi & Edukasi, PE Bisnis & Collection',
  'KOORDINATOR COLLECTION', 'STAFF COLLECTION',
  'ANALIS KREDIT', 'Account Officer', 'Kepala Cabang', 'Kepala Kas',
  'CRM & DIGITALISASI', 'Marketing Dana', 'Surveyor', 'ACCOUNTING',
];

/* ------------------------------------------------------------- pengguna */

export interface PenggunaMasuk {
  id: string;
  username: string;
  name: string;
  role: string;
  roleTier: string;
  unit: string;
  status: string;
}

/**
 * Membaca pengguna dari token, lalu memuat datanya dari basis data.
 *
 * Isi token sengaja tidak dipercaya untuk peran maupun status. Token berlaku
 * tujuh hari; bila peran seseorang dicabut atau akunnya dinonaktifkan hari ini,
 * token yang terbit kemarin masih membawa peran lamanya. Membaca ulang dari
 * tabel membuat pencabutan berlaku seketika.
 */
export function penggunaDariToken(req: express.Request): PenggunaMasuk | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const isi = jwt.verify(header.slice(7), JWT_SECRET) as any;
    const baris = db.prepare(
      'SELECT id, username, name, role, roleTier, unit, status FROM users WHERE id = ?',
    ).get(isi.id) as PenggunaMasuk | undefined;
    return baris ?? null;
  } catch {
    return null;
  }
}

/**
 * Seluruh baris pengguna, termasuk kolom yang tidak dibutuhkan penjagaan —
 * surel dan hash sandi. Dipakai hanya oleh rute yang memang mengurus akun itu
 * sendiri, seperti ubah profil dan ganti sandi.
 */
export function barisPenggunaDariToken(req: express.Request): any | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const isi = jwt.verify(header.slice(7), JWT_SECRET) as any;
    return db.prepare('SELECT * FROM users WHERE id = ?').get(isi.id) ?? null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------- middleware */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      pengguna?: PenggunaMasuk;
    }
  }
}

/**
 * Menolak permintaan tanpa token yang sah dari akun berstatus aktif.
 *
 * Status ikut diperiksa di sini, bukan hanya saat masuk. Akun berstatus PENDING
 * yang sempat memperoleh token — dan itu mungkin terjadi, lihat catatan di
 * `/login` — berhenti berlaku pada permintaan berikutnya.
 */
export const wajibMasuk: express.RequestHandler = (req, res, next) => {
  const pengguna = penggunaDariToken(req);
  if (!pengguna) {
    return res.status(401).json({ error: 'Anda perlu masuk terlebih dahulu' });
  }
  if (String(pengguna.status).toUpperCase() !== 'ACTIVE') {
    return res.status(403).json({
      error: 'Akun Anda belum aktif. Hubungi Super Admin untuk mengaktifkannya.',
    });
  }
  req.pengguna = pengguna;
  next();
};

/** Membatasi sebuah rute pada daftar peran tertentu. */
export const wajibPeran = (daftar: string[]): express.RequestHandler => (req, res, next) => {
  const pengguna = req.pengguna ?? penggunaDariToken(req);
  if (!pengguna) {
    return res.status(401).json({ error: 'Anda perlu masuk terlebih dahulu' });
  }
  if (!punyaPeran(pengguna, daftar)) {
    return res.status(403).json({ error: 'Peran Anda tidak memiliki akses ke data ini' });
  }
  req.pengguna = pengguna;
  next();
};
