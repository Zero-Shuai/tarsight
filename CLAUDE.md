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

## 🎯 Component Usage Guide

### ⚠️ Test Case Forms - READ THIS FIRST!

**DO NOT modify without checking:**
1. Read `DEPRECATED.md` for deprecated components
2. Verify which component is actually being used
3. Use grep to find usage before changing

```bash
# ALWAYS run this before modifying form components:
grep -r "TestCaseForm" app/ components/
grep -r "import.*from.*test-case" components/
```

### Active Components

| Component | Purpose | Location | Status |
|-----------|---------|----------|--------|
| `TestCaseFormDrawer` | Main form for /test-cases page | `components/test-case-form-drawer.tsx` | ✅ **PRIMARY** - Use this! |
| `TestCaseForm` | Modal/popup edit form | `components/test-case-form.tsx` | ⚠️ Secondary - Only for test-case-actions.tsx |
| `TestCaseWorkbench` | Main test case list page | `components/test-case-workbench.tsx` | ✅ Active |

### Deprecated Components

| Component | Why Deprecated | Replacement |
|-----------|----------------|-------------|
| `new-test-case-form.tsx` | Replaced by drawer | `TestCaseFormDrawer` |
| `/test-cases/new/page.tsx` | UX is worse than drawer | `/test-cases` + drawer button |
| See `DEPRECATED.md` for full list | | |

### Component Call Tree

```
app/(auth)/test-cases/page.tsx
  └─ TestCasePageClient
      └─ TestCaseWorkbench  ← Uses TestCaseFormDrawer!
          └─ TestCaseFormDrawer  ← ✅ ADD NEW FEATURES HERE
              └─ AssertionBuilder  ← Assertion system

components/test-case-actions.tsx
  └─ TestCaseForm  ← ⚠️ Different component, modal style
      └─ AssertionBuilder  ← Also has assertions
```

### Quick Reference: Which Form to Use?

| Scenario | Use This Component |
|----------|-------------------|
| Main page edit/create | `TestCaseFormDrawer` ✅ |
| Inline edit button | `TestCaseForm` (modal) |
| New page creation | ❌ DEPRECATED - Use drawer instead |

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
| Component changes not visible | 1. Check DEPRECATED.md, 2. Verify correct component, 3. Clear .next cache |

## 🔍 Debugging Workflow

### When user reports feature not visible:

```bash
# Step 1: Find ALL related files
find . -name "*form*.tsx" -type f

# Step 2: Check which is ACTUALLY used
grep -r "import.*Form" app/ components/

# Step 3: Trace the call chain
grep -r "TestCaseForm" app/ --include="*.tsx"

# Step 4: Verify you're modifying the RIGHT file
# Don't assume based on filename!
```

### Common Pitfalls:

❌ **Assuming** `test-case-form.tsx` is the main form
✅ **Check** which component is imported by the page

❌ **Modifying** without verifying usage
✅ **Run grep** to find all references first

❌ **Guessing** which file to change
✅ **Trace** from page → component → sub-component

## Documentation Index

| File | Content |
|------|---------|
| `DEPRECATED.md` | ⚠️ **READ FIRST** - Deprecated components and why |
| `docs/architecture.md` | Architecture, components, schema |
| `docs/commands.md` | All npm, Docker, git commands |
| `docs/configuration.md` | Environment setup, Supabase config |
| `docs/coding-standards.md` | TypeScript, React, shadcn/ui patterns |
| `docs/troubleshooting.md` | Common issues and solutions |
| `docs/deployment.md` | Docker, GitHub Actions, production |
| `docs/api.md` | API endpoints and interfaces |

## Key Files

### Frontend Core
- `lib/types/database.ts` - Type definitions
- `lib/test-execution-queue.ts` - Queue management
- `app/api/test/execute/route.ts` - Test execution API

### Test Case Components
- `components/test-case-form-drawer.tsx` - ✅ PRIMARY form component
- `components/assertion-builder.tsx` - Assertion configuration UI
- `components/test-case-workbench.tsx` - Main list view

### Backend
- `supabase_version/run.py` - Python entry point
- `supabase_version/database/migrations/` - Database schema changes

## 🚨 Recent Lessons Learned

### Lesson 1: Component Confusion (2026-01-09)

**Problem**: Modified `test-case-form.tsx` for 2+ hours, feature never appeared.

**Root Cause**:
- User's page uses `TestCaseFormDrawer`, not `TestCaseForm`
- Assumed filename indicated importance
- Didn't verify actual component usage

**Solution**:
1. Always grep for component usage first
2. Trace from page → component → sub-component
3. Never assume based on filename

**Commands to prevent this**:
```bash
# Find what the page actually imports
grep -r "import.*TestCase" app/(auth)/test-cases/

# Find all usages
grep -r "TestCaseForm" components/

# Trace the component tree
# page.tsx → imports ComponentA → imports ComponentB
```

### Lesson 2: Deprecated Code Confusion (2026-01-09)

**Problem**: Maintained deprecated components without knowing.

**Root Cause**:
- No deprecation markings
- No documentation of废弃组件
- No migration guide

**Solution**:
1. Created `DEPRECATED.md`
2. Added `@deprecated` comments to files
3. Documented component usage in this file

### Lesson 3: Cache Issues

**Problem**: Changes not visible after modifying code.

**Solution**:
```bash
# Complete cache clear
rm -rf .next
rm -rf node_modules/.cache

# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Restart dev server
npm run dev

# Browser hard refresh
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

## Best Practices

### Before Modifying Any Component:

1. ✅ **Check DEPRECATED.md** - Is it deprecated?
2. ✅ **Find Usage** - `grep -r "ComponentName" app/ components/`
3. ✅ **Trace Call Chain** - Page → Parent → Child
4. ✅ **Verify Active** - Is it in the active component tree?
5. ✅ **Check Comments** - Read file header for warnings

### Adding New Features:

1. ✅ **Find the PRIMARY component** (usually Drawer/Modal pattern)
2. ✅ **Add feature there first**
3. ✅ **Check if secondary components need it too**
4. ✅ **Update DEPRECATED.md** if deprecating old code
5. ✅ **Document changes** in file headers

### Component Naming:

```typescript
// ❌ Confusing
test-case-form.tsx
test-case-form-drawer.tsx

// ✅ Clear
test-case-form-modal.tsx      // Modal/popup
test-case-form-drawer.tsx    // Side drawer
test-case-form-inline.tsx    // Inline edit

// ✅ Or functional naming
test-case-creation-drawer.tsx
test-case-editing-modal.tsx
test-case-bulk-edit-form.tsx
```

---

Last Updated: 2026-01-09

**Quick Checklist Before Starting Work:**
- [ ] Read DEPRECATED.md
- [ ] Verified component usage with grep
- [ ] Traced component call tree
- [ ] Checked file header comments
- [ ] Confirmed not modifying deprecated code
