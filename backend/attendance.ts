import express from 'express';
import { db } from './db.js';
import {
  KANTOR, RADIUS_ABSEN_METER, AKURASI_MAKS_METER, periksaLokasiAbsen,
} from './kantor.js';

const router = express.Router();

/**
 * Waktu absensi HARUS dihitung dalam zona waktu kantor, bukan zona waktu
 * server. Tiga masalah pada versi sebelumnya:
 *
 * 1. `new Date().toISOString().split('T')[0]` memakai tanggal UTC. Absen pada
 *    00:00–06:59 WIB tercatat di tanggal kemarin.
 * 2. `toLocaleTimeString('id-ID')` memakai zona waktu SERVER. Di VPS yang
 *    zonanya UTC (bawaan umum), absen 08:00 WIB tersimpan sebagai "01.00" —
 *    seluruh jam absensi meleset 7 jam.
 * 3. Format id-ID memakai titik ("08.45"), lalu dibandingkan sebagai string
 *    dengan '08:30'. Karena '.' (46) < ':' (58), "08.45" > "08:30" bernilai
 *    false — pegawai yang datang pukul 08.45 tidak pernah ditandai terlambat.
 *
 * ZONA_WAKTU bisa diubah lewat env untuk kantor di zona lain (WITA/WIT).
 */
const ZONA_WAKTU = process.env.TZ_KANTOR || 'Asia/Jakarta';

/** Tanggal kerja YYYY-MM-DD menurut zona waktu kantor. */
const tanggalKantor = (d = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_WAKTU, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);

/** Jam HH:MM (24 jam, selalu titik dua) menurut zona waktu kantor. */
const jamKantor = (d = new Date()): string =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_WAKTU, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);

/** Bandingkan "HH:MM" sebagai menit, bukan sebagai string. */
const keMenit = (jam: string): number => {
  const m = jam.match(/(\d{1,2})[:.](\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};

const BATAS_TERLAMBAT = keMenit(process.env.JAM_MASUK_BATAS || '08:30');

/**
 * Daftar kantor dan aturan jaraknya.
 *
 * Diambil aplikasi saat layar absen dibuka. Sengaja dilayani server, bukan
 * ditanam di dalam APK, supaya menambah atau memindahkan kantor tidak menuntut
 * pembangunan ulang aplikasi.
 */
router.get('/kantor', (_req, res) => {
  res.json({
    kantor: KANTOR,
    radiusMeter: RADIUS_ABSEN_METER,
    akurasiMaksMeter: AKURASI_MAKS_METER,
  });
});

// Get attendance records for a user
router.get('/', (req, res) => {
  try {
    const { user_id, month, year } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    let query = 'SELECT * FROM attendances WHERE user_id = ?';
    const params: any[] = [user_id];

    if (month && year) {
      query += ' AND date LIKE ?';
      params.push(`${year}-${month.toString().padStart(2, '0')}-%`);
    }
    
    query += ' ORDER BY date DESC';

    const records = db.prepare(query).all(...params);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Clock In
router.post('/clock-in', (req, res) => {
  try {
    const { user_id, lat, lng, location, akurasi } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    /*
     * Jarak diperiksa di server, bukan hanya di ponsel.
     *
     * Koordinat dikirim dari peramban dan bisa diubah siapa saja dengan alat
     * pengembang. Pemeriksaan di layar hanya untuk memberi tahu pengguna lebih
     * awal; yang menentukan diterima atau tidak adalah pemeriksaan di sini.
     */
    const lokasi = periksaLokasiAbsen(lat, lng, akurasi);
    if (!lokasi.boleh) {
      return res.status(400).json({ error: lokasi.alasan });
    }

    const today = tanggalKantor();
    const now = jamKantor();

    // Check if already clocked in today
    const existing = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(user_id, today) as any;
    if (existing) {
      return res.status(400).json({ error: 'Already clocked in for today' });
    }

    const id = 'att-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    const status = keMenit(now) > BATAS_TERLAMBAT ? 'Terlambat' : 'Hadir';

    db.prepare(`
      INSERT INTO attendances (id, user_id, date, clock_in_time, clock_in_lat, clock_in_lng, clock_in_location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id, today, now, lat || null, lng || null, location || null, status);

    const newRecord = db.prepare('SELECT * FROM attendances WHERE id = ?').get(id);
    res.json({
      success: true,
      data: newRecord,
      message: `Absen masuk tercatat di ${lokasi.kantor?.nama}, ${Math.round(lokasi.jarak ?? 0)} meter dari titik kantor.`,
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock Out
router.post('/clock-out', (req, res) => {
  try {
    const { user_id, lat, lng, location, akurasi } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const lokasi = periksaLokasiAbsen(lat, lng, akurasi);
    if (!lokasi.boleh) {
      return res.status(400).json({ error: lokasi.alasan });
    }

    const today = tanggalKantor();
    const now = jamKantor();

    const existing = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(user_id, today) as any;
    if (!existing) {
      return res.status(400).json({ error: 'No clock in record found for today' });
    }
    if (existing.clock_out_time) {
      return res.status(400).json({ error: 'Already clocked out for today' });
    }

    db.prepare(`
      UPDATE attendances 
      SET clock_out_time = ?, clock_out_lat = ?, clock_out_lng = ?, clock_out_location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(now, lat || null, lng || null, location || null, existing.id);

    const updatedRecord = db.prepare('SELECT * FROM attendances WHERE id = ?').get(existing.id);
    res.json({
      success: true,
      data: updatedRecord,
      message: `Absen pulang tercatat di ${lokasi.kantor?.nama}, ${Math.round(lokasi.jarak ?? 0)} meter dari titik kantor.`,
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

export default router;
