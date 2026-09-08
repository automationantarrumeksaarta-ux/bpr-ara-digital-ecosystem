import express from 'express';
import { db } from './db.js';

const router = express.Router();

// Get user notifications
router.get('/', (req: any, res) => {
  try {
    const { userId, role, username } = req.query;
    if (!userId && !role && !username) {
      return res.status(400).json({ error: 'Missing identifying parameters' });
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
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, module, priority, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id || `notif-${Date.now()}`,
      userId,
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
