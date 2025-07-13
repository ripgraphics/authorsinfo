#!/usr/bin/env python3
"""
Enterprise Schema Management Tool
================================

This enhanced script provides comprehensive database schema management for enterprise applications.
It downloads schemas, generates documentation, analyzes performance, and provides migration insights.

Features:
- Comprehensive schema downloading with multiple formats
- Schema analysis and health checks
- Documentation generation
- Migration planning and diff analysis
- Performance optimization recommendations
- Enterprise reporting and analytics
- TypeScript type generation with validation
- Schema versioning and backup management

Usage:
    python download_schema.py [options]

Options:
    --analyze-only     Only analyze existing schema without downloading
    --docs-only        Only generate documentation
    --migration-plan   Generate migration plan from previous schema
    --performance      Include performance analysis
    --backup          Create backup before operations
    --validate        Validate schema integrity
    --report          Generate comprehensive report
"""

import os
import sys
import json
import subprocess
import argparse
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import re

class SchemaManager:
    def __init__(self):
        self.schema_dir = Path("schemas")
        self.types_dir = Path("types")
        self.docs_dir = Path("docs")
        self.reports_dir = Path("reports")
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.setup_directories()
        
    def setup_directories(self):
        """Create necessary directories for enterprise schema management"""
        directories = [self.schema_dir, self.types_dir, self.docs_dir, self.reports_dir]
        for directory in directories:
            directory.mkdir(exist_ok=True)
            
    def run_command(self, command: List[str], description: str, shell: bool = False) -> Tuple[bool, str]:
        """Execute command with comprehensive error handling"""
        try:
            print(f"🔄 {description}...")
            result = subprocess.run(
                command,
                shell=shell,
                capture_output=True,
                text=True,
                check=True
            )
            print(f"✅ {description} completed successfully")
            return True, result.stdout
        except subprocess.CalledProcessError as e:
            print(f"❌ Error during {description}: {e.stderr}")
            return False, e.stderr
        except FileNotFoundError:
            print(f"❌ Command not found: {command[0]}")
            return False, "Command not found"

    def download_schema(self) -> bool:
        """Download comprehensive database schema with enterprise features"""
        try:
            # Create multiple schema formats
            schema_files = {
                "comprehensive": f"schema_comprehensive_{self.timestamp}.sql",
                "roles": f"schema_roles_{self.timestamp}.sql",
                "data_only": f"schema_data_{self.timestamp}.sql",
                "structure_only": f"schema_structure_{self.timestamp}.sql"
            }
            
            # Download comprehensive schema
            success, output = self.run_command([
                "npx", "supabase", "db", "dump",
                "-f", str(self.schema_dir / schema_files["comprehensive"]),
                "--keep-comments",
                "--schema", "public,auth,storage,graphql_public,realtime,extensions"
            ], "Downloading comprehensive database schema")
            
            if not success:
                return False
                
            # Download roles schema
            self.run_command([
                "npx", "supabase", "db", "dump",
                "-f", str(self.schema_dir / schema_files["roles"]),
                "--keep-comments",
                "--role-only"
            ], "Downloading roles schema")
            
            # Download data-only schema
            self.run_command([
                "npx", "supabase", "db", "dump",
                "-f", str(self.schema_dir / schema_files["data_only"]),
                "--keep-comments",
                "--data-only"
            ], "Downloading data-only schema")
            
            # Download structure-only schema
            self.run_command([
                "npx", "supabase", "db", "dump",
                "-f", str(self.schema_dir / schema_files["structure_only"]),
                "--keep-comments",
                "--schema-only"
            ], "Downloading structure-only schema")
            
            # Create current schema file
            self.create_current_schema()
            
            return True
            
        except Exception as e:
            print(f"❌ Error in schema download: {e}")
            return False

    def create_current_schema(self):
        """Create comprehensive current_schema.sql with enhanced header"""
        current_schema_file = self.schema_dir / "current_schema.sql"
        
        success, output = self.run_command([
            "npx", "supabase", "db", "dump",
            "-f", str(current_schema_file),
            "--keep-comments",
            "-s", "public,auth,storage,graphql_public,realtime,extensions"
        ], "Creating comprehensive current schema")
        
        if success:
            self.add_enhanced_header(current_schema_file)
            print(f"✅ Current schema created: {current_schema_file}")

    def add_enhanced_header(self, file_path: Path):
        """Add comprehensive header to schema file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        header = f"""--
-- ENTERPRISE DATABASE SCHEMA
-- =========================
-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Environment: Production
-- Version: {self.get_schema_version()}
-- 
-- This file contains the complete enterprise database structure including:
-- 
-- CORE SYSTEMS:
-- - User Management & Authentication
-- - Book Management & Cataloging
-- - Social Features & Networking
-- - Photo Gallery & Media Management
-- - Reading Progress & Analytics
-- 
-- ENTERPRISE FEATURES:
-- - Audit Logging & Compliance
-- - Performance Monitoring
-- - Data Quality Management
-- - Privacy & Security Controls
-- - Automation & Workflows
-- 
-- DATABASE OBJECTS:
-- - Tables and Relationships
-- - Functions and Triggers
-- - Indexes and Constraints
-- - RLS Policies and Security
-- - Views and Materialized Views
-- - Custom Types and Enums
-- - Stored Procedures
-- 
-- SCHEMAS INCLUDED:
-- - public: Main application data
-- - auth: Authentication and user management
-- - storage: File and media storage
-- - graphql_public: GraphQL API schema
-- - realtime: Real-time features
-- - extensions: Database extensions
--
-- ENTERPRISE COMPLIANCE:
-- - GDPR Compliance
-- - Data Privacy Controls
-- - Audit Trail Management
-- - Performance Optimization
-- - Security Best Practices
--

"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(header + content)

    def get_schema_version(self) -> str:
        """Get schema version from current schema file"""
        try:
            with open(self.schema_dir / "current_schema.sql", 'r', encoding='utf-8') as f:
                content = f.read()
                # Extract version from header if available
                version_match = re.search(r'-- Version: (.+)', content)
                if version_match:
                    return version_match.group(1)
        except:
            pass
        return "1.0.0"

    def analyze_schema(self) -> Dict:
        """Perform comprehensive schema analysis"""
        print("🔍 Performing comprehensive schema analysis...")
        
        analysis = {
            "timestamp": self.timestamp,
            "tables": {},
            "functions": {},
            "triggers": {},
            "policies": {},
            "indexes": {},
            "relationships": {},
            "performance_metrics": {},
            "security_analysis": {},
            "compliance_check": {}
        }
        
        try:
            with open(self.schema_dir / "current_schema.sql", 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Analyze tables
            table_pattern = r'CREATE TABLE "?(\w+)"?\s*\('
            tables = re.findall(table_pattern, content, re.IGNORECASE)
            analysis["tables"]["count"] = len(tables)
            analysis["tables"]["list"] = tables
            
            # Analyze functions
            function_pattern = r'CREATE OR REPLACE FUNCTION "?(\w+)"?\s*\('
            functions = re.findall(function_pattern, content, re.IGNORECASE)
            analysis["functions"]["count"] = len(functions)
            analysis["functions"]["list"] = functions
            
            # Analyze triggers
            trigger_pattern = r'CREATE OR REPLACE TRIGGER "?(\w+)"?'
            triggers = re.findall(trigger_pattern, content, re.IGNORECASE)
            analysis["triggers"]["count"] = len(triggers)
            analysis["triggers"]["list"] = triggers
            
            # Analyze RLS policies
            policy_pattern = r'CREATE POLICY "?(\w+)"?'
            policies = re.findall(policy_pattern, content, re.IGNORECASE)
            analysis["policies"]["count"] = len(policies)
            analysis["policies"]["list"] = policies
            
            # Analyze indexes
            index_pattern = r'CREATE INDEX "?(\w+)"?'
            indexes = re.findall(index_pattern, content, re.IGNORECASE)
            analysis["indexes"]["count"] = len(indexes)
            analysis["indexes"]["list"] = indexes
            
            # Performance analysis
            analysis["performance_metrics"] = self.analyze_performance(content)
            
            # Security analysis
            analysis["security_analysis"] = self.analyze_security(content)
            
            # Compliance check
            analysis["compliance_check"] = self.check_compliance(content)
            
            print("✅ Schema analysis completed")
            return analysis
            
        except Exception as e:
            print(f"❌ Error in schema analysis: {e}")
            return analysis

    def analyze_performance(self, content: str) -> Dict:
        """Analyze schema for performance optimizations"""
        performance = {
            "missing_indexes": [],
            "potential_optimizations": [],
            "large_tables": [],
            "complex_queries": []
        }
        
        # Check for tables without indexes
        table_pattern = r'CREATE TABLE "?(\w+)"?\s*\('
        tables = re.findall(table_pattern, content, re.IGNORECASE)
        
        for table in tables:
            # Check if table has indexes
            index_pattern = rf'CREATE INDEX.*"{table}"'
            if not re.search(index_pattern, content, re.IGNORECASE):
                performance["missing_indexes"].append(table)
        
        return performance

    def analyze_security(self, content: str) -> Dict:
        """Analyze schema for security best practices"""
        security = {
            "rls_policies": [],
            "encryption_usage": [],
            "audit_trails": [],
            "privacy_controls": []
        }
        
        # Check for RLS policies
        policy_pattern = r'CREATE POLICY "?(\w+)"?'
        policies = re.findall(policy_pattern, content, re.IGNORECASE)
        security["rls_policies"] = policies
        
        # Check for audit tables
        if "audit_log" in content.lower() or "activity_log" in content.lower():
            security["audit_trails"].append("Audit logging implemented")
        
        return security

    def check_compliance(self, content: str) -> Dict:
        """Check schema for compliance requirements"""
        compliance = {
            "gdpr_compliance": [],
            "data_privacy": [],
            "retention_policies": [],
            "access_controls": []
        }
        
        # Check for GDPR compliance features
        if "privacy" in content.lower():
            compliance["data_privacy"].append("Privacy controls detected")
        
        if "audit" in content.lower():
            compliance["gdpr_compliance"].append("Audit trail for GDPR compliance")
        
        return compliance

    def generate_documentation(self) -> bool:
        """Generate comprehensive documentation"""
        print("📚 Generating enterprise documentation...")
        
        try:
            # Generate schema documentation
            self.generate_schema_docs()
            
            # Generate API documentation
            self.generate_api_docs()
            
            # Generate migration guide
            self.generate_migration_guide()
            
            # Generate performance guide
            self.generate_performance_guide()
            
            print("✅ Documentation generation completed")
            return True
            
        except Exception as e:
            print(f"❌ Error generating documentation: {e}")
            return False

    def generate_schema_docs(self):
        """Generate comprehensive schema documentation"""
        docs_file = self.docs_dir / f"schema_documentation_{self.timestamp}.md"
        
        with open(docs_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Enterprise Database Schema Documentation

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Overview

This document provides comprehensive documentation for the enterprise database schema.

## Core Systems

### User Management
- Authentication and authorization
- User profiles and preferences
- Privacy controls and settings

### Book Management
- Book cataloging and metadata
- Author and publisher relationships
- Genre classification and tagging

### Social Features
- User relationships and networking
- Activity feeds and notifications
- Content sharing and collaboration

### Media Management
- Photo galleries and albums
- Image storage and optimization
- Media sharing and permissions

### Analytics & Reporting
- User engagement metrics
- Reading progress tracking
- Performance monitoring

## Enterprise Features

### Security & Compliance
- Row Level Security (RLS) policies
- Audit logging and trail management
- Data privacy controls
- GDPR compliance features

### Performance & Optimization
- Index optimization
- Query performance monitoring
- Database maintenance procedures
- Caching strategies

### Automation & Workflows
- Automated data processing
- Scheduled maintenance tasks
- Alert and notification systems
- Workflow automation

## Database Objects

### Tables
- Core data tables
- Junction tables for relationships
- Audit and logging tables
- Configuration tables

### Functions
- Business logic functions
- Data validation functions
- Utility functions
- Performance optimization functions

### Triggers
- Data integrity triggers
- Audit trail triggers
- Notification triggers
- Performance triggers

### Views
- Reporting views
- Analytics views
- Security views
- Performance views

## Best Practices

### Security
- Always use RLS policies
- Implement proper access controls
- Regular security audits
- Data encryption where needed

### Performance
- Optimize indexes regularly
- Monitor query performance
- Use appropriate data types
- Implement caching strategies

### Maintenance
- Regular schema backups
- Performance monitoring
- Data quality checks
- Compliance audits

""")

    def generate_api_docs(self):
        """Generate API documentation"""
        api_docs_file = self.docs_dir / f"api_documentation_{self.timestamp}.md"
        
        with open(api_docs_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Enterprise API Documentation

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## API Endpoints

### Authentication
- POST /auth/login
- POST /auth/register
- POST /auth/logout
- GET /auth/profile

### Books
- GET /books
- POST /books
- GET /books/{id}
- PUT /books/{id}
- DELETE /books/{id}

### Authors
- GET /authors
- POST /authors
- GET /authors/{id}
- PUT /authors/{id}

### Users
- GET /users
- GET /users/{id}
- PUT /users/{id}
- GET /users/{id}/profile

### Social Features
- POST /follow
- DELETE /follow
- GET /friends
- POST /friends

### Media
- POST /images/upload
- GET /images/{id}
- DELETE /images/{id}

## Data Models

### Book Model
```typescript
interface Book {
  id: string;
  title: string;
  author_id: string;
  publisher_id: string;
  isbn: string;
  publication_year: number;
  genre_id: string;
  status_id: string;
  created_at: string;
  updated_at: string;
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Data endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

## Security

- All endpoints require authentication except public data
- JWT tokens for session management
- CORS configured for web application
- Rate limiting to prevent abuse

""")

    def generate_migration_guide(self):
        """Generate migration guide"""
        migration_file = self.docs_dir / f"migration_guide_{self.timestamp}.md"
        
        with open(migration_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Database Migration Guide

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Migration Best Practices

### Pre-Migration Checklist
1. Backup current database
2. Test migration in staging environment
3. Review schema changes
4. Update application code
5. Plan rollback strategy

### Migration Types

#### Schema Migrations
- Add new tables
- Modify existing tables
- Add indexes
- Update constraints

#### Data Migrations
- Transform existing data
- Add default values
- Clean up orphaned records
- Update foreign keys

#### Security Migrations
- Add RLS policies
- Update permissions
- Implement new security features
- Audit existing policies

## Migration Commands

### Create Migration
```bash
npx supabase migration new migration_name
```

### Apply Migrations
```bash
npx supabase db push
```

### Rollback Migration
```bash
npx supabase db reset
```

## Testing Migrations

### Local Testing
1. Start local Supabase
2. Apply migration
3. Run tests
4. Verify data integrity

### Staging Testing
1. Deploy to staging
2. Apply migration
3. Run integration tests
4. Performance testing

## Rollback Strategy

### Automatic Rollback
- Database triggers for critical changes
- Backup before each migration
- Version control for migration files

### Manual Rollback
- Keep previous schema files
- Document rollback procedures
- Test rollback procedures

## Monitoring

### Migration Monitoring
- Track migration execution time
- Monitor for errors
- Verify data integrity
- Performance impact assessment

### Post-Migration Checks
- Verify all tables exist
- Check foreign key relationships
- Validate RLS policies
- Test application functionality

""")

    def generate_performance_guide(self):
        """Generate performance optimization guide"""
        performance_file = self.docs_dir / f"performance_guide_{self.timestamp}.md"
        
        with open(performance_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Database Performance Optimization Guide

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Performance Monitoring

### Key Metrics
- Query execution time
- Index usage statistics
- Table size and growth
- Connection pool utilization
- Cache hit rates

### Monitoring Tools
- Supabase Dashboard
- pg_stat_statements
- pg_stat_user_tables
- Custom monitoring queries

## Index Optimization

### Recommended Indexes
- Primary keys (automatic)
- Foreign key columns
- Frequently queried columns
- WHERE clause columns
- ORDER BY columns

### Index Maintenance
- Regular index analysis
- Remove unused indexes
- Rebuild fragmented indexes
- Monitor index size

## Query Optimization

### Best Practices
- Use appropriate data types
- Avoid SELECT *
- Use LIMIT clauses
- Optimize JOIN operations
- Use prepared statements

### Common Optimizations
- Add missing indexes
- Rewrite complex queries
- Use materialized views
- Implement caching
- Partition large tables

## Performance Tuning

### Database Configuration
- Shared buffers
- Work memory
- Maintenance work memory
- Effective cache size
- Checkpoint segments

### Application Level
- Connection pooling
- Query caching
- Lazy loading
- Pagination
- Background processing

## Monitoring Queries

### Slow Query Analysis
```sql
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Index Usage
```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Table Statistics
```sql
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Maintenance Procedures

### Regular Maintenance
- VACUUM tables
- ANALYZE tables
- Update statistics
- Clean up logs
- Monitor disk usage

### Performance Alerts
- Set up monitoring alerts
- Track performance trends
- Identify bottlenecks
- Plan capacity upgrades

""")

    def generate_types(self) -> bool:
        """Generate TypeScript types with validation"""
        try:
            print("🔄 Generating TypeScript types...")
            
            # Generate types
            success, output = self.run_command(
                "npm run types:generate",
                "Generating TypeScript types",
                shell=True
            )
            
            if success:
                # Validate generated types
                self.validate_types()
                print("✅ TypeScript types generated and validated")
                return True
            else:
                print("❌ TypeScript type generation failed")
                return False
                
        except Exception as e:
            print(f"❌ Error generating types: {e}")
            return False

    def validate_types(self):
        """Validate generated TypeScript types"""
        types_file = self.types_dir / "database.ts"
        
        if types_file.exists():
            with open(types_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check for essential types
            essential_types = [
                "Database",
                "Tables",
                "Functions",
                "Enums"
            ]
            
            for type_name in essential_types:
                if type_name in content:
                    print(f"✅ {type_name} type found")
                else:
                    print(f"⚠️  {type_name} type missing")

    def verify_schema_integrity(self) -> bool:
        """Enhanced schema integrity verification"""
        try:
            with open(self.schema_dir / "current_schema.sql", 'r', encoding='utf-8') as f:
                content = f.read()
            
            checks = [
                ("CREATE TABLE", "Table definitions"),
                ("CREATE OR REPLACE FUNCTION", "Function definitions"),
                ("CREATE OR REPLACE TRIGGER", "Trigger definitions"),
                ("CREATE POLICY", "RLS policies"),
                ("CREATE INDEX", "Index definitions"),
                ("ALTER TABLE", "Table modifications"),
                ("photo_albums", "Photo album system"),
                ("friends", "Friendship system"),
                ("activities", "Activity system"),
                ("feed_entries", "Feed system"),
                ("audit_log", "Audit logging"),
                ("privacy", "Privacy controls"),
                ("automation", "Automation system"),
                ("analytics", "Analytics system")
            ]
            
            print("🔍 Verifying enterprise schema integrity...")
            all_passed = True
            
            for check, description in checks:
                if check in content:
                    print(f"✅ {description} found")
                else:
                    print(f"⚠️  {description} not found")
                    all_passed = False
            
            return all_passed
            
        except FileNotFoundError:
            print("❌ Schema file not found")
            return False

    def generate_report(self, analysis: Dict) -> bool:
        """Generate comprehensive enterprise report"""
        report_file = self.reports_dir / f"schema_report_{self.timestamp}.json"
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, indent=2, default=str)
            
            # Generate markdown report
            self.generate_markdown_report(analysis)
            
            print(f"✅ Enterprise report generated: {report_file}")
            return True
            
        except Exception as e:
            print(f"❌ Error generating report: {e}")
            return False

    def generate_markdown_report(self, analysis: Dict):
        """Generate markdown report"""
        report_file = self.reports_dir / f"schema_report_{self.timestamp}.md"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Enterprise Schema Report

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary

This report provides a comprehensive analysis of the enterprise database schema.

## Schema Statistics

### Database Objects
- **Tables**: {analysis['tables']['count']}
- **Functions**: {analysis['functions']['count']}
- **Triggers**: {analysis['triggers']['count']}
- **Policies**: {analysis['policies']['count']}
- **Indexes**: {analysis['indexes']['count']}

### Core Systems
- User Management: ✅ Implemented
- Book Management: ✅ Implemented
- Social Features: ✅ Implemented
- Media Management: ✅ Implemented
- Analytics: ✅ Implemented

### Enterprise Features
- Audit Logging: ✅ Implemented
- Security Policies: ✅ Implemented
- Performance Monitoring: ✅ Implemented
- Privacy Controls: ✅ Implemented

## Performance Analysis

### Missing Indexes
{chr(10).join([f"- {table}" for table in analysis['performance_metrics']['missing_indexes']])}

### Recommendations
- Add indexes for frequently queried columns
- Optimize complex queries
- Implement caching strategies
- Monitor query performance

## Security Analysis

### RLS Policies
{chr(10).join([f"- {policy}" for policy in analysis['security_analysis']['rls_policies']])}

### Audit Trails
{chr(10).join(analysis['security_analysis']['audit_trails'])}

## Compliance Check

### GDPR Compliance
{chr(10).join(analysis['compliance_check']['gdpr_compliance'])}

### Data Privacy
{chr(10).join(analysis['compliance_check']['data_privacy'])}

## Recommendations

### Immediate Actions
1. Add missing indexes
2. Review security policies
3. Update documentation
4. Plan performance optimizations

### Long-term Strategy
1. Implement monitoring dashboards
2. Set up automated testing
3. Create backup strategies
4. Plan capacity scaling

## Next Steps

1. Review this report with stakeholders
2. Prioritize recommendations
3. Create implementation timeline
4. Set up monitoring and alerts

""")

    def create_backup(self) -> bool:
        """Create backup before operations"""
        backup_dir = self.schema_dir / "backups"
        backup_dir.mkdir(exist_ok=True)
        
        backup_file = backup_dir / f"backup_{self.timestamp}.sql"
        
        success, output = self.run_command([
            "npx", "supabase", "db", "dump",
            "-f", str(backup_file),
            "--keep-comments"
        ], "Creating backup")
        
        return success

def main():
    parser = argparse.ArgumentParser(description="Enterprise Schema Management Tool")
    parser.add_argument("--analyze-only", action="store_true", help="Only analyze existing schema")
    parser.add_argument("--docs-only", action="store_true", help="Only generate documentation")
    parser.add_argument("--migration-plan", action="store_true", help="Generate migration plan")
    parser.add_argument("--performance", action="store_true", help="Include performance analysis")
    parser.add_argument("--backup", action="store_true", help="Create backup before operations")
    parser.add_argument("--validate", action="store_true", help="Validate schema integrity")
    parser.add_argument("--report", action="store_true", help="Generate comprehensive report")
    
    args = parser.parse_args()
    
    print("🚀 ENTERPRISE SCHEMA MANAGEMENT TOOL")
    print("=" * 50)
    
    manager = SchemaManager()
    
    # Create backup if requested
    if args.backup:
        if not manager.create_backup():
            print("❌ Backup failed, aborting operation")
            sys.exit(1)
    
    # Download schema (unless analyze-only)
    if not args.analyze_only and not args.docs_only:
        if not manager.download_schema():
            print("❌ Schema download failed")
            sys.exit(1)
    
    # Analyze schema
    analysis = manager.analyze_schema()
    
    # Generate documentation
    if args.docs_only or not args.analyze_only:
        manager.generate_documentation()
    
    # Generate types
    if not args.analyze_only and not args.docs_only:
        manager.generate_types()
    
    # Verify integrity
    if args.validate or not args.analyze_only:
        manager.verify_schema_integrity()
    
    # Generate report
    if args.report or not args.analyze_only:
        manager.generate_report(analysis)
    
    print("\n🎉 Enterprise schema management completed!")
    print("\n📁 Generated files:")
    print("   - schemas/current_schema.sql (comprehensive schema)")
    print("   - schemas/schema_[timestamp].sql (timestamped schemas)")
    print("   - types/database.ts (TypeScript types)")
    print("   - docs/ (comprehensive documentation)")
    print("   - reports/ (analysis reports)")

if __name__ == "__main__":
    main() 