-- Create segments table with all required columns
CREATE TABLE IF NOT EXISTS segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id UUID,
  filter_criteria JSONB NOT NULL DEFAULT '{}',
  estimated_size INTEGER DEFAULT 0,
  auto_update BOOLEAN DEFAULT TRUE,
  type VARCHAR(50) DEFAULT 'Custom',
  shared BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  tag VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_segments_tag ON segments(tag);
CREATE INDEX IF NOT EXISTS idx_segments_type ON segments(type);
CREATE INDEX IF NOT EXISTS idx_segments_creator_id ON segments(creator_id);
CREATE INDEX IF NOT EXISTS idx_segments_auto_update ON segments(auto_update);
CREATE INDEX IF NOT EXISTS idx_segments_created_at ON segments(created_at);

-- Create updated_at trigger
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
