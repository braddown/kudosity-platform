-- Update segments table to match the expected schema
ALTER TABLE segments 
ADD COLUMN IF NOT EXISTS tag VARCHAR(100),
ADD COLUMN IF NOT EXISTS creator_id UUID,
ADD COLUMN IF NOT EXISTS filter_criteria JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Custom',
ADD COLUMN IF NOT EXISTS shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update existing columns if they exist but have different types
DO $$ 
BEGIN
    -- Check if filters column exists and rename it to filter_criteria
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'segments' AND column_name = 'filters') THEN
        ALTER TABLE segments RENAME COLUMN filters TO filter_criteria;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN
        -- Column already exists, do nothing
        NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_segments_tag ON segments(tag);
CREATE INDEX IF NOT EXISTS idx_segments_type ON segments(type);
CREATE INDEX IF NOT EXISTS idx_segments_creator_id ON segments(creator_id);
CREATE INDEX IF NOT EXISTS idx_segments_auto_update ON segments(auto_update);

-- Update the updated_at trigger if it doesn't exist
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
