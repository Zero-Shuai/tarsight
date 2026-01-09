# CLAUDE.md

Quick reference for Tarsight development. Detailed docs in `/docs/`.

## Project

Tarsight: API testing platform (Next.js 16 + Supabase + Python pytest)

```
tarsight-dashboard/    # Frontend (Next.js)
supabase_version/       # Backend (Python)
docs/                   # Full documentation
```

## Critical Rules

1. **Alpine Linux**: Use `/bin/sh` NOT `/bin/bash` in spawn commands
2. **TypeScript**: Strict mode - explicit types only, no `any`
3. **Supabase**: JOIN queries return arrays - use `data[0]?.modules?.[0]?.name`
4. **Next.js**: Server/client components need different names - use aliases
5. **Security**: Never commit env vars, use service role key for admin ops

## Common Commands

```bash
# Frontend
cd tarsight-dashboard && npm run dev
npx tsc --noEmit  # Type check

# Backend
cd supabase_version && .venv/bin/python run.py

# Docker
docker compose up -d --build
docker compose logs -f frontend

# Production
sudo bash scripts/update-production.sh
git commit -m "msg [no-lint]"  # Skip type check
```

## Quick Fixes

| Issue | Fix |
|-------|-----|
| `/bin/bash: not found` | Change to `/bin/sh` in spawn |
| Type error on nested query | Access as array: `data[0]?.relation?.[0]` |
| Infinite recursion | Use alias: `import { X as XClient }` |
| Port 3000 taken | `lsof -i :3000 && kill -9 <PID>` |
| Container exits | Check env vars: `docker compose exec frontend env` |

## Documentation Index

| File | Content |
|------|---------|
| `docs/architecture.md` | Architecture, components, schema |
| `docs/commands.md` | All npm, Docker, git commands |
| `docs/configuration.md` | Environment setup, Supabase config |
| `docs/coding-standards.md` | TypeScript, React, shadcn/ui patterns |
| `docs/troubleshooting.md` | Common issues and solutions |
| `docs/deployment.md` | Docker, GitHub Actions, production |
| `docs/api.md` | API endpoints and interfaces |

## Key Files

- `lib/types/database.ts` - Type definitions
- `lib/test-execution-queue.ts` - Queue management
- `app/api/test/execute/route.ts` - Test execution API
- `supabase_version/run.py` - Python entry point

---

Last Updated: 2026-01-09
