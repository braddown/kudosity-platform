-- Create list_memberships table for tracking contact-list relationships
CREATE TABLE IF NOT EXISTS list_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES contacts(id),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique contact-list combinations
    UNIQUE(list_id, contact_id)
);

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
    UPDATE lists 
    SET contact_count = (
        SELECT COUNT(*) 
        FROM list_memberships 
        WHERE list_id = COALESCE(NEW.list_id, OLD.list_id) 
        AND status = 'Active'
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.list_id, OLD.list_id);
    
    RETURN COALESCE(NEW, OLD);
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
-- First, get a valid user ID or use a system UUID
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Try to get the first user's ID, or use a system UUID
    SELECT id INTO system_user_id FROM profiles LIMIT 1;
    
    -- If no users exist, use a system UUID
    IF system_user_id IS NULL THEN
        system_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

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

-- Insert some sample data for testing (optional)
-- Note: This assumes you have existing lists and contacts
/*
INSERT INTO list_memberships (list_id, contact_id, added_by, status) 
SELECT 
    l.id as list_id,
    c.id as contact_id,
    c.id as added_by,
    'Active' as status
FROM lists l
CROSS JOIN contacts c
WHERE l.name = 'Test List'
AND c.email LIKE '%test%'
LIMIT 5;
*/
