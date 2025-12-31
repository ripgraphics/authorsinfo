# Environment Variable Configuration Guide

**Date**: December 24, 2025  
**Status**: Complete

## Overview

This document describes all environment variables required to run the Authors Info application. Environment variables are validated at startup to catch configuration issues early.

## Required Environment Variables

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Type**: URL string
- **Required**: YES (on both client and server)
- **Description**: The base URL for your Supabase project
- **Example**: `https://your-project.supabase.co`
- **Source**: [Supabase Dashboard](https://app.supabase.com/)
- **Scope**: PUBLIC (safe to expose in client-side code)
- **Usage**: Client and server authentication initialization

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type**: String
- **Required**: YES (on both client and server)
- **Description**: Anonymous/public API key for client-side authentication
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Source**: [Supabase Dashboard](https://app.supabase.com/) → Settings → API
- **Scope**: PUBLIC (safe to expose in client-side code)
- **Usage**: Client-side authentication, user login/signup
- **Permissions**: Limited to unauthenticated users and row-level security (RLS)

#### `SUPABASE_URL` (Optional)
- **Type**: URL string
- **Required**: NO (uses `NEXT_PUBLIC_SUPABASE_URL` if not set)
- **Description**: Server-side Supabase URL (can be different from public URL)
- **Example**: `https://your-project.supabase.co`
- **Source**: [Supabase Dashboard](https://app.supabase.com/)
- **Scope**: PRIVATE (server-side only)
- **Usage**: Server-side database operations

#### `SUPABASE_SERVICE_ROLE_KEY` (Critical!)
- **Type**: String
- **Required**: YES (on server-side only, NOT needed on client)
- **Description**: Admin API key with full database access
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Source**: [Supabase Dashboard](https://app.supabase.com/) → Settings → API → Service Role Secret
- **Scope**: PRIVATE (server-side only, NEVER expose to client!)
- **Usage**: 
  - Server actions (app/actions/*.ts)
  - API routes (app/api/**/route.ts)
  - Admin operations with elevated privileges
- **⚠️ SECURITY**: This key should NEVER appear in client-side code or browser requests

### Runtime Environment

#### `NODE_ENV`
- **Type**: `'development' | 'production' | 'test'`
- **Required**: YES
- **Description**: The runtime environment
- **Default**: Typically set by Next.js build process
- **Usage**: 
  - Enables development-only features and logging
  - Optimizes performance for production
  - Configures error handling behavior
- **Development**: More verbose logging, exposes error details in dev mode
- **Production**: Silent error handling, generic error messages to clients
- **Test**: Test-specific configuration

## Environment Variable Validation

All environment variables are validated at runtime using the `env-validator` utility:

```typescript
// lib/env-validator.ts provides:
import { validateEnv, getEnv, isDevelopment, isProduction } from '@/lib/env-validator'

// Validate all env vars at startup
validateEnv()

// Get a typed env var
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')

// Check environment
if (isDevelopment()) { ... }
if (isProduction()) { ... }
```

### Validation Rules

✅ **NEXT_PUBLIC_SUPABASE_URL**
- Must be set
- Must be a valid URL
- Throws error if missing or invalid

✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Must be set
- Must be non-empty string
- Throws error if missing

✅ **SUPABASE_SERVICE_ROLE_KEY**
- Required on server-side (app/api/*, app/actions/*)
- Must be set before any server operations
- Throws error if missing during server initialization

✅ **NODE_ENV**
- Must be one of: 'development', 'production', 'test'
- Throws error if invalid value

## Setup Instructions

### 1. Create `.env.local` File

Copy from `.env.example`:

```bash
cp .env.example .env.local
```

### 2. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Fill in `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development
```

### 4. Verify Configuration

The application validates all variables on startup. If any are missing or invalid, it will throw an error with details.

## Environment by Deployment Type

### Local Development

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev_anon_key
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dev_service_role_key
NODE_ENV=development
```

### Production (Vercel)

Set these in Vercel project settings (Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL → Available to browser
NEXT_PUBLIC_SUPABASE_ANON_KEY → Available to browser
SUPABASE_URL → Server-only
SUPABASE_SERVICE_ROLE_KEY → Server-only (ENCRYPTED)
NODE_ENV=production → Automatically set by Vercel
```

### Testing

```env
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
NODE_ENV=test
```

## Security Best Practices

### ✅ DO:
1. **Create `.env.local`** - Never commit this file (add to `.gitignore`)
2. **Use Service Role Key on server only** - Never send to client
3. **Validate at startup** - Catch missing variables early
4. **Use `.env.example`** - Document required variables for team members
5. **Rotate keys periodically** - Change production keys regularly
6. **Use different projects** - Separate dev/prod Supabase projects
7. **Restrict RLS policies** - Limit database access with Row Level Security

### ❌ DON'T:
1. **Commit `.env.local`** - Use `.gitignore`
2. **Expose Service Role Key** - Keep on server-side only
3. **Use production keys in development** - Use separate credentials
4. **Log sensitive values** - Error handling sanitizes keys
5. **Share credentials in code** - Use environment variables
6. **Hardcode API keys** - Always use environment variables
7. **Expose keys in client bundles** - Validate at build time

## Troubleshooting

### Error: "Missing Supabase URL"

**Cause**: `NEXT_PUBLIC_SUPABASE_URL` is not set

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Check if variable is set
echo $NEXT_PUBLIC_SUPABASE_URL

# Add to .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
```

### Error: "Missing Supabase service role key"

**Cause**: `SUPABASE_SERVICE_ROLE_KEY` is not set on server

**Solution**:
```bash
# Add to .env.local (server-side only)
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env.local

# Restart the development server
```

### Error: "Invalid environment variable"

**Cause**: Variable is set but has wrong format

**Solution**:
- Check URL format (must include protocol: `https://`)
- Check key format (should be a long JWT string)
- Verify no quotes or extra whitespace in `.env.local`

## Files to Update/Create

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Template for all required env vars | ✅ Created |
| `lib/env-validator.ts` | Validation utility | ✅ Created |
| `.env.local` | Local development values (NOT committed) | 📝 User creates |
| `.gitignore` | Should exclude `.env.local` | ✅ Verify included |

## Next Steps

1. **Copy `.env.example` to `.env.local`**
2. **Add your Supabase credentials**
3. **Run `npm run dev`** - Variables are validated on startup
4. **Fix any errors** - Follow troubleshooting guide

## Related Documentation

- [Supabase Environment Variables](https://supabase.com/docs/guides/hosting/overview)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [API Key Management](https://supabase.com/docs/guides/auth#api-keys)

---
**Last Updated**: December 24, 2025  
**Status**: Complete ✅
