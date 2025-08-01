-- Update lists table constraints safely
DO $$
BEGIN
    -- First ensure the lists table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lists') THEN
        RAISE NOTICE 'Lists table does not exist, skipping constraint updates';
        RETURN;
    END IF;

    -- Drop existing constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'lists' AND constraint_name = 'lists_type_check'
    ) THEN
        ALTER TABLE lists DROP CONSTRAINT lists_type_check;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'lists' AND constraint_name = 'lists_source_check'
    ) THEN
        ALTER TABLE lists DROP CONSTRAINT lists_source_check;
    END IF;

    -- Add new constraints
    ALTER TABLE lists ADD CONSTRAINT lists_type_check 
    CHECK (type IN ('Manual', 'System', 'Upload', 'Segment', 'Dynamic', 'Static'));

    ALTER TABLE lists ADD CONSTRAINT lists_source_check 
    CHECK (source IN ('Manual', 'System', 'CSV Upload', 'API', 'Import', 'Segment'));

    -- Update any existing lists that might have incompatible types
    UPDATE lists SET type = 'Manual' WHERE type IS NULL OR type NOT IN ('Manual', 'System', 'Upload', 'Segment', 'Dynamic', 'Static');
    UPDATE lists SET source = 'Manual' WHERE source IS NULL OR source NOT IN ('Manual', 'System', 'CSV Upload', 'API', 'Import', 'Segment');

    RAISE NOTICE 'Lists table constraints updated successfully';
END $$;
