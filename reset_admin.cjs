const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'bpr_ara.sqlite'));

// Check if admin exists
const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
console.log('Admin user found:', admin ? 'YES' : 'NO');

if (admin) {
  console.log('Current admin data:', { id: admin.id, username: admin.username, email: admin.email, role: admin.role });
}

// Reset password to admin123
const newHash = bcrypt.hashSync('admin123', 10);

if (admin) {
  db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, 'admin');
  console.log('Admin password updated to: admin123');
} else {
  // Insert admin if not exists
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, name, role, roleTier, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr-admin-01', 'admin', 'admin@bprara.co.id', newHash, 'Administrator', 'Super Admin', 'Super Admin', 'PMO');
  console.log('Admin user CREATED with password: admin123');
}

// Verify
const verify = bcrypt.compareSync('admin123', newHash);
console.log('Password verification:', verify);

db.close();
