-- Create a table to store custom field definitions
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'string',
  required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the key for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_key ON custom_field_definitions(key);

-- Insert some default custom fields if they don't exist
INSERT INTO custom_field_definitions (key, label, type, required, description) 
VALUES 
  ('company', 'Company', 'string', false, 'Company or organization name'),
  ('job_title', 'Job Title', 'string', false, 'Job title or position'),
  ('notes', 'Notes', 'textarea', false, 'Additional notes about this contact'),
  ('lead_score', 'Lead Score', 'number', false, 'Lead scoring value'),
  ('is_vip', 'VIP Customer', 'boolean', false, 'Mark as VIP customer')
ON CONFLICT (key) DO NOTHING;
