-- Create function to handle new author activities
CREATE OR REPLACE FUNCTION create_author_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID (first user with admin role)
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert author_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    author_id,
    data,
    created_at
  ) VALUES (
    admin_user_id,
    'author_created',
    NEW.id,
    jsonb_build_object(
      'author_id', NEW.id,
      'author_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new authors
CREATE OR REPLACE TRIGGER author_created_trigger
AFTER INSERT ON authors
FOR EACH ROW
EXECUTE FUNCTION create_author_activity();

-- Create function to handle author updates
CREATE OR REPLACE FUNCTION update_author_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  changed_fields TEXT[] := '{}';
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.bio != NEW.bio OR OLD.author_image_id != NEW.author_image_id THEN
    -- Get an admin user ID
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.bio != NEW.bio THEN
      changed_fields := array_append(changed_fields, 'bio');
    END IF;
    
    IF OLD.author_image_id != NEW.author_image_id THEN
      changed_fields := array_append(changed_fields, 'image');
    END IF;
    
    -- Insert author_profile_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      author_id,
      data,
      created_at
    ) VALUES (
      admin_user_id,
      'author_profile_updated',
      NEW.id,
      jsonb_build_object(
        'author_id', NEW.id,
        'author_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for author updates
CREATE OR REPLACE TRIGGER author_updated_trigger
AFTER UPDATE ON authors
FOR EACH ROW
EXECUTE FUNCTION update_author_activity();

-- Create function to handle new book activities
CREATE OR REPLACE FUNCTION create_book_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  author_name TEXT := 'Unknown Author';
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
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

-- Create trigger for new books
CREATE OR REPLACE TRIGGER book_created_trigger
AFTER INSERT ON books
FOR EACH ROW
EXECUTE FUNCTION create_book_activity();

-- Create function to handle publisher activities
CREATE OR REPLACE FUNCTION create_publisher_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get an admin user ID
  SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
  END IF;
  
  -- Insert publisher_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    publisher_id,
    data,
    created_at
  ) VALUES (
    admin_user_id,
    'publisher_created',
    NEW.id,
    jsonb_build_object(
      'publisher_id', NEW.id,
      'publisher_name', NEW.name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new publishers
CREATE OR REPLACE TRIGGER publisher_created_trigger
AFTER INSERT ON publishers
FOR EACH ROW
EXECUTE FUNCTION create_publisher_activity();

-- Create function to handle publisher updates
CREATE OR REPLACE FUNCTION update_publisher_activity()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  changed_fields TEXT[] := '{}';
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.about != NEW.about OR OLD.publisher_image_id != NEW.publisher_image_id THEN
    -- Get an admin user ID
    SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- If no admin found, use the first user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.about != NEW.about THEN
      changed_fields := array_append(changed_fields, 'about');
    END IF;
    
    IF OLD.publisher_image_id != NEW.publisher_image_id THEN
      changed_fields := array_append(changed_fields, 'image');
    END IF;
    
    -- Insert publisher_profile_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      publisher_id,
      data,
      created_at
    ) VALUES (
      admin_user_id,
      'publisher_updated',
      NEW.id,
      jsonb_build_object(
        'publisher_id', NEW.id,
        'publisher_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for publisher updates
CREATE OR REPLACE TRIGGER publisher_updated_trigger
AFTER UPDATE ON publishers
FOR EACH ROW
EXECUTE FUNCTION update_publisher_activity();

-- Create function to handle user profile activities
CREATE OR REPLACE FUNCTION create_user_profile_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT := 'Unknown User';
BEGIN
  -- Get user name if available
  SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
  
  -- Insert profile_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    user_profile_id,
    data,
    created_at
  ) VALUES (
    NEW.user_id,
    'profile_created',
    NEW.user_id,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'user_name', user_name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user profiles
CREATE OR REPLACE TRIGGER user_profile_created_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_user_profile_activity();

-- Create function to handle user profile updates
CREATE OR REPLACE FUNCTION update_user_profile_activity()
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

-- Create trigger for user profile updates
CREATE OR REPLACE TRIGGER user_profile_updated_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profile_activity();

-- Create function to handle group activities
CREATE OR REPLACE FUNCTION create_group_activity()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT := 'Unknown User';
BEGIN
  -- Get creator name if available
  IF NEW.created_by IS NOT NULL THEN
    SELECT name INTO creator_name FROM users WHERE id = NEW.created_by;
  END IF;
  
  -- Insert group_created activity
  INSERT INTO activities (
    user_id,
    activity_type,
    group_id,
    data,
    created_at
  ) VALUES (
    NEW.created_by,
    'group_created',
    NEW.id,
    jsonb_build_object(
      'group_id', NEW.id,
      'group_name', NEW.name,
      'creator_id', NEW.created_by,
      'creator_name', creator_name
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new groups
CREATE OR REPLACE TRIGGER group_created_trigger
AFTER INSERT ON groups
FOR EACH ROW
EXECUTE FUNCTION create_group_activity();

-- Create function to handle group updates
CREATE OR REPLACE FUNCTION update_group_activity()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  admin_user_id UUID;
BEGIN
  -- Only create activity if significant fields changed
  IF OLD.name != NEW.name OR OLD.description != NEW.description THEN
    -- Get an admin user ID if needed
    IF NEW.created_by IS NULL THEN
      SELECT user_id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
      
      -- If no admin found, use the first user
      IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users ORDER BY created_at LIMIT 1;
      END IF;
    END IF;
    
    -- Build changed fields array
    IF OLD.name != NEW.name THEN
      changed_fields := array_append(changed_fields, 'name');
    END IF;
    
    IF OLD.description != NEW.description THEN
      changed_fields := array_append(changed_fields, 'description');
    END IF;
    
    -- Insert group_updated activity
    INSERT INTO activities (
      user_id,
      activity_type,
      group_id,
      data,
      created_at
    ) VALUES (
      COALESCE(NEW.created_by, admin_user_id),
      'group_updated',
      NEW.id,
      jsonb_build_object(
        'group_id', NEW.id,
        'group_name', NEW.name,
        'updated_fields', changed_fields
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for group updates
CREATE OR REPLACE TRIGGER group_updated_trigger
AFTER UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_group_activity(); 