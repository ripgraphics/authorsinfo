# Environment Setup

This application requires several environment variables to function properly. Create a `.env.local` file in the root directory with the following variables:

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Optional Environment Variables

#### ISBNdb API (for book import features)
```
ISBNDB_API_KEY=your_isbndb_api_key_here
```

**Note**: If `ISBNDB_API_KEY` is not set, the book import features will be disabled gracefully without causing errors.

#### Cloudinary (for image uploads)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## How to Get API Keys

### ISBNdb API Key
1. Go to [ISBNdb](https://isbndb.com/)
2. Sign up for an account
3. Navigate to your API settings
4. Copy your API key

### Supabase Keys
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the URL and keys

### Cloudinary Keys
1. Go to your Cloudinary dashboard
2. Navigate to Settings > Access Keys
3. Copy your cloud name, API key, and API secret

## Current Issue Resolution

The 403 error you're seeing is because the `ISBNDB_API_KEY` environment variable is not set. The application will now handle this gracefully:

- The "Latest Books" tab will show an empty list instead of crashing
- Other import features will work normally
- No error messages will be shown to users

To enable the ISBNdb features, simply add your API key to the `.env.local` file. 