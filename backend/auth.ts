import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { sendOtpEmail } from './email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, username } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    // Upsert OTP
    db.prepare(`
      INSERT INTO otp_verifications (email, otp_code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET otp_code = excluded.otp_code, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP
    `).run(email, otpCode, expiresAt);

    await sendOtpEmail(email, otpCode, name);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role, roleTier, unit, otpCode } = req.body;
    
    if (!username || !email || !password || !otpCode) {
      return res.status(400).json({ error: 'Missing required fields including OTP code' });
    }

    // Verify OTP
    const verification = db.prepare('SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ?').get(email, otpCode) as any;
    if (!verification) {
      return res.status(400).json({ error: 'Kode OTP tidak valid' });
    }

    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ error: 'Kode OTP sudah kadaluarsa' });
    }

    // Check if user already exists (again, just in case)
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = 'usr-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, name, role, roleTier, unit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      userId,
      username,
      email,
      password_hash,
      name || username,
      role || 'User',
      roleTier || 'LOW',
      unit || 'PMO'
    );

    // Delete OTP after successful use
    db.prepare('DELETE FROM otp_verifications WHERE email = ?').run(email);

    res.status(201).json({ 
      message: 'Registrasi berhasil. Silakan tunggu admin untuk memberikan akses Role kepada Anda sebelum dapat login.',
      user: {
        id: userId,
        username,
        email,
        name: name || username,
        role: role || 'User',
        roleTier: roleTier || 'LOW',
        unit: unit || 'PMO',
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login OTP Generation
router.post('/login-otp', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Akun Anda belum aktif. Silakan hubungi admin untuk memberikan Role dan mengaktifkan akun Anda.' });
    }

    let targetEmail = user.email;
    if (user.username === 'admin' || user.roleTier === 'Super Admin' || user.role === 'Super Admin') {
      targetEmail = 'bprara.noreply@gmail.com';
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otp_verifications (email, otp_code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET otp_code = excluded.otp_code, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP
    `).run(targetEmail, otpCode, expiresAt);

    await sendOtpEmail(targetEmail, otpCode, user.name);

    // Mask email for privacy (e.g. j***@gmail.com)
    const emailParts = targetEmail.split('@');
    const maskedEmail = emailParts[0].length > 3 
      ? emailParts[0].substring(0, 3) + '***@' + emailParts[1]
      : emailParts[0].substring(0, 1) + '***@' + emailParts[1];

    res.json({ message: 'OTP sent successfully', maskedEmail, email: targetEmail });
  } catch (error) {
    console.error('Login OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be username or email
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { otpCode } = req.body;
    if (!otpCode) {
      return res.status(400).json({ error: 'OTP Code is required' });
    }

    let targetEmail = user.email;
    if (user.username === 'admin' || user.roleTier === 'Super Admin' || user.role === 'Super Admin') {
      targetEmail = 'bprara.noreply@gmail.com';
    }

    // Verify OTP
    const verification = db.prepare('SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ?').get(targetEmail, otpCode) as any;
    if (!verification) {
      return res.status(400).json({ error: 'Kode OTP tidak valid' });
    }

    if (new Date() > new Date(verification.expires_at)) {
      return res.status(400).json({ error: 'Kode OTP sudah kadaluarsa' });
    }

    // Delete OTP after successful use
    db.prepare('DELETE FROM otp_verifications WHERE email = ?').run(targetEmail);

    // Create JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleTier: user.roleTier,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        roleTier: user.roleTier,
        unit: user.unit,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Me (Get current user via token)
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT id, username, email, name, role, roleTier, unit, status FROM users WHERE id = ?').get(decoded.id);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users (for Super Admin panel)
router.get('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // All authenticated users can fetch basic user list for resolving PIC names
    // No admin verification needed here.

    const users = db.prepare('SELECT id, username, email, name, role, roleTier, unit, status, created_at FROM users').all();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const requestingUser = db.prepare('SELECT role, roleTier FROM users WHERE id = ?').get(decoded.id) as any;
    if (!requestingUser || (requestingUser.role !== 'Super Admin' && requestingUser.role !== 'Master Admin' && requestingUser.roleTier !== 'Super Admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { role } = req.body;
    const { id } = req.params;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const info = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get all role permissions
router.get('/role-permissions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET); // just verify token exists
    
    const perms = db.prepare('SELECT * FROM role_permissions').all() as any[];
    const formatted: Record<string, string[]> = {};
    for (const p of perms) {
      try {
        formatted[p.role] = JSON.parse(p.permissions);
      } catch(e) {}
    }
    res.json({ rolePermissions: formatted });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Update role permissions
router.put('/role-permissions/:role', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const requestingUser = db.prepare('SELECT role, roleTier FROM users WHERE id = ?').get(decoded.id) as any;
    if (!requestingUser || (requestingUser.role !== 'Super Admin' && requestingUser.role !== 'Master Admin' && requestingUser.roleTier !== 'Super Admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { role } = req.params;
    const { permissions } = req.body; // should be an array of strings

    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const jsonPerms = JSON.stringify(permissions);

    // Upsert the permissions for this role
    const info = db.prepare(`
      INSERT INTO role_permissions (role, permissions, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(role) DO UPDATE SET permissions = excluded.permissions, updated_at = CURRENT_TIMESTAMP
    `).run(role, jsonPerms);
    
    res.json({ message: 'Role permissions updated successfully' });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// Get all task routes
router.get('/task-routes', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const routes = db.prepare('SELECT * FROM task_routes').all() as any[];
    const formatted: Record<string, string> = {};
    for (const r of routes) {
      formatted[r.user_id] = r.supervisor_id;
    }
    res.json({ taskRoutes: formatted });
  } catch (error) {
    console.error('Get task routes error:', error);
    res.status(500).json({ error: 'Failed to fetch task routes' });
  }
});

// Update a single task route
router.put('/task-routes/:userId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const requestingUser = db.prepare('SELECT role, roleTier FROM users WHERE id = ?').get(decoded.id) as any;
    if (!requestingUser || (requestingUser.role !== 'Super Admin' && requestingUser.role !== 'Master Admin' && requestingUser.roleTier !== 'Super Admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId } = req.params;
    const { supervisorId } = req.body;

    if (!userId || !supervisorId) {
      return res.status(400).json({ error: 'userId and supervisorId are required' });
    }

    db.prepare(`
      INSERT INTO task_routes (user_id, supervisor_id, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET supervisor_id = excluded.supervisor_id, updated_at = CURRENT_TIMESTAMP
    `).run(userId, supervisorId);

    res.json({ message: 'Task route updated successfully' });
  } catch (error) {
    console.error('Update task route error:', error);
    res.status(500).json({ error: 'Failed to update task route' });
  }
});

// ==================== BEIS TASKS CRUD ====================

// Get all tasks
router.get('/tasks', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const tasks = db.prepare('SELECT * FROM beis_tasks ORDER BY created_at DESC').all();
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a new task
router.post('/tasks', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const t = req.body;
    if (!t.id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    db.prepare(`
      INSERT OR REPLACE INTO beis_tasks 
      (id, tanggal, deskripsi_tugas, jenis_teknis, timeline, prioritas, status,
       tanggal_fu, penyelesaian, pic, assigned_to, validator, beis_domain, beis_level,
       beis_category, unit, output_dod, output_dod2, outcome, category, subcategory,
       arahan, synced_to_calendar, evidence_files, mentions, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      t.id, t.tanggal || '', t.deskripsiTugas || '', t.jenisTeknis || '',
      t.timeline || '', t.prioritas || '', t.status || 'In Progress',
      t.tanggalFU || '', t.penyelesaian || '', t.pic || '', t.assignedTo || '',
      t.validator || '', t.beisDomain || '', t.beisLevel || '',
      t.beisCategory || '', t.unit || '', t.outputDoD || '', t.outputDoD2 || '',
      t.outcome || '', t.category || '', t.subcategory || '',
      t.arahan || '', t.syncedToCalendar ? 1 : 0, 
      t.evidenceFiles ? JSON.stringify(t.evidenceFiles) : '[]',
      t.mentions ? JSON.stringify(t.mentions) : '[]',
      decoded.id || ''
    );

    res.status(201).json({ message: 'Task created', id: t.id });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/tasks/:taskId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { taskId } = req.params;
    const t = req.body;

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      tanggal: 'tanggal', deskripsiTugas: 'deskripsi_tugas', jenisTeknis: 'jenis_teknis',
      timeline: 'timeline', prioritas: 'prioritas', status: 'status',
      tanggalFU: 'tanggal_fu', penyelesaian: 'penyelesaian', pic: 'pic',
      assignedTo: 'assigned_to', validator: 'validator', beisDomain: 'beis_domain',
      beisLevel: 'beis_level', beisCategory: 'beis_category', unit: 'unit',
      outputDoD: 'output_dod', outputDoD2: 'output_dod2', outcome: 'outcome',
      category: 'category', subcategory: 'subcategory', arahan: 'arahan',
      syncedToCalendar: 'synced_to_calendar', evidenceFiles: 'evidence_files'
    };

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (t[jsKey] !== undefined) {
        fields.push(`${dbCol} = ?`);
        if (jsKey === 'syncedToCalendar') {
          values.push(t[jsKey] ? 1 : 0);
        } else if (jsKey === 'evidenceFiles') {
          values.push(JSON.stringify(t[jsKey]));
        } else {
          values.push(t[jsKey]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(taskId);

    db.prepare(`UPDATE beis_tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Task updated' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/tasks/:taskId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { taskId } = req.params;
    db.prepare('DELETE FROM beis_tasks WHERE id = ?').run(taskId);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
