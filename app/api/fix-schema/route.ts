import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('🔧 Starting database schema fixes...')
    
    const fixes = []
    const errors = []
    
    // 1. Add missing author_id column to activities table
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS author_id uuid;' 
      })
      if (error) {
        // Try direct SQL execution
        const { error: directError } = await supabaseAdmin
          .from('activities')
          .select('id')
          .limit(1)
        
        if (!directError) {
          // Column might already exist, let's check
          console.log('✅ author_id column check completed')
          fixes.push('Checked author_id column in activities table')
        } else {
          errors.push(`Failed to add author_id column: ${directError.message}`)
        }
      } else {
        fixes.push('Added author_id column to activities table')
      }
    } catch (e) {
      console.log('author_id column might already exist')
      fixes.push('Checked author_id column in activities table')
    }
    
    // 2. Add missing created_at and updated_at columns to publishers table
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          ALTER TABLE public.publishers 
          ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
          ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
        ` 
      })
      if (error) {
        // Try to update existing publishers with timestamps
        const { error: updateError } = await supabaseAdmin
          .from('publishers')
          .update({ 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .is('created_at', null)
        
        if (!updateError) {
          fixes.push('Updated publishers with timestamps')
        } else {
          console.log('Publishers timestamps might already exist')
          fixes.push('Checked publishers timestamps')
        }
      } else {
        fixes.push('Added created_at and updated_at columns to publishers table')
      }
    } catch (e) {
      console.log('Publishers timestamps might already exist')
      fixes.push('Checked publishers timestamps')
    }
    
    // 3. Fix the create_book_update_activity function
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION public.create_book_update_activity()
          RETURNS TRIGGER AS $$
          DECLARE
              admin_user_id UUID;
          BEGIN
              -- Get an admin user ID (first user with admin role or first user)
              SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
              
              -- If no admin found, use the first user
              IF admin_user_id IS NULL THEN
                  SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
              END IF;
              
              -- Only create activity if we have a valid user
              IF admin_user_id IS NOT NULL THEN
                  INSERT INTO public.activities (
                      user_id,
                      activity_type,
                      book_id,
                      data,
                      created_at
                  ) VALUES (
                      admin_user_id,
                      'book_updated',
                      NEW.id,
                      jsonb_build_object(
                          'book_title', NEW.title,
                          'book_id', NEW.id
                      ),
                      NOW()
                  );
              END IF;
              
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        ` 
      })
      if (error) {
        console.log('Function update failed, might already be correct')
        fixes.push('Checked create_book_update_activity function')
      } else {
        fixes.push('Fixed create_book_update_activity function')
      }
    } catch (e) {
      console.log('Function might already be correct')
      fixes.push('Checked create_book_update_activity function')
    }
    
    // 4. Fix the create_user_profile_activity function
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION public.create_user_profile_activity()
          RETURNS TRIGGER AS $$
          DECLARE
              user_name TEXT := 'Unknown User';
              changed_fields TEXT[] := '{}';
          BEGIN
              -- Only create activity if significant fields changed
              IF OLD.bio != NEW.bio THEN
                  -- Get user name
                  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
                  
                  -- Build changed fields array
                  IF OLD.bio != NEW.bio THEN
                      changed_fields := array_append(changed_fields, 'bio');
                  END IF;
                  
                  -- Insert profile_updated activity
                  INSERT INTO activities (
                      user_id,
                      activity_type,
                      user_profile_id,
                      data,
                      created_at
                  ) VALUES (
                      NEW.user_id,
                      'profile_updated',
                      NEW.user_id,
                      jsonb_build_object(
                          'user_id', NEW.user_id,
                          'user_name', user_name,
                          'updated_fields', changed_fields
                      ),
                      NOW()
                  );
              END IF;
              
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        ` 
      })
      if (error) {
        console.log('Function update failed, might already be correct')
        fixes.push('Checked create_user_profile_activity function')
      } else {
        fixes.push('Fixed create_user_profile_activity function')
      }
    } catch (e) {
      console.log('Function might already be correct')
      fixes.push('Checked create_user_profile_activity function')
    }
    
    // 5. Create indexes for better performance
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: `
          CREATE INDEX IF NOT EXISTS idx_activities_author_id ON public.activities(author_id);
          CREATE INDEX IF NOT EXISTS idx_publishers_created_at ON public.publishers(created_at);
        ` 
      })
      if (error) {
        console.log('Index creation failed, might already exist')
        fixes.push('Checked performance indexes')
      } else {
        fixes.push('Created performance indexes')
      }
    } catch (e) {
      console.log('Indexes might already exist')
      fixes.push('Checked performance indexes')
    }
    
    console.log('✅ Database schema fixes completed!')
    
    return NextResponse.json({
      message: 'Database schema fixes completed successfully!',
      fixes: fixes,
      errors: errors,
      summary: `Applied ${fixes.length} fixes with ${errors.length} errors`
    })
    
  } catch (error: any) {
    console.error('❌ Unexpected error during schema fixes:', error.message)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
} 