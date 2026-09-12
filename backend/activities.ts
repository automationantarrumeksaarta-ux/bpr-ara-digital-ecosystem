import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { JWT_SECRET } from './keamanan.js';

const router = express.Router();


/** Zona waktu kantor — sama dengan yang dipakai absensi. */
const ZONA_WAKTU = process.env.TZ_KANTOR || 'Asia/Jakarta';

/** Tanggal kerja YYYY-MM-DD menurut zona waktu kantor, bukan zona server. */
const tanggalKantor = (d = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);

/**
 * Ambil identitas dari token. Endpoint aktivitas memuat foto dan titik
 * koordinat pegawai, jadi tidak boleh terbuka seperti /api/attendances.
 */
function penggunaDari(req: express.Request): { id: string; name: string; role: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    // `role` ikut diambil karena cakupan "semua" dibatasi peran tertentu.
    const user = db
      .prepare('SELECT id, name, role FROM users WHERE id = ?')
      .get(payload.id) as { id: string; name: string; role: string } | undefined;
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Daftar aktivitas lapangan.
 *
 * Cakupan ditentukan parameter `lingkup`:
 *
 * - tanpa parameter / `saya` — aktivitas milik sendiri. Inilah yang dipakai
 *   aplikasi; tanpa `dari`/`sampai` dibatasi hari ini saja supaya daftarnya
 *   tidak menumpuk di layar sempit.
 * - `tim` — milik sendiri ditambah seluruh bawahan berjenjang, menurut
 *   task_routes (isian "Lapor / Arahkan Task Ke" di menu Super Admin).
 * - `semua` — seluruh pegawai. DIBATASI peran tertentu.
 *
 * Pembatasan itu penting: sebelumnya `?semua=1` tidak diperiksa sama sekali,
 * sehingga setiap pengguna yang sudah masuk dapat membaca catatan kunjungan
 * seluruh karyawan — termasuk foto dan titik lokasinya.
 */

/** Peran yang boleh membaca aktivitas seluruh karyawan. */
const BOLEH_LIHAT_SEMUA = [
  'Super Admin', 'Master Admin', 'Direktur Utama', 'Direktur YMFK',
  'Pengembangan SDM', 'Admin Legal & SDM', 'PE Bisnis & Collection',
  'Koordinator Collection', 'CRM & Digitalisasi',
];

/** Seluruh bawahan berjenjang menurut task_routes. */
function bawahanBerjenjang(atasanId: string): string[] {
  const baris = db.prepare('SELECT user_id, supervisor_id FROM task_routes').all() as any[];
  const anak = new Map<string, string[]>();
  for (const r of baris) {
    if (!r.supervisor_id) continue;
    const d = anak.get(r.supervisor_id) ?? [];
    d.push(r.user_id);
    anak.set(r.supervisor_id, d);
  }
  const hasil = new Set<string>();
  const antre = [...(anak.get(atasanId) ?? [])];
  while (antre.length) {
    const id = antre.pop()!;
    if (hasil.has(id) || id === atasanId) continue;
    hasil.add(id);
    antre.push(...(anak.get(id) ?? []));
  }
  return [...hasil];
}

router.get('/', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // `semua=1` dipertahankan demi pemanggil lama, dipetakan ke lingkup baru.
    const lingkup = String(req.query.lingkup ?? (req.query.semua === '1' ? 'semua' : 'saya'));
    const dari = req.query.dari as string | undefined;
    const sampai = req.query.sampai as string | undefined;

    const syarat: string[] = [];
    const nilai: any[] = [];

    if (lingkup === 'semua') {
      if (!BOLEH_LIHAT_SEMUA.includes(pengguna.role)) {
        return res.status(403).json({
          error: 'Anda tidak berwenang membaca aktivitas seluruh karyawan.',
        });
      }
    } else if (lingkup === 'tim') {
      const ids = [pengguna.id, ...bawahanBerjenjang(pengguna.id)];
      syarat.push(`user_id IN (${ids.map(() => '?').join(',')})`);
      nilai.push(...ids);
    } else {
      syarat.push('user_id = ?');
      nilai.push(pengguna.id);
    }

    if (dari) { syarat.push('date >= ?'); nilai.push(dari); }
    if (sampai) { syarat.push('date <= ?'); nilai.push(sampai); }

    // Tanpa rentang tanggal, cakupan "saya" dibatasi hari ini — perilaku yang
    // diandalkan layar aktivitas di aplikasi.
    if (!dari && !sampai && lingkup === 'saya') {
      syarat.push('date = ?');
      nilai.push(tanggalKantor());
    }

    const where = syarat.length ? `WHERE ${syarat.join(' AND ')}` : '';
    const baris = db.prepare(`
      SELECT * FROM activities ${where}
      ORDER BY date DESC, created_at DESC
      LIMIT 2000
    `).all(...nilai);

    res.json({
      success: true,
      data: baris,
      lingkup,
      bolehLihatSemua: BOLEH_LIHAT_SEMUA.includes(pengguna.role),
    });
  } catch (error: any) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Gagal memuat aktivitas' });
  }
});

/** Catat satu aktivitas lapangan. */
router.post('/', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { photo_url, lat, lng, location, description } = req.body;

    if (!photo_url) {
      return res.status(400).json({ error: 'Foto wajib diunggah' });
    }
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      return res.status(400).json({ error: 'Lokasi wajib terdeteksi' });
    }

    const id = 'act-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    db.prepare(`
      INSERT INTO activities (id, user_id, user_name, date, photo_url, lat, lng, location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, pengguna.id, pengguna.name, tanggalKantor(),
      photo_url, Number(lat), Number(lng),
      location ?? null, (description ?? '').trim() || null,
    );

    const baru = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: baru, message: 'Aktivitas tersimpan' });
  } catch (error: any) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Gagal menyimpan aktivitas' });
  }
});

/** Hapus aktivitas milik sendiri — untuk membatalkan salah unggah. */
router.delete('/:id', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const info = db
      .prepare('DELETE FROM activities WHERE id = ? AND user_id = ?')
      .run(req.params.id, pengguna.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Aktivitas tidak ditemukan' });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Gagal menghapus aktivitas' });
  }
});

export default router;
