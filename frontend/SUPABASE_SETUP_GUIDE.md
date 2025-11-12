# Supabase Setup Guide

Complete guide to set up Supabase for the CICI application.

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - **Name**: CICI
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Wait ~2 minutes for project creation

## 2. Get Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Starts with `eyJ...`

3. Create `.env` in the **project root** directory:
```bash
# From project root
cp frontend/.env.example .env
```

Then edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**Note:** The `.env` file should be in the project root (not in `frontend/`)

## 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. For development, optionally disable email confirmation:
   - Go to **Authentication** → **Settings**
   - Find "Enable email confirmations"
   - Toggle OFF (you can enable later for production)

## 4. Set Up Database Tables

Go to **SQL Editor** and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  UNIQUE(user_id, name)
);

-- Create project_files table
CREATE TABLE project_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Create issues table
CREATE TABLE issues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  mode TEXT NOT NULL DEFAULT 'basic',
  expected_output TEXT,
  selected_files TEXT[],
  original_code TEXT,
  fixed_code TEXT,
  reasoning TEXT,
  runtime_output TEXT,
  exit_code INT,
  iterations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_user_id ON issues(user_id);

-- Disable RLS for development
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
```

## 5. Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Configure:
   - **Name**: `project-files`
   - **Public bucket**: OFF (keep private)
4. Click **Create Bucket**

## 6. Verify Setup

Run this SQL to verify tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'projects', 'project_files', 'issues')
ORDER BY table_name;
```

You should see all 4 tables.

## Troubleshooting

### Can't sign up
- Check that email provider is enabled
- Check browser console for errors
- Verify Supabase credentials in `.env`

### "Failed to load projects"
- Check that all tables exist
- Verify RLS is disabled on all tables
- Check browser console for specific errors

### Storage upload fails
- Verify `project-files` bucket exists
- Check that bucket is private (not public)

## Production Considerations

For production deployments:

1. **Enable RLS**: Re-enable Row Level Security and set up proper policies
2. **Email Confirmation**: Enable email verification for security
3. **API Keys**: Use environment-specific API keys
4. **CORS**: Configure allowed origins in Supabase settings
5. **Backups**: Enable automatic backups in Supabase dashboard
