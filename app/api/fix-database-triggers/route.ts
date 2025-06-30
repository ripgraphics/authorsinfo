import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // SQL script to fix the role column error
    const sqlScript = `
      -- Drop all existing triggers that might be causing issues
      DROP TRIGGER IF EXISTS create_book_activity ON books;
      DROP TRIGGER IF EXISTS update_book_activity ON books;
      DROP TRIGGER IF EXISTS create_author_activity ON authors;
      DROP TRIGGER IF EXISTS update_author_activity ON authors;

      -- Drop the functions that reference non-existent role columns
      DROP FUNCTION IF EXISTS create_book_activity();
      DROP FUNCTION IF EXISTS update_book_activity();
      DROP FUNCTION IF EXISTS create_author_activity();
      DROP FUNCTION IF EXISTS update_author_activity();

      -- Create a new function for book activities that doesn't reference any role columns
      CREATE OR REPLACE FUNCTION create_book_activity()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_user_id UUID;
        author_name TEXT := 'Unknown Author';
      BEGIN
        -- Get the first user as admin (since we don't have role-based access)
        SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at LIMIT 1;
        
        -- Get author name if available
        IF NEW.author_id IS NOT NULL THEN
          SELECT name INTO author_name FROM authors WHERE id = NEW.author_id;
        END IF;
        
        -- Insert book_added activity
        INSERT INTO activities (
          user_id,
          activity_type,
          book_id,
          author_id,
          data,
          created_at
        ) VALUES (
          admin_user_id,
          'book_added',
          NEW.id,
          NEW.author_id,
          jsonb_build_object(
            'book_title', NEW.title,
            'book_author', author_name,
            'author_id', NEW.author_id,
            'author_name', author_name
          ),
          NEW.created_at
        );
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create a new function for updating book activities
      CREATE OR REPLACE FUNCTION update_book_activity()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_user_id UUID;
      BEGIN
        -- Get the first user as admin
        SELECT id INTO admin_user_id FROM auth.users ORDER BY created_at LIMIT 1;
        
        -- Only create activity if significant fields changed
        IF OLD.title != NEW.title OR OLD.author_id != NEW.author_id OR OLD.publisher_id != NEW.publisher_id THEN
          INSERT INTO activities (
            user_id,
            activity_type,
            book_id,
            author_id,
            data,
            created_at
          ) VALUES (
            admin_user_id,
            'book_updated',
            NEW.id,
            NEW.author_id,
            jsonb_build_object(
              'book_title', NEW.title,
              'book_id', NEW.id,
              'old_title', OLD.title,
              'old_author_id', OLD.author_id,
              'old_publisher_id', OLD.publisher_id
            ),
            NOW()
          );
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Recreate the triggers
      CREATE TRIGGER create_book_activity
        AFTER INSERT ON books
        FOR EACH ROW
        EXECUTE FUNCTION create_book_activity();

      CREATE TRIGGER update_book_activity
        AFTER UPDATE ON books
        FOR EACH ROW
        EXECUTE FUNCTION update_book_activity();
    `

    // Execute the SQL script
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlScript })

    if (error) {
      console.error('Error executing SQL:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database triggers fixed successfully' 
    })

  } catch (error) {
    console.error('Error fixing database triggers:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fix database triggers' 
    }, { status: 500 })
  }
} 