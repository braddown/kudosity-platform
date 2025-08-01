-- Drop the table if it exists to ensure clean creation
DROP TABLE IF EXISTS custom_field_definitions;

-- Create the custom field definitions table
CREATE TABLE custom_field_definitions (
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

-- Create indexes for better performance
CREATE INDEX idx_custom_field_definitions_key ON custom_field_definitions(key);
CREATE INDEX idx_custom_field_definitions_created_at ON custom_field_definitions(created_at);

-- Insert default custom fields
INSERT INTO custom_field_definitions (key, label, type, required, description) VALUES
  ('company', 'Company', 'string', false, 'Company or organization name'),
  ('job_title', 'Job Title', 'string', false, 'Job title or position'),
  ('notes', 'Notes', 'textarea', false, 'Additional notes about this contact'),
  ('lead_score', 'Lead Score', 'number', false, 'Lead scoring value'),
  ('is_vip', 'VIP Customer', 'boolean', false, 'Mark as VIP customer'),
  ('contact_source', 'Contact Source', 'string', false, 'How this contact was acquired'),
  ('industry', 'Industry', 'string', false, 'Industry or business sector'),
  ('website', 'Website', 'url', false, 'Company or personal website'),
  ('linkedin', 'LinkedIn Profile', 'url', false, 'LinkedIn profile URL'),
  ('last_contact_date', 'Last Contact Date', 'date', false, 'Date of last contact');

-- Verify the table was created successfully
SELECT 'Table created successfully' as status, count(*) as default_fields_count 
FROM custom_field_definitions;
