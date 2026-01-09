# Architecture Documentation

## Project Overview

**Tarsight** is a cloud-based API testing and monitoring platform with three-tier architecture:
- **Frontend**: Next.js 16 dashboard (TypeScript, Tailwind CSS, shadcn/ui)
- **Backend**: Python test execution engine with pytest and Supabase integration
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

## Directory Structure

```
Tarsight/
├── frontend/              # Next.js 16 Frontend
│   ├── app/                # App Router pages & API routes
│   ├── components/         # React components
│   ├── lib/                # Utilities & types
│   │   ├── types/          # TypeScript definitions
│   │   ├── cache/          # Query result caching
│   │   ├── supabase/       # Supabase clients
│   │   └── test-execution-queue.ts
│   └── public/             # Static assets
├── backend/               # Python Backend
│   ├── run.py              # Main test execution entry point
│   ├── utils/              # Utilities & clients
│   │   ├── supabase_client.py
│   │   ├── test_tarsight.py
│   │   ├── env_config.py
│   │   └── test_execution_recorder.py
│   ├── testcases/          # Test implementations
│   └── .venv/              # Python virtual env
├── docker-compose.yml      # Container orchestration
├── scripts/               # Utility scripts
└── docs/                  # This documentation
```

## Key Components

### Frontend Components

| Component | Description |
|-----------|-------------|
| `app/api/test/execute` | Unified test execution API endpoint |
| `app/api/test/preview` | Test execution preview with caching |
| `app/api/queue/*` | Queue management endpoints |
| `lib/test-execution-queue.ts` | Queue-based test execution manager |
| `components/analytics/*` | Analytics charts & statistics |
| `components/test-case-*.tsx` | Test case CRUD components |
| `components/execution-*.tsx` | Execution history components |

### Backend Components

| Component | Description |
|-----------|-------------|
| `run.py` | Main test execution entry point |
| `utils/supabase_client.py` | Database operations client |
| `utils/test_tarsight.py` | Pytest with custom recorder |
| `utils/env_config.py` | Environment configuration manager |
| `utils/test_execution_recorder.py` | Test result recorder |

### Database Schema (Supabase)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `projects` | Projects | id, name, base_url |
| `modules` | Test modules | id, project_id, name |
| `test_cases` | Test cases | id, module_id, case_id, test_name, method, url, is_active |
| `test_executions` | Test executions | id, project_id, execution_name, status, total_tests |
| `test_results` | Test results | id, execution_id, test_case_id, status, duration, error_message |

**Notes**:
- All tables use UUIDs for primary keys
- JSONB columns for flexible data storage (headers, request_body, variables)
- Row Level Security (RLS) enabled on all tables
