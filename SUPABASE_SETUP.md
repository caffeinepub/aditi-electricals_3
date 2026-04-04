# Supabase Setup for Aditi Electricals

## Step 1: Create a Supabase project
1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project name: `aditi-electricals`
4. Choose a database password (save it)
5. Select a region close to you
6. Click "Create new project"

## Step 2: Run the SQL schema

Go to your Supabase project → SQL Editor → New query, then paste and run this:

```sql
-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  monthly_salary INTEGER DEFAULT 0,
  pin TEXT NOT NULL DEFAULT '1234',
  role TEXT NOT NULL DEFAULT 'worker',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  worker_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  marked_by TEXT DEFAULT 'worker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  date TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  worker_id TEXT DEFAULT '',
  note_type TEXT NOT NULL DEFAULT 'work',
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create salary_records table
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salary_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  worker_id TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  monthly_salary INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  cut_days INTEGER DEFAULT 0,
  advance_amount INTEGER DEFAULT 0,
  carry_forward INTEGER DEFAULT 0,
  company_holidays INTEGER DEFAULT 0,
  manual_override BOOLEAN DEFAULT FALSE,
  override_net_pay INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, month, year)
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create confirmations table
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  confirmation_id TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  worker_id TEXT NOT NULL,
  date TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  UNIQUE(worker_id, date)
);

-- Insert default users
-- Owner: OWNER1 / PIN: 1234
INSERT INTO workers (worker_id, name, pin, role, active, monthly_salary)
VALUES ('OWNER1', 'Owner', '1234', 'owner', TRUE, 0)
ON CONFLICT (worker_id) DO UPDATE SET pin = '1234', role = 'owner', active = TRUE;

-- Worker: W001 / PIN: 1234
INSERT INTO workers (worker_id, name, pin, role, active, monthly_salary)
VALUES ('W001', 'Worker One', '1234', 'worker', TRUE, 20000)
ON CONFLICT (worker_id) DO UPDATE SET pin = '1234', active = TRUE;
```

## Step 3: Disable Row Level Security (for simplicity)

Run this in SQL Editor:

```sql
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations DISABLE ROW LEVEL SECURITY;
```

## Step 4: Get your API keys
1. In Supabase → Settings → API
2. Copy:
   - **Project URL** (looks like: https://xxxx.supabase.co)
   - **anon/public key** (long JWT string)

## Step 5: Add environment variables

### For Netlify deployment:
1. Go to Netlify → Your site → Site settings → Environment variables
2. Add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon/public key
3. Redeploy the site

### For local development:
Create a `.env` file in `src/frontend/`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Default Login Credentials (after setup)

| Role   | Employee ID | PIN  |
|--------|------------|------|
| Owner  | OWNER1     | 1234 |
| Worker | W001       | 1234 |

## Troubleshooting

- **"Supabase is not configured"** → Add env variables and redeploy
- **"Database tables not found"** → Run the SQL setup script above
- **"Employee ID not found"** → Run the INSERT statements to create default users
- **"Incorrect PIN"** → Use PIN `1234` for both default accounts

## New Tables: Advance & Carry Forward Entries

Run this SQL in your Supabase SQL Editor to add support for multiple advance and carry-forward entries per worker per month:

```sql
-- Advance entries (multiple per worker per month)
CREATE TABLE IF NOT EXISTS advance_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(worker_id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL,
  entry_time TEXT NOT NULL DEFAULT '00:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carry forward entries (multiple per worker per month)
CREATE TABLE IF NOT EXISTS carry_forward_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(worker_id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL,
  entry_time TEXT NOT NULL DEFAULT '00:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for new tables
ALTER TABLE advance_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE carry_forward_entries DISABLE ROW LEVEL SECURITY;
```

## New Table: Evening Locations

Run this SQL in your Supabase SQL Editor to enable worker evening (4:00 PM) location tracking:

```sql
-- Evening locations: captured once at 4:00 PM per worker per day
CREATE TABLE IF NOT EXISTS evening_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL REFERENCES workers(worker_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

-- Disable RLS for this table
ALTER TABLE evening_locations DISABLE ROW LEVEL SECURITY;
```
