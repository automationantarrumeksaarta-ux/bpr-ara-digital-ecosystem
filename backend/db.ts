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

const db = new Database(path.join(dbDir, 'bpr_ara.sqlite'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS macro_financials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  `);
  console.log('Database initialized successfully.');
}

export default db;
