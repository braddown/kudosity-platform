-- Update segments table to match the expected schema
DO $$
BEGIN
    -- First ensure the segments table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'segments') THEN
        -- Create the segments table if it doesn't exist
        CREATE TABLE segments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created segments table';
    END IF;

    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'tag') THEN
        ALTER TABLE segments ADD COLUMN tag VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'creator_id') THEN
        ALTER TABLE segments ADD COLUMN creator_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'filter_criteria') THEN
        ALTER TABLE segments ADD COLUMN filter_criteria JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'estimated_size') THEN
        ALTER TABLE segments ADD COLUMN estimated_size INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'auto_update') THEN
        ALTER TABLE segments ADD COLUMN auto_update BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'type') THEN
        ALTER TABLE segments ADD COLUMN type VARCHAR(50) DEFAULT 'Custom';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'shared') THEN
        ALTER TABLE segments ADD COLUMN shared BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'tags') THEN
        ALTER TABLE segments ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- Handle the filters to filter_criteria rename
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'filters') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'filter_criteria') THEN
        ALTER TABLE segments RENAME COLUMN filters TO filter_criteria;
    END IF;

    RAISE NOTICE 'Segments table updated successfully';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_segments_tag ON segments(tag);
CREATE INDEX IF NOT EXISTS idx_segments_type ON segments(type);
CREATE INDEX IF NOT EXISTS idx_segments_creator_id ON segments(creator_id);
CREATE INDEX IF NOT EXISTS idx_segments_auto_update ON segments(auto_update);

-- Create or update the updated_at trigger
CREATE OR REPLACE FUNCTION update_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_segments_updated_at ON segments;
CREATE TRIGGER update_segments_updated_at 
    BEFORE UPDATE ON segments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_segments_updated_at();
