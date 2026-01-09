# Commands Reference

Complete reference of all commands used in Tarsight development and deployment.

## Frontend Commands

Working directory: `tarsight-dashboard/`

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Type Checking
npx tsc --noEmit         # Full type check
npx tsc --noEmit --watch # Type check in watch mode

# Database Client
npm run db:types         # Generate TypeScript types from Supabase
```

## Backend Commands

Working directory: `supabase_version/`

```bash
# Test Execution
.venv/bin/python run.py              # Interactive execution mode
.venv/bin/python run.py --all        # Execute all test modules
.venv/bin/python run.py --module MODULE_NAME  # Execute specific module

# Virtual Environment
python3 -m venv .venv    # Create virtual environment
source .venv/bin/activate # Activate venv
pip install -r requirements.txt  # Install dependencies
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d frontend
docker compose up -d backend

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend

# Stop services
docker compose down

# Restart service
docker compose restart frontend
```

## Database Commands (Supabase)

```bash
# List migrations
npx supabase migration list

# Apply migration
npx supabase db push

# Generate types
npx supabase gen types typescript --local > lib/types/database.ts

# Link to project
npx supabase link --project-ref YOUR_PROJECT_ID
```

## Git Workflow

```bash
# Standard commit
git add .
git commit -m "feat: description"

# Skip type checking in CI
git commit -m "feat: description [no-lint]"

# Push to deploy
git push origin master  # Triggers GitHub Actions
```

## Utility Scripts

Location: `scripts/`

```bash
# Clean old test reports
./scripts/cleanup_reports.sh --keep-days 7

# Production update (manual)
sudo bash scripts/update-production.sh

# Skip type checking during update
sudo bash scripts/update-production.sh --no-lint

# Health check
bash scripts/health-check.sh
bash scripts/health-check.sh --verbose
```

## API Test Execution

```bash
# Execute via API
curl -X POST http://localhost:3000/api/test/execute \
  -H "Content-Type: application/json" \
  -d '{
    "test_case_ids": ["uuid1", "uuid2"],
    "mode": "full"
  }'

# Preview execution
curl -X POST http://localhost:3000/api/test/preview \
  -H "Content-Type: application/json" \
  -d '{
    "case_ids": ["API001", "API002"]
  }'
```

## Troubleshooting Commands

```bash
# Check for bash usage (should be sh)
grep -r "/bin/bash" tarsight-dashboard/ --include="*.ts" --include="*.tsx"

# Verify Docker shell
docker compose exec frontend which /bin/sh

# Check Python version
docker compose exec frontend python3 --version

# Port conflict check
lsof -i :3000
lsof -i :3000
```
