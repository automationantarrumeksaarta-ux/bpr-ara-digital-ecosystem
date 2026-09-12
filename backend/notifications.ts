import express from 'express';
import { db } from './db.js';
import { punyaPeran, PERAN_ADMIN } from './keamanan.js';

const router = express.Router();

/**
 * Notifikasi milik siapa ditentukan oleh token, bukan oleh parameter kueri.
 *
 * Sebelumnya `userId`, `role`, dan `username` dibaca dari query string tanpa
 * pemeriksaan token sama sekali, sehingga notifikasi siapa pun dapat dibaca
 * hanya dengan menebak id-nya. `POST /` bahkan menerima notifikasi baru tanpa
 * login, jadi siapa pun dapat mengirim pemberitahuan yang tampak berasal dari
 * sistem ke akun mana pun — termasuk yang menyuruh membuka tautan.
 */

// Get user notifications
router.get('/', (req: any, res) => {
  try {
    const pengguna = (req as any).pengguna;
    /* Selalu dari sesi yang sedang berjalan; parameter kueri tidak dipakai
       untuk menentukan pemiliknya. */
    const userId = pengguna?.id;
    const role = pengguna?.role;
    const username = pengguna?.username;
    if (!userId) {
      return res.status(401).json({ error: 'Anda perlu masuk terlebih dahulu' });
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? OR user_id = ? OR user_id = ? OR user_id = 'all'
      ORDER BY timestamp DESC
    `).all(userId, role, username);
    
    // Map SQLite snake_case to frontend camelCase
    const mapped = notifications.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      module: n.module,
      priority: n.priority,
      read: Boolean(n.read),
      timestamp: n.timestamp
    }));

    res.json({ notifications: mapped });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.put('/read-all', (req: any, res) => {
  try {
    const { userId, role, username } = req.body;
    db.prepare(`
      UPDATE notifications SET read = 1 
      WHERE user_id = ? OR user_id = ? OR user_id = ? OR user_id = 'all'
    `).run(userId, role, username);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark single as read
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Create notification
router.post('/', (req, res) => {
  try {
    const { id, userId, title, message, module, priority, timestamp } = req.body;

    /*
     * Mengirim notifikasi ke orang lain adalah tindakan atas nama sistem, jadi
     * dibatasi pada admin. Selain itu seseorang hanya dapat membuat notifikasi
     * untuk dirinya sendiri.
     */
    const pengirim = (req as any).pengguna;
    const sasaran = userId ?? pengirim?.id;
    if (sasaran !== pengirim?.id && !punyaPeran(pengirim, PERAN_ADMIN)) {
      return res.status(403).json({ error: 'Anda tidak dapat mengirim notifikasi untuk pengguna lain' });
    }

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, priority, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id || `notif-${Date.now()}`,
      sasaran,
      title,
      message,
      module || 'SYSTEM',
      priority || 'NORMAL',
      timestamp || new Date().toISOString()
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

export default router;
