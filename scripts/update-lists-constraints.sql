-- First, let's see what the current constraint allows and update it
-- Drop the existing constraint if it exists
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_type_check;

-- Add a new constraint that includes our system types
ALTER TABLE lists ADD CONSTRAINT lists_type_check 
CHECK (type IN ('Manual', 'System', 'Upload', 'Segment', 'Dynamic', 'Static'));

-- Also ensure the source field allows our values
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_source_check;
ALTER TABLE lists ADD CONSTRAINT lists_source_check 
CHECK (source IN ('Manual', 'System', 'CSV Upload', 'API', 'Import', 'Segment'));

-- Update any existing lists that might have incompatible types
UPDATE lists SET type = 'Manual' WHERE type IS NULL OR type NOT IN ('Manual', 'System', 'Upload', 'Segment', 'Dynamic', 'Static');
UPDATE lists SET source = 'Manual' WHERE source IS NULL OR source NOT IN ('Manual', 'System', 'CSV Upload', 'API', 'Import', 'Segment');
