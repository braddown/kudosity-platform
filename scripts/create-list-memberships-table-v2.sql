-- Create list_memberships table for tracking contact-list relationships
-- First, ensure we have the required tables
DO $$ 
BEGIN
    -- Check if lists table exists, if not create a basic version
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lists') THEN
        CREATE TABLE lists (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            creator_id UUID,
            type VARCHAR(50) DEFAULT 'Manual',
            source VARCHAR(50) DEFAULT 'Manual',
            contact_count INTEGER DEFAULT 0,
            shared BOOLEAN DEFAULT FALSE,
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Check if contacts table exists, if not create a basic version
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        CREATE TABLE contacts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255),
            phone VARCHAR(50),
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Now create the list_memberships table
CREATE TABLE IF NOT EXISTS list_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL,
    contact_id UUID NOT NULL,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique contact-list combinations
    UNIQUE(list_id, contact_id)
);

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
    -- Add foreign key to lists table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lists') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'list_memberships_list_id_fkey'
        ) THEN
            ALTER TABLE list_memberships 
            ADD CONSTRAINT list_memberships_list_id_fkey 
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to contacts table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'list_memberships_contact_id_fkey'
        ) THEN
            ALTER TABLE list_memberships 
            ADD CONSTRAINT list_memberships_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_list_memberships_list_id ON list_memberships(list_id);
CREATE INDEX IF NOT EXISTS idx_list_memberships_contact_id ON list_memberships(contact_id);
CREATE INDEX IF NOT EXISTS idx_list_memberships_status ON list_memberships(status);
CREATE INDEX IF NOT EXISTS idx_list_memberships_date_added ON list_memberships(date_added);

-- Create function to update contact count when memberships change
CREATE OR REPLACE FUNCTION update_list_contact_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact count for the affected list
    IF TG_OP = 'DELETE' THEN
        UPDATE lists 
        SET contact_count = (
            SELECT COUNT(*) 
            FROM list_memberships 
            WHERE list_id = OLD.list_id 
            AND status = 'Active'
        ),
        updated_at = NOW()
        WHERE id = OLD.list_id;
        RETURN OLD;
    ELSE
        UPDATE lists 
        SET contact_count = (
            SELECT COUNT(*) 
            FROM list_memberships 
            WHERE list_id = NEW.list_id 
            AND status = 'Active'
        ),
        updated_at = NOW()
        WHERE id = NEW.list_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update contact counts
DROP TRIGGER IF EXISTS trigger_update_list_contact_count_insert ON list_memberships;
CREATE TRIGGER trigger_update_list_contact_count_insert
    AFTER INSERT ON list_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_list_contact_count();

DROP TRIGGER IF EXISTS trigger_update_list_contact_count_update ON list_memberships;
CREATE TRIGGER trigger_update_list_contact_count_update
    AFTER UPDATE ON list_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_list_contact_count();

DROP TRIGGER IF EXISTS trigger_update_list_contact_count_delete ON list_memberships;
CREATE TRIGGER trigger_update_list_contact_count_delete
    AFTER DELETE ON list_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_list_contact_count();

-- Insert system lists if they don't exist
DO $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Insert system lists
    INSERT INTO lists (name, description, creator_id, type, source, contact_count, shared, tags)
    SELECT 
        'Suppressed',
        'Contacts that are suppressed from all communications',
        system_user_id,
        'System',
        'System',
        0,
        true,
        ARRAY['system', 'suppressed']
    WHERE NOT EXISTS (SELECT 1 FROM lists WHERE name = 'Suppressed' AND type = 'System');

    INSERT INTO lists (name, description, creator_id, type, source, contact_count, shared, tags)
    SELECT 
        'Unsubscribed',
        'Contacts that have unsubscribed from marketing communications',
        system_user_id,
        'System',
        'System',
        0,
        true,
        ARRAY['system', 'unsubscribed']
    WHERE NOT EXISTS (SELECT 1 FROM lists WHERE name = 'Unsubscribed' AND type = 'System');

    INSERT INTO lists (name, description, creator_id, type, source, contact_count, shared, tags)
    SELECT 
        'Wrong Number',
        'Contacts with invalid or wrong phone numbers',
        system_user_id,
        'System',
        'System',
        0,
        true,
        ARRAY['system', 'wrong-number']
    WHERE NOT EXISTS (SELECT 1 FROM lists WHERE name = 'Wrong Number' AND type = 'System');

    INSERT INTO lists (name, description, creator_id, type, source, contact_count, shared, tags)
    SELECT 
        'Test List',
        'Test contacts for campaign testing',
        system_user_id,
        'System',
        'System',
        0,
        true,
        ARRAY['system', 'test']
    WHERE NOT EXISTS (SELECT 1 FROM lists WHERE name = 'Test List' AND type = 'System');

    INSERT INTO lists (name, description, creator_id, type, source, contact_count, shared, tags)
    SELECT 
        'Operators',
        'System operators and admin contacts',
        system_user_id,
        'System',
        'System',
        0,
        true,
        ARRAY['system', 'operators']
    WHERE NOT EXISTS (SELECT 1 FROM lists WHERE name = 'Operators' AND type = 'System');
END $$;
