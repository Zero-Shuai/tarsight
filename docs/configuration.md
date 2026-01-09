# Configuration Guide

Complete guide for configuring Tarsight in different environments.

## Environment Variables Overview

| Variable | Frontend | Backend | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | - | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | - | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Admin operations key |
| `NEXT_PUBLIC_PROJECT_ID` | ✅ | - | Project UUID |
| `PROJECT_ROOT` | ✅ | - | Absolute path to Python backend |
| `PYTHON_PATH` | ✅ | - | Absolute path to Python executable |
| `SUPABASE_URL` | - | ✅ | Supabase URL for backend |
| `SUPABASE_ANON_KEY` | - | ✅ | Anon key for backend |
| `SUPABASE_SERVICE_ROLE_KEY` | - | ✅ | Service role key for backend |
| `BASE_URL` | - | ✅ | Target API base URL |
| `API_TOKEN` | - | ✅ | Authorization token |
| `DATA_SOURCE` | - | ✅ | Data source type (supabase) |
| `TARGET_PROJECT` | - | ✅ | Target project UUID |

## Frontend Configuration

File: `tarsight-dashboard/.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Project Configuration
NEXT_PUBLIC_PROJECT_ID=your-project-uuid-here

# Backend Execution Paths (ABSOLUTE PATHS REQUIRED)
PROJECT_ROOT=/absolute/path/to/Tarsight/supabase_version
PYTHON_PATH=/absolute/path/to/.venv/bin/python

# Optional: Override API base URL
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Critical: Absolute Paths

The `PROJECT_ROOT` and `PYTHON_PATH` MUST be absolute paths:

```bash
# ✅ Correct
PROJECT_ROOT=/opt/tarsight/supabase_version
PYTHON_PATH=/opt/tarsight/.venv/bin/python

# ❌ Wrong
PROJECT_ROOT=./supabase_version
PYTHON_PATH=.venv/bin/python
```

## Backend Configuration

File: `supabase_version/.env`

```bash
# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Target API Configuration
BASE_URL=https://api.example.com
API_TOKEN=Bearer your-api-token-here

# Data Source Configuration
DATA_SOURCE=supabase
TARGET_PROJECT=your-project-uuid-here
```

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Configure:
   - Name: `tarsight`
   - Region: Choose nearest to users
   - Pricing: Free tier sufficient for development

### 2. Get Credentials

Go to Project Settings → API:

```bash
# Copy these values
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Keep secret!
```

### 3. Enable Row Level Security (RLS)

For each table, run:

```sql
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS Policies

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own test_cases"
ON test_cases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test_cases"
ON test_cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test_cases"
ON test_cases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own test_cases"
ON test_cases FOR DELETE
USING (auth.uid() = user_id);
```

## Docker Configuration

File: `docker-compose.yml`

```yaml
services:
  frontend:
    build:
      context: ./tarsight-dashboard
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PROJECT_ROOT=/app/supabase_version
      - PYTHON_PATH=/usr/bin/python3
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_PROJECT_ID=${PROJECT_ID}
    volumes:
      - ./supabase_version:/app/supabase_version
```

## Production Configuration

### Environment File Setup

```bash
# On production server
cd /opt/tarsight

# Create production env file
cat > .env.production << EOF
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
PROJECT_ID=prod-project-uuid
EOF

# Secure the file
chmod 600 .env.production
```

### GitHub Actions Secrets

For automated deployment, configure these secrets in GitHub:

| Secret Name | Description |
|-------------|-------------|
| `PRODUCTION_HOST` | Server hostname or IP |
| `PRODUCTION_USER` | SSH username |
| `PRODUCTION_SSH_KEY` | Private SSH key |
| `SUPABASE_URL` | Supabase URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `PROJECT_ID` | Project UUID |

## Configuration Validation

```bash
# Test frontend configuration
cd tarsight-dashboard
npm run dev

# Check environment variables are loaded
curl http://localhost:3000/api/health

# Test backend configuration
cd supabase_version
.venv/bin/python run.py --help

# Test Docker configuration
docker compose config
```
