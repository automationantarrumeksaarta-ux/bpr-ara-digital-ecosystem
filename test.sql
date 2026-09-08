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
  synced_to_calendar INTEGER DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
