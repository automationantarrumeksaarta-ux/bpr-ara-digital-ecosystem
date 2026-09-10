import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

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
function penggunaDari(req: express.Request): { id: string; name: string } | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as any;
    const user = db
      .prepare('SELECT id, name FROM users WHERE id = ?')
      .get(payload.id) as { id: string; name: string } | undefined;
    return user ?? null;
  } catch {
    return null;
  }
}

/**
 * Daftar aktivitas.
 *
 * Tanpa parameter: aktivitas HARI INI milik pengguna yang sedang masuk —
 * itulah yang ditampilkan di aplikasi, supaya daftarnya tidak menumpuk.
 * Dengan ?semua=1: seluruh riwayat semua pegawai, untuk menu Marketing di web.
 */
router.get('/', (req, res) => {
  const pengguna = penggunaDari(req);
  if (!pengguna) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { semua, date, user_id } = req.query;

    if (semua === '1') {
      const baris = db.prepare(`
        SELECT * FROM activities
        ORDER BY date DESC, created_at DESC
        LIMIT 500
      `).all();
      return res.json({ success: true, data: baris });
    }

    const tanggal = (date as string) || tanggalKantor();
    const pemilik = (user_id as string) || pengguna.id;
    const baris = db.prepare(`
      SELECT * FROM activities
      WHERE user_id = ? AND date = ?
      ORDER BY created_at DESC
    `).all(pemilik, tanggal);

    res.json({ success: true, data: baris, date: tanggal });
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
