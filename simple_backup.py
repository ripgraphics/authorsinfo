#!/usr/bin/env python3
"""
SIMPLE DATABASE BACKUP SYSTEM
Creates backup using existing schema and current database state.
"""

import os
import subprocess
import sys
import json
import hashlib
from datetime import datetime
from pathlib import Path

class SimpleBackupSystem:
    """Simple backup system using existing schema files."""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.schemas_dir = self.project_root / "schemas"
        self.backups_dir = self.project_root / "db_backups"
        self.reports_dir = self.project_root / "reports"
        
        # Ensure directories exist
        for directory in [self.backups_dir, self.reports_dir]:
            directory.mkdir(exist_ok=True)
            
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_session = {
            "id": self.timestamp,
            "started_at": datetime.now().isoformat(),
            "operations": [],
            "statistics": {},
            "errors": [],
            "files_created": []
        }

    def log_operation(self, operation: str, status: str, details: str = ""):
        """Log backup operations."""
        self.backup_session["operations"].append({
            "operation": operation,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def create_schema_backup(self) -> Path:
        """Create backup using existing schema files."""
        print("\n📋 Creating SCHEMA backup from existing files...")
        
        # Use the current schema file
        current_schema = self.project_root / "current_schema.sql"
        
        if not current_schema.exists():
            # Try to get from schemas directory
            latest_schema = self.schemas_dir / "latest_schema.sql"
            if latest_schema.exists():
                current_schema = latest_schema
            else:
                raise FileNotFoundError("No schema file found")
        
        # Read the schema content
        with open(current_schema, 'r', encoding='utf-8') as f:
            schema_content = f.read()
        
        # Create backup file
        backup_file = self.backups_dir / f"SCHEMA_BACKUP_{self.timestamp}.sql"
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(f"""-- =====================================================
-- DATABASE SCHEMA BACKUP
-- Backup ID: {self.timestamp}
-- Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Project: AuthorsInfo Enterprise Platform
-- Source: {current_schema}
-- =====================================================

{schema_content}

-- =====================================================
-- BACKUP COMPLETED SUCCESSFULLY
-- =====================================================
""")
        
        # Statistics
        lines = len(schema_content.splitlines())
        size_kb = len(schema_content.encode('utf-8')) / 1024
        
        self.backup_session["statistics"]["schema_backup"] = {
            "file": str(backup_file),
            "source": str(current_schema),
            "lines": lines,
            "size_kb": round(size_kb, 2)
        }
        
        self.backup_session["files_created"].append(str(backup_file))
        
        print(f"   ✅ Schema backup created: {lines:,} lines, {size_kb:.1f} KB")
        print(f"   📁 File: {backup_file.name}")
        
        return backup_file

    def create_types_backup(self) -> Path:
        """Create backup of TypeScript types."""
        print("\n📝 Creating TYPES backup...")
        
        types_file = self.project_root / "types" / "database.ts"
        
        if not types_file.exists():
            raise FileNotFoundError("Types file not found")
        
        # Read the types content
        with open(types_file, 'r', encoding='utf-8') as f:
            types_content = f.read()
        
        # Create backup file
        backup_file = self.backups_dir / f"TYPES_BACKUP_{self.timestamp}.ts"
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(f"""// =====================================================
// TYPESCRIPT TYPES BACKUP
// Backup ID: {self.timestamp}
// Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Project: AuthorsInfo Enterprise Platform
// Source: {types_file}
// =====================================================

{types_content}

// =====================================================
// BACKUP COMPLETED SUCCESSFULLY
// =====================================================
""")
        
        # Statistics
        lines = len(types_content.splitlines())
        size_kb = len(types_content.encode('utf-8')) / 1024
        
        self.backup_session["statistics"]["types_backup"] = {
            "file": str(backup_file),
            "source": str(types_file),
            "lines": lines,
            "size_kb": round(size_kb, 2)
        }
        
        self.backup_session["files_created"].append(str(backup_file))
        
        print(f"   ✅ Types backup created: {lines:,} lines, {size_kb:.1f} KB")
        print(f"   📁 File: {backup_file.name}")
        
        return backup_file

    def create_migrations_backup(self) -> Path:
        """Create backup of migration files."""
        print("\n🔄 Creating MIGRATIONS backup...")
        
        migrations_dir = self.project_root / "supabase" / "migrations"
        
        if not migrations_dir.exists():
            raise FileNotFoundError("Migrations directory not found")
        
        # Collect all migration files
        migration_files = list(migrations_dir.glob("*.sql"))
        migration_files.sort()  # Sort by filename
        
        # Create combined backup
        backup_file = self.backups_dir / f"MIGRATIONS_BACKUP_{self.timestamp}.sql"
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(f"""-- =====================================================
-- MIGRATIONS BACKUP
-- Backup ID: {self.timestamp}
-- Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Project: AuthorsInfo Enterprise Platform
-- Files: {len(migration_files)} migration files
-- =====================================================

""")
            
            for migration_file in migration_files:
                f.write(f"\n-- =====================================================\n")
                f.write(f"-- MIGRATION: {migration_file.name}\n")
                f.write(f"-- =====================================================\n\n")
                
                with open(migration_file, 'r', encoding='utf-8') as mf:
                    f.write(mf.read())
                
                f.write(f"\n-- End of {migration_file.name}\n\n")
        
        # Statistics
        total_lines = 0
        for migration_file in migration_files:
            with open(migration_file, 'r', encoding='utf-8') as f:
                total_lines += len(f.read().splitlines())
        
        size_kb = backup_file.stat().st_size / 1024
        
        self.backup_session["statistics"]["migrations_backup"] = {
            "file": str(backup_file),
            "migration_files": len(migration_files),
            "lines": total_lines,
            "size_kb": round(size_kb, 2)
        }
        
        self.backup_session["files_created"].append(str(backup_file))
        
        print(f"   ✅ Migrations backup created: {len(migration_files)} files, {total_lines:,} lines")
        print(f"   📁 File: {backup_file.name}")
        
        return backup_file

    def create_recovery_guide(self) -> Path:
        """Create recovery documentation."""
        print("\n📋 Creating RECOVERY GUIDE...")
        
        guide_file = self.backups_dir / f"RECOVERY_GUIDE_{self.timestamp}.md"
        
        guide_content = f"""# DATABASE RECOVERY GUIDE
**Backup ID: {self.timestamp}**

## 📁 Backup Files Created:
"""
        
        for file_path in self.backup_session["files_created"]:
            file_name = Path(file_path).name
            guide_content += f"- `{file_name}`\n"
        
        guide_content += f"""

## 🔄 Recovery Procedures:

### 1. Schema Recovery
```bash
# Apply schema backup
npx supabase db push --file ./db_backups/SCHEMA_BACKUP_{self.timestamp}.sql
```

### 2. Migrations Recovery
```bash
# Apply migrations backup
npx supabase db push --file ./db_backups/MIGRATIONS_BACKUP_{self.timestamp}.sql
```

### 3. Types Recovery
```bash
# Restore TypeScript types
cp ./db_backups/TYPES_BACKUP_{self.timestamp}.ts ./types/database.ts
```

## 📊 Backup Statistics:
{json.dumps(self.backup_session.get('statistics', {}), indent=2)}

## ⚠️ Important Notes:
1. This backup contains schema and migration files
2. For data recovery, you'll need to restore from your Supabase dashboard
3. Always test recovery on development first
4. Backup created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---
**🛡️ Backup completed successfully!**
"""
        
        with open(guide_file, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        self.backup_session["files_created"].append(str(guide_file))
        
        print(f"   ✅ Recovery guide created: {guide_file}")
        
        return guide_file

    def generate_backup_report(self) -> Path:
        """Generate backup report."""
        print("\n📊 Generating backup report...")
        
        # Finalize session
        self.backup_session["completed_at"] = datetime.now().isoformat()
        self.backup_session["duration_seconds"] = (
            datetime.fromisoformat(self.backup_session["completed_at"]) -
            datetime.fromisoformat(self.backup_session["started_at"])
        ).total_seconds()
        
        self.backup_session["status"] = "completed"
        self.backup_session["files_count"] = len(self.backup_session["files_created"])
        
        # Save JSON report
        report_file = self.reports_dir / f"backup_report_{self.timestamp}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.backup_session, f, indent=2, default=str)
        
        # Create summary
        summary_file = self.reports_dir / f"backup_summary_{self.timestamp}.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"SIMPLE DATABASE BACKUP REPORT\n")
            f.write(f"{'=' * 50}\n\n")
            f.write(f"Backup ID: {self.backup_session['id']}\n")
            f.write(f"Status: {self.backup_session['status'].upper()}\n")
            f.write(f"Duration: {self.backup_session['duration_seconds']:.2f} seconds\n")
            f.write(f"Files Created: {self.backup_session['files_count']}\n")
            f.write(f"Operations: {len(self.backup_session['operations'])}\n")
            f.write(f"Errors: {len(self.backup_session['errors'])}\n\n")
            
            # Statistics summary
            stats = self.backup_session.get('statistics', {})
            for backup_type, data in stats.items():
                f.write(f"{backup_type.replace('_', ' ').title()}:\n")
                f.write(f"  Lines: {data.get('lines', 'N/A')}\n")
                f.write(f"  Size: {data.get('size_kb', 'N/A')} KB\n")
                f.write(f"  File: {Path(data.get('file', 'N/A')).name}\n\n")
        
        self.backup_session["files_created"].extend([str(report_file), str(summary_file)])
        
        print(f"   ✅ Reports created: {report_file}")
        
        return report_file

    def execute_simple_backup(self) -> None:
        """Execute simple backup workflow."""
        print("🚀 SIMPLE DATABASE BACKUP SYSTEM")
        print("=" * 50)
        print(f"📅 Backup ID: {self.timestamp}")
        print(f"📁 Project: {self.project_root}")
        print("=" * 50)
        
        try:
            # 1. Schema backup
            schema_backup = self.create_schema_backup()
            
            # 2. Types backup
            types_backup = self.create_types_backup()
            
            # 3. Migrations backup
            migrations_backup = self.create_migrations_backup()
            
            # 4. Recovery guide
            recovery_guide = self.create_recovery_guide()
            
            # 5. Generate reports
            backup_report = self.generate_backup_report()
            
            # Success summary
            print("\n" + "=" * 50)
            print("🎉 SIMPLE BACKUP COMPLETED SUCCESSFULLY!")
            print("=" * 50)
            print(f"📋 Schema: {schema_backup.name}")
            print(f"📝 Types: {types_backup.name}")
            print(f"🔄 Migrations: {migrations_backup.name}")
            print(f"📋 Recovery Guide: {recovery_guide.name}")
            print(f"📊 Report: {backup_report.name}")
            print(f"\n📁 All files saved to: {self.backups_dir}")
            print("=" * 50)
            
        except Exception as e:
            self.backup_session["errors"].append({
                "operation": "simple_backup",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            
            print(f"\n❌ SIMPLE BACKUP FAILED: {e}")
            
            # Generate error report
            self.backup_session["completed_at"] = datetime.now().isoformat()
            self.backup_session["status"] = "failed"
            
            error_report = self.reports_dir / f"backup_error_{self.timestamp}.json"
            with open(error_report, 'w', encoding='utf-8') as f:
                json.dump(self.backup_session, f, indent=2, default=str)
            
            print(f"📝 Error report: {error_report}")
            sys.exit(1)

def main():
    """Main entry point for simple backup system."""
    backup_system = SimpleBackupSystem()
    backup_system.execute_simple_backup()

if __name__ == "__main__":
    main()
