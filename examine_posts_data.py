#!/usr/bin/env python3
"""
Script to examine posts data in the activities table
This will help us understand why posts are missing text and image content
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    # Using the credentials from .env.local
    url = "https://nmrohtlcfqujtfgcyqhw.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcm9odGxjZnF1anRmZ2N5cWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTQ1ODIsImV4cCI6MjA1Nzg5MDU4Mn0.kpkM45hzALxly1EEP86tEP4QfWJS8cOEys4zkSmZVIyU"
    
    return create_client(url, key)

def examine_activities_table():
    """Examine the activities table to understand the data structure"""
    try:
        supabase = get_supabase_client()
        print("🔍 Connecting to Supabase database...")
        
        # Check table structure
        print("\n📋 Table Structure:")
        result = supabase.table('activities').select('*').limit(1).execute()
        if result.data:
            sample = result.data[0]
            print(f"Available columns: {list(sample.keys())}")
        
        # Check recent posts
        print("\n📝 Recent Posts Analysis:")
        posts = supabase.table('activities').select('*').order('created_at', desc=True).limit(10).execute()
        
        if not posts.data:
            print("❌ No activities found in the database")
            return
        
        total_posts = len(posts.data)
        posts_with_text = 0
        posts_with_images = 0
        posts_with_data = 0
        
        print(f"\n📊 Found {total_posts} recent activities:")
        
        for i, post in enumerate(posts.data):
            print(f"\n--- Post {i+1} ---")
            print(f"ID: {post.get('id', 'N/A')}")
            print(f"Activity Type: {post.get('activity_type', 'N/A')}")
            print(f"Content Type: {post.get('content_type', 'N/A')}")
            print(f"Text: {post.get('text', 'N/A')}")
            print(f"Image URL: {post.get('image_url', 'N/A')}")
            print(f"Data JSONB: {post.get('data', 'N/A')}")
            print(f"Created: {post.get('created_at', 'N/A')}")
            
            # Count posts with content
            if post.get('text') and post.get('text').strip():
                posts_with_text += 1
            if post.get('image_url') and post.get('image_url').strip():
                posts_with_images += 1
            if post.get('data') and post.get('data') != {}:
                posts_with_data += 1
        
        print(f"\n📈 Summary:")
        print(f"Total posts examined: {total_posts}")
        print(f"Posts with text: {posts_with_text}")
        print(f"Posts with images: {posts_with_images}")
        print(f"Posts with data JSONB: {posts_with_data}")
        
        # Check for posts with specific activity types
        print(f"\n🔍 Checking for post-related activities:")
        post_activities = supabase.table('activities').select('*').ilike('activity_type', '%post%').execute()
        print(f"Found {len(post_activities.data)} activities with 'post' in activity_type")
        
        # Check for posts with content_type
        content_type_posts = supabase.table('activities').select('*').not_.is_('content_type', 'null').execute()
        print(f"Found {len(content_type_posts.data)} activities with content_type set")
        
    except Exception as e:
        print(f"❌ Error examining database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting posts data examination...")
    examine_activities_table()
    print("\n✅ Examination complete!")
