# Friends System Test Plan

## Current Status

The friends system API endpoints have been fixed to use the correct foreign key references (`auth.users` instead of `public.users`). The core functionality should now work.

## What's Fixed

1. ✅ **API Endpoints**: All friend-related API endpoints now use correct foreign key references
2. ✅ **Component Interface**: Updated to match corrected API response structure
3. ⚠️ **Additional Tables**: Friend suggestions, analytics, and activities tables need to be created manually

## Test Steps

### 1. Test Pending Friend Requests
- Navigate to a page that shows pending friend requests
- Check browser console for any errors
- Verify that the API call to `/api/friends/pending` returns data

### 2. Test Friend List
- Navigate to a friend list page
- Check that friend data loads correctly
- Verify API call to `/api/friends/list` works

### 3. Test Friend Actions
- Try accepting/rejecting a friend request
- Verify the API calls work without errors

## Manual Database Setup (if needed)

If you want the full friends system with suggestions and analytics, run this SQL manually:

```sql
-- Create friend_suggestions table
CREATE TABLE IF NOT EXISTS "public"."friend_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "suggested_user_id" "uuid" NOT NULL,
    "mutual_friends_count" integer DEFAULT 0,
    "common_interests" text[],
    "suggestion_score" numeric(3,2) DEFAULT 0.00,
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("suggested_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id", "suggested_user_id")
);

-- Create friend_analytics table
CREATE TABLE IF NOT EXISTS "public"."friend_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_friends" integer DEFAULT 0,
    "friend_requests_sent" integer DEFAULT 0,
    "friend_requests_received" integer DEFAULT 0,
    "friend_requests_accepted" integer DEFAULT 0,
    "friend_requests_rejected" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id")
);

-- Create friend_activities table
CREATE TABLE IF NOT EXISTS "public"."friend_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "activity_type" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
```

## Expected Results

- ✅ Pending friend requests should load without "Failed to fetch pending requests" error
- ✅ Friend list should display correctly
- ✅ Accept/reject friend requests should work
- ⚠️ Friend suggestions will return empty until the additional tables are created

## Next Steps

1. Test the current functionality
2. If working, optionally create the additional tables for full feature set
3. Monitor for any remaining errors 