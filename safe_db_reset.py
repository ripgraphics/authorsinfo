#!/usr/bin/env python3
"""
SAFE DATABASE RESET WITH AUTOMATIC BACKUP
Automatically backs up your database before any reset operation.

This script intercepts database reset commands and ensures:
1. Automatic backup before reset
2. Confirmation prompts for safety
3. Recovery instructions if something goes wrong
4. Audit trail of all reset operations
"""

import os
import subprocess
import sys
import json
from datetime import datetime
from pathlib import Path

class SafeDatabaseReset:
    """Safe database reset with automatic backup protection."""
    
    def __init__(self):
        self.project_root = Path.cwd()
        self.backups_dir = self.project_root / "db_backups"
        self.safety_logs_dir = self.project_root / "safety_logs"
        
        # Ensure directories exist
        for directory in [self.backups_dir, self.safety_logs_dir]:
            directory.mkdir(exist_ok=True)
        
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def log_reset_operation(self, operation: str, status: str, details: str = ""):
        """Log all reset operations for audit trail."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "operation": operation,
            "status": status,
            "details": details,
            "user": os.getenv("USERNAME", "unknown"),
            "backup_created": self.timestamp
        }
        
        log_file = self.safety_logs_dir / f"reset_operations_{datetime.now().strftime('%Y%m%d')}.log"
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + "\n")

    def create_emergency_backup(self) -> bool:
        """Create emergency backup before reset."""
        print("🚨 SAFETY PROTOCOL ACTIVATED!")
        print("📋 Creating EMERGENCY BACKUP before database reset...")
        
        try:
            # Quick schema backup
            schema_result = subprocess.run(
                "npx supabase db dump",
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=300
            )
            
            if schema_result.returncode != 0:
                print(f"❌ Schema backup failed: {schema_result.stderr}")
                return False
            
            # Quick data backup
            data_result = subprocess.run(
                "npx supabase db dump --data-only",
                shell=True,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=300
            )
            
            if data_result.returncode != 0:
                print(f"❌ Data backup failed: {data_result.stderr}")
                return False
            
            # Create emergency backup file
            emergency_backup_file = self.backups_dir / f"EMERGENCY_BACKUP_BEFORE_RESET_{self.timestamp}.sql"
            
            emergency_content = f"""-- EMERGENCY BACKUP BEFORE DATABASE RESET
-- Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Reason: Automatic backup before db reset operation
-- Recovery: Use this file to restore if reset goes wrong
--
-- RESTORATION COMMAND:
-- npx supabase db push --file {emergency_backup_file.name}

-- SCHEMA SECTION
{schema_result.stdout}

-- DATA SECTION  
{data_result.stdout}

-- END OF EMERGENCY BACKUP
-- Total lines: {len(schema_result.stdout.splitlines()) + len(data_result.stdout.splitlines())}
"""
            
            with open(emergency_backup_file, 'w', encoding='utf-8') as f:
                f.write(emergency_content)
            
            # Also update the latest emergency backup
            latest_emergency = self.backups_dir / "LATEST_EMERGENCY_BACKUP.sql"
            with open(latest_emergency, 'w', encoding='utf-8') as f:
                f.write(emergency_content)
            
            # Calculate stats
            backup_size = emergency_backup_file.stat().st_size
            backup_lines = len(emergency_content.splitlines())
            
            print(f"✅ EMERGENCY BACKUP COMPLETED!")
            print(f"   📁 File: {emergency_backup_file}")
            print(f"   📊 Size: {backup_size/1024:.1f} KB, Lines: {backup_lines:,}")
            print(f"   🔄 Latest: {latest_emergency}")
            
            self.log_reset_operation("emergency_backup", "success", f"Backup created: {emergency_backup_file}")
            
            return True
            
        except Exception as e:
            print(f"❌ EMERGENCY BACKUP FAILED: {e}")
            self.log_reset_operation("emergency_backup", "failed", str(e))
            return False

    def confirm_reset_operation(self) -> bool:
        """Get user confirmation for destructive operation."""
        print("\n" + "="*60)
        print("⚠️  DATABASE RESET CONFIRMATION REQUIRED")
        print("="*60)
        print("🚨 This operation will:")
        print("   • DELETE all data in your database")
        print("   • RESET schema to migration state") 
        print("   • CANNOT be undone without backup")
        print("")
        print("✅ Emergency backup has been created automatically")
        print(f"📁 Recovery file: EMERGENCY_BACKUP_BEFORE_RESET_{self.timestamp}.sql")
        print("")
        
        while True:
            response = input("Continue with database reset? [yes/NO]: ").strip().lower()
            
            if response in ['yes', 'y']:
                print("✅ Reset confirmed by user")
                return True
            elif response in ['no', 'n', '']:
                print("❌ Reset cancelled by user")
                return False
            else:
                print("Please type 'yes' or 'no'")

    def execute_reset(self, reset_args: list) -> bool:
        """Execute the actual database reset."""
        print(f"\n🔄 Executing database reset...")
        
        try:
            # Build the reset command
            reset_command = ["npx", "supabase", "db", "reset"] + reset_args
            reset_cmd_str = " ".join(reset_command)
            
            print(f"📋 Command: {reset_cmd_str}")
            
            # Execute reset
            result = subprocess.run(
                reset_cmd_str,
                shell=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            if result.returncode == 0:
                print("✅ Database reset completed successfully")
                self.log_reset_operation("database_reset", "success", reset_cmd_str)
                return True
            else:
                print(f"❌ Database reset failed with exit code: {result.returncode}")
                self.log_reset_operation("database_reset", "failed", f"Exit code: {result.returncode}")
                return False
                
        except subprocess.TimeoutExpired:
            print("❌ Database reset timed out")
            self.log_reset_operation("database_reset", "timeout", "Operation timed out")
            return False
        except Exception as e:
            print(f"❌ Database reset failed: {e}")
            self.log_reset_operation("database_reset", "failed", str(e))
            return False

    def show_recovery_instructions(self):
        """Show recovery instructions if reset fails."""
        print("\n" + "="*60)
        print("🚨 EMERGENCY RECOVERY INSTRUCTIONS")
        print("="*60)
        print("If the reset failed or you need to recover your data:")
        print("")
        print("1. RESTORE FROM EMERGENCY BACKUP:")
        print(f"   npx supabase db push --file ./db_backups/EMERGENCY_BACKUP_BEFORE_RESET_{self.timestamp}.sql")
        print("")
        print("2. OR RESTORE FROM LATEST BACKUP:")
        print("   npx supabase db push --file ./db_backups/COMPLETE_BACKUP_LATEST.sql")
        print("")
        print("3. VERIFY RESTORATION:")
        print("   npx supabase db pull")
        print("   # Check your application works")
        print("")
        print(f"📁 Emergency backup location: {self.backups_dir}")
        print(f"📋 Operation log: {self.safety_logs_dir}")
        print("="*60)

    def run_safe_reset(self, args: list):
        """Execute the complete safe reset workflow."""
        print("🛡️  SAFE DATABASE RESET PROTOCOL")
        print("="*50)
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"👤 User: {os.getenv('USERNAME', 'unknown')}")
        print(f"📁 Project: {self.project_root}")
        
        # Step 1: Create emergency backup
        if not self.create_emergency_backup():
            print("\n❌ RESET ABORTED: Emergency backup failed")
            print("🔒 Database reset is not safe without backup")
            sys.exit(1)
        
        # Step 2: Get user confirmation
        if not self.confirm_reset_operation():
            print("\n✅ Reset cancelled - your database is safe")
            sys.exit(0)
        
        # Step 3: Execute reset
        reset_success = self.execute_reset(args)
        
        # Step 4: Show recovery info
        if not reset_success:
            self.show_recovery_instructions()
            sys.exit(1)
        else:
            print(f"\n✅ SAFE RESET COMPLETED SUCCESSFULLY!")
            print(f"📋 Emergency backup available if needed")
            print(f"📁 Backup location: {self.backups_dir}")

def main():
    """Main entry point for safe database reset."""
    if len(sys.argv) < 2:
        print("Usage: python safe_db_reset.py [supabase db reset arguments]")
        print("Example: python safe_db_reset.py --linked")
        sys.exit(1)
    
    # Get arguments for the reset command (excluding 'db reset' which we add)
    reset_args = sys.argv[1:]
    
    safe_reset = SafeDatabaseReset()
    safe_reset.run_safe_reset(reset_args)

if __name__ == "__main__":
    main()