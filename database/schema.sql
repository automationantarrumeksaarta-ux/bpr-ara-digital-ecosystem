-- ==============================================================================
-- BPR ARA Digital Ecosystem - Database Schema (PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS & AUTHENTICATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    role_tier VARCHAR(20) NOT NULL,
    unit VARCHAR(50),
    assigned_member_tab VARCHAR(50),
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TASK MANAGEMENT & BEIS (FLOWTASKS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    pic_id UUID REFERENCES users(id),
    pic_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Planned',
    priority VARCHAR(10) NOT NULL DEFAULT 'P1',
    timeline VARCHAR(50),
    jenis_teknis VARCHAR(100),
    beis_domain VARCHAR(50),
    beis_category VARCHAR(100),
    beis_level VARCHAR(20),
    validator_names TEXT, -- Comma separated names of validators
    arahan_atasan TEXT,
    evidence_link TEXT,
    evidence_id VARCHAR(100),
    penyelesaian TEXT,
    deadline DATE,
    unit_operasional VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CUSTOMERS & LOANS (CORE BANKING MOCK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    ktp VARCHAR(20) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    risk_level VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    amount_requested DECIMAL(15,2) NOT NULL,
    purpose TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Analysis',
    ao_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(100),
    limit_amount DECIMAL(15,2) NOT NULL,
    outstanding DECIMAL(15,2) NOT NULL,
    tunggakan_pokok DECIMAL(15,2) DEFAULT 0,
    tunggakan_bunga DECIMAL(15,2) DEFAULT 0,
    collectibility VARCHAR(20),
    officer_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_and_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(100),
    account_type VARCHAR(20) NOT NULL, -- 'TABUNGAN' or 'DEPOSITO'
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2),
    officer_name VARCHAR(100),
    open_date DATE,
    maturity_date DATE, -- Nullable for savings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DASHBOARD METRICS & EWS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS macro_financials (
    id SERIAL PRIMARY KEY,
    period_date DATE UNIQUE NOT NULL,
    total_assets DECIMAL(20,2),
    total_liabilities DECIMAL(20,2),
    current_year_profit DECIMAL(20,2),
    total_outstanding DECIMAL(20,2),
    total_tabungan DECIMAL(20,2),
    total_deposito DECIMAL(20,2),
    npl_percentage DECIMAL(5,2),
    repayment_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ao_performance (
    id SERIAL PRIMARY KEY,
    ao_name VARCHAR(100) UNIQUE NOT NULL,
    target_amount DECIMAL(20,2) DEFAULT 500000000,
    achieved_amount DECIMAL(20,2) DEFAULT 0,
    period_month VARCHAR(10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ews_alerts (
    id SERIAL PRIMARY KEY,
    borrower_name VARCHAR(100),
    ao_name VARCHAR(100),
    kolektibilitas VARCHAR(20),
    outstanding_amount DECIMAL(15,2),
    risk_level VARCHAR(20),
    status VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- TRIGGERS FOR UPDATED_AT (PostgreSQL Example)
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_loans_modtime BEFORE UPDATE ON loans FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
