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
      INSERT INTO users (id, username, email, password_hash, name, role, roleTier, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

    res.status(201).json({ message: 'User registered successfully' });
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

export default router;
