import express from 'express';
import { db } from './db.js';

const router = express.Router();

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
    const { user_id, lat, lng, location } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Check if already clocked in today
    const existing = db.prepare('SELECT * FROM attendances WHERE user_id = ? AND date = ?').get(user_id, today) as any;
    if (existing) {
      return res.status(400).json({ error: 'Already clocked in for today' });
    }

    const id = 'att-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    // Check if late (e.g. after 08:30)
    const status = now > '08:30' ? 'Terlambat' : 'Hadir';

    db.prepare(`
      INSERT INTO attendances (id, user_id, date, clock_in_time, clock_in_lat, clock_in_lng, clock_in_location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user_id, today, now, lat || null, lng || null, location || null, status);

    const newRecord = db.prepare('SELECT * FROM attendances WHERE id = ?').get(id);
    res.json({ success: true, data: newRecord, message: 'Berhasil Absen Masuk' });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock Out
router.post('/clock-out', (req, res) => {
  try {
    const { user_id, lat, lng, location } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

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
    res.json({ success: true, data: updatedRecord, message: 'Berhasil Absen Pulang' });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

export default router;
