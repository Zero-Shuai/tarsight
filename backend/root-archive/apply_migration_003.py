#!/usr/bin/env python3
"""
Preview migration 003 SQL statements before applying them manually.
"""
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Add backend root to path so archived scripts can reuse shared utils.
sys.path.insert(0, str(BACKEND_ROOT))


def resolve_migration_file() -> Path:
    """Resolve migration 003 across legacy and current layouts."""
    candidate_paths = [
        BACKEND_ROOT / "database" / "migrations" / "003_migrate_to_new_id_format.sql",
        BACKEND_ROOT.parent / "supabase" / "migrations" / "003_migrate_to_new_id_format.sql",
    ]

    for candidate in candidate_paths:
        if candidate.exists():
            return candidate

    return candidate_paths[0]


def split_sql_statements(sql_text):
    """Split SQL text into statements while respecting dollar-quoted blocks."""
    statements = []
    current_statement = []
    in_dollar_quote = False

    for line in sql_text.split("\n"):
        if "$$" in line:
            current_statement.append(line)
            in_dollar_quote = not in_dollar_quote
            continue

        if in_dollar_quote:
            current_statement.append(line)
            continue

        if ";" in line and not line.strip().startswith("--"):
            parts = line.split(";")
            current_statement.append(parts[0])
            statement = "\n".join(current_statement).strip()

            if statement and not statement.startswith("--"):
                normalized = " ".join(statement.split())
                if normalized:
                    statements.append(normalized)

            current_statement = [parts[1]] if len(parts) > 1 else []
        else:
            current_statement.append(line)

    if current_statement:
        statement = "\n".join(current_statement).strip()
        if statement and not statement.startswith("--"):
            statements.append(statement)

    return statements


def apply_migration():
    """Preview migration 003."""
    print("=" * 60)
    print("🔄 Previewing Migration 003")
    print("=" * 60)

    migration_file = resolve_migration_file()
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False

    sql = migration_file.read_text(encoding="utf-8")

    print(f"\n📄 Migration file: {migration_file.name}")
    print(f"📍 Resolved path: {migration_file}")
    print(f"📏 SQL size: {len(sql)} characters")

    statements = split_sql_statements(sql)

    print(f"\n📊 Found {len(statements)} SQL statements to review")
    print("\n🚀 SQL preview...")
    print("-" * 60)

    for index, statement in enumerate(statements, 1):
        preview = statement[:120]
        suffix = "..." if len(statement) > 120 else ""
        print(f"{index}. 📝 {preview}{suffix}")

    print("-" * 60)
    print("\n✅ Preview completed")
    print("⚠️  This script does not execute SQL.")
    print("   Apply Migration 003 from the Supabase SQL editor, then run:")
    print("   cd backend && ./.venv/bin/python root-archive/verify_migration_003.py")
    print("=" * 60)

    return True


if __name__ == "__main__":
    try:
        apply_migration()
    except Exception as exc:
        print(f"\n❌ Error: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
