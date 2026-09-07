import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ara_secret_key_2026';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role, roleTier, unit } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
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

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
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
