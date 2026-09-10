import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const dbDir = path.join(_dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(path.join(dbDir, 'bpr_ara.sqlite'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      roleTier TEXT,
      unit TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      email TEXT PRIMARY KEY,
      otp_code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT PRIMARY KEY,
      permissions TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_routes (
      user_id TEXT PRIMARY KEY,
      supervisor_id TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Seed initial admin user if table is empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // bcrypt hash of 'admin123'
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, name, role, roleTier, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-admin-01',
      'admin',
      'admin@bprara.co.id',
      '$2b$10$FOqd0BtlRvKhi2Yrn.3cnu0wUJrSzc6wmkMOreYn.7FCMFfPSoxoC',
      'Administrator',
      'Super Admin',
      'Super Admin',
      'PMO'
    );
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS macro_financials (
      period_date TEXT UNIQUE,
      total_assets REAL,
      total_liabilities REAL,
      current_year_profit REAL,
      total_outstanding REAL,
      total_tabungan REAL,
      total_deposito REAL,
      npl_percentage REAL,
      repayment_rate REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ews_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_name TEXT,
      ao_name TEXT,
      kolektibilitas TEXT,
      outstanding_amount REAL,
      risk_level TEXT,
      status TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ao_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ao_name TEXT UNIQUE,
      target REAL DEFAULT 500000000,
      achieved REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS funding_breakdowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_date TEXT,
      account_type TEXT,
      amount REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period_date, account_type)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE,
      customer_name TEXT,
      address TEXT,
      limit_amount REAL,
      outstanding REAL,
      tunggakan_pokok REAL,
      tunggakan_bunga REAL,
      collectibility TEXT,
      officer_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE,
      customer_name TEXT,
      interest_rate REAL,
      balance REAL,
      officer_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE,
      customer_name TEXT,
      term TEXT,
      start_date TEXT,
      maturity_date TEXT,
      interest_rate REAL,
      balance REAL,
      officer_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS funding_growth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_number TEXT UNIQUE,
      account_type TEXT, -- 'TABUNGAN' or 'DEPOSITO'
      customer_name TEXT,
      open_date TEXT,
      balance REAL,
      officer_name TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS beis_tasks (
      id TEXT PRIMARY KEY,
      tanggal TEXT,
      deskripsi_tugas TEXT,
      jenis_teknis TEXT,
      timeline TEXT,
      prioritas TEXT,
      status TEXT DEFAULT 'In Progress',
      tanggal_fu TEXT,
      penyelesaian TEXT,
      pic TEXT,
      assigned_to TEXT,
      validator TEXT,
      beis_domain TEXT,
      beis_level TEXT,
      beis_category TEXT,
      unit TEXT,
      output_dod TEXT,
      output_dod2 TEXT,
      outcome TEXT,
      category TEXT,
      subcategory TEXT,
      arahan TEXT,
      arahan_atasan TEXT,
      arahan_atasan_utama TEXT,
      synced_to_calendar INTEGER DEFAULT 0,
      evidence_files TEXT DEFAULT '[]',
      mentions TEXT DEFAULT '[]',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      module TEXT,
      priority TEXT DEFAULT 'NORMAL',
      read INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS attendances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      clock_in_time TEXT,
      clock_out_time TEXT,
      clock_in_lat REAL,
      clock_in_lng REAL,
      clock_out_lat REAL,
      clock_out_lng REAL,
      clock_in_location TEXT,
      clock_out_location TEXT,
      status TEXT DEFAULT 'Hadir',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );
  `);

  // Add columns if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(beis_tasks)").all() as any[];
    const hasEvidenceFiles = tableInfo.some(col => col.name === 'evidence_files');
    if (!hasEvidenceFiles) {
      db.exec("ALTER TABLE beis_tasks ADD COLUMN evidence_files TEXT DEFAULT '[]'");
      console.log('Added evidence_files column to beis_tasks table.');
    }
    const hasMentions = tableInfo.some(col => col.name === 'mentions');
    if (!hasMentions) {
      db.exec("ALTER TABLE beis_tasks ADD COLUMN mentions TEXT DEFAULT '[]'");
      console.log('Added mentions column to beis_tasks table.');
    }
    const hasCreatedBy = tableInfo.some(col => col.name === 'created_by');
    if (!hasCreatedBy) {
      db.exec("ALTER TABLE beis_tasks ADD COLUMN created_by TEXT");
      console.log('Added created_by column to beis_tasks table.');
    }
    const hasArahanAtasan = tableInfo.some(col => col.name === 'arahan_atasan');
    if (!hasArahanAtasan) {
      db.exec("ALTER TABLE beis_tasks ADD COLUMN arahan_atasan TEXT");
      console.log('Added arahan_atasan column to beis_tasks table.');
    }
    const hasArahanAtasanUtama = tableInfo.some(col => col.name === 'arahan_atasan_utama');
    if (!hasArahanAtasanUtama) {
      db.exec("ALTER TABLE beis_tasks ADD COLUMN arahan_atasan_utama TEXT");
      console.log('Added arahan_atasan_utama column to beis_tasks table.');
    }
  } catch (e) {
    console.error('Error adding columns:', e);
  }

  // Kolom tambahan pada `loans` untuk Dashboard Heat Map & Risiko Pembiayaan.
  // Diisi oleh parser nominatif kredit (backend/parser.ts).
  try {
    const loanCols = (db.prepare('PRAGMA table_info(loans)').all() as any[]).map(c => c.name);
    const tambahan: Record<string, string> = {
      kabupaten: 'TEXT',
      kecamatan: 'TEXT',
      sektor: 'TEXT',
      tujuan: 'TEXT',
      jumlah_tagihan: 'REAL DEFAULT 0',
      jumlah_angsuran: 'REAL DEFAULT 0',
      period_date: 'TEXT',
    };
    for (const [nama, tipe] of Object.entries(tambahan)) {
      if (!loanCols.includes(nama)) {
        db.exec(`ALTER TABLE loans ADD COLUMN ${nama} ${tipe}`);
        console.log(`Added ${nama} column to loans table.`);
      }
    }
    db.exec('CREATE INDEX IF NOT EXISTS idx_loans_kabupaten ON loans(kabupaten)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_loans_collectibility ON loans(collectibility)');
  } catch (e) {
    console.error('Error adding loans columns:', e);
  }

  console.log('Database initialized successfully.');
}

export default db;
