# Authors Info Application

This is an enterprise-grade platform for managing author information, books, and analytics.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation
```bash
npm install
```

### Database Migrations
We use a direct PostgreSQL connection for migrations to ensure reliability.

```powershell
# Run a specific migration
npm run db:migrate supabase/migrations/20251228_user_segmentation.sql
```

Ensure your `.env.local` contains the necessary `SUPABASE_DB_*` variables.

## 📊 Documentation

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
