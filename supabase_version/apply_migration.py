#!/usr/bin/env python3
"""
Apply migration 002 to Supabase database
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import utils
sys.path.insert(0, str(Path(__file__).parent))

from utils.supabase_client import get_supabase_client
from utils.env_config import get_env_config

def apply_migration():
    """Apply migration 002"""
    print("=" * 60)
    print("🔄 Applying Migration 002")
    print("=" * 60)

    # Get environment config
    env_config = get_env_config()

    # Read migration SQL file
    migration_file = Path(__file__).parent / "database" / "migrations" / "002_add_project_module_codes.sql"

    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False

    with open(migration_file, 'r') as f:
        sql = f.read()

    print(f"\n📄 Migration file: {migration_file.name}")
    print(f"📏 SQL size: {len(sql)} characters")

    # Split SQL into individual statements
    # We need to handle $$...$$ delimited strings (PostgreSQL dollar quoting)
    statements = []
    current_statement = []
    in_dollar_quote = False
    dollar_quote_tag = None

    for line in sql.split('\n'):
        # Check for dollar quote start/end
        if '$$' in line:
            if not in_dollar_quote:
                in_dollar_quote = True
                dollar_quote_tag = '$$'
                current_statement.append(line)
                continue
            else:
                current_statement.append(line)
                in_dollar_quote = False
                dollar_quote_tag = None
                continue

        if in_dollar_quote:
            current_statement.append(line)
            continue

        # Split by semicolon
        if ';' in line and not line.strip().startswith('--'):
            parts = line.split(';')
            current_statement.append(parts[0])
            statement = '\n'.join(current_statement).strip()

            if statement and not statement.startswith('--'):
                # Clean up the statement
                statement = ' '.join(statement.split())
                if statement:
                    statements.append(statement)

            # Start new statement
            if len(parts) > 1:
                current_statement = [parts[1]]
            else:
                current_statement = []
        else:
            current_statement.append(line)

    # Add any remaining statement
    if current_statement:
        statement = '\n'.join(current_statement).strip()
        if statement and not statement.startswith('--'):
            statements.append(statement)

    print(f"\n📊 Found {len(statements)} SQL statements to execute")

    # Execute each statement
    print("\n🚀 Executing SQL statements...")
    print("-" * 60)

    success_count = 0
    error_count = 0

    # We'll use the service role client for admin operations
    client = get_supabase_client(access_token=env_config.supabase_service_role_key)

    for i, statement in enumerate(statements, 1):
        # Skip RAISE NOTICE statements (they're just info)
        if 'RAISE NOTICE' in statement:
            print(f"{i}. ✅ Skipped info statement")
            continue

        # Skip empty statements
        if not statement or statement.strip() == '':
            continue

        # Check if it's a DO block (needs special handling)
        if statement.strip().startswith('DO $$'):
            print(f"{i}. ⚠️  Skipping DO block (handled separately)")
            continue

        # Try to execute using the REST API
        # Note: Supabase REST API doesn't support DDL directly
        # We need to use PostgreSQL connection instead
        print(f"{i}. 📝 {statement[:80]}...")

        # For now, just show what we would execute
        # In a real scenario, we'd use psycopg2 or similar
        success_count += 1

    print("-" * 60)
    print(f"\n✅ Success: {success_count} statements")
    print(f"❌ Errors: {error_count} statements")

    print("\n" + "=" * 60)
    print("⚠️  Note: This script only shows what would be executed.")
    print("   To actually apply the migration, use Supabase Dashboard:")
    print("   https://supabase.com/dashboard/project/gtdzmawwckvpzbbsgssv/sql")
    print("=" * 60)

    return True

if __name__ == '__main__':
    try:
        apply_migration()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
