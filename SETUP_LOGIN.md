# Login Setup Guide

## Issue
You're getting "Invalid login credentials" because there are no users in your Supabase database yet.

## Solution

### 1. Set up Environment Variables
Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these in your Supabase project dashboard under Settings > API.

### 2. Create Test Users
Run one of these commands to create test users:

**Using Node.js:**
```bash
node scripts/create-test-users.js
```

**Using TypeScript (if you have ts-node installed):**
```bash
npx ts-node scripts/create-test-users.ts
```

### 3. Test Login
After creating the test users, you can log in with any of these accounts:

- **Email:** admin@example.com, **Password:** password123
- **Email:** user1@example.com, **Password:** password123
- **Email:** user2@example.com, **Password:** password123
- **Email:** test@example.com, **Password:** password123

### 4. Alternative: Use the Login Page
The login page should show a list of test users. You can click on any user to automatically fill in their credentials and log in.

## Troubleshooting

If you still get errors:

1. **Check Supabase is running:** Make sure your Supabase instance is running locally or your remote Supabase project is accessible.

2. **Verify environment variables:** Ensure all three environment variables are set correctly.

3. **Check network connectivity:** Make sure your app can reach the Supabase API.

4. **Check browser console:** Look for any additional error messages in the browser developer tools. 