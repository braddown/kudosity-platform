-- SQL functions to manage custom fields across all profiles

-- Function to add a custom field to all existing profiles
CREATE OR REPLACE FUNCTION add_custom_field_to_all_profiles(
  field_key TEXT,
  default_value TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update all profiles to include the new custom field
  UPDATE profiles 
  SET custom_fields = COALESCE(custom_fields, '{}'::jsonb) || 
                     jsonb_build_object(field_key, default_value)
  WHERE custom_fields IS NULL OR NOT custom_fields ? field_key;
END;
$$ LANGUAGE plpgsql;

-- Function to rename a custom field in all profiles
CREATE OR REPLACE FUNCTION rename_custom_field_in_all_profiles(
  old_key TEXT,
  new_key TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update all profiles to rename the custom field
  UPDATE profiles 
  SET custom_fields = (custom_fields - old_key) || 
                     jsonb_build_object(new_key, custom_fields->old_key)
  WHERE custom_fields ? old_key;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a custom field from all profiles
CREATE OR REPLACE FUNCTION remove_custom_field_from_all_profiles(
  field_key TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Remove the field from all profiles
  UPDATE profiles 
  SET custom_fields = custom_fields - field_key
  WHERE custom_fields ? field_key;
END;
$$ LANGUAGE plpgsql;

-- Function to get custom fields schema from existing data
CREATE OR REPLACE FUNCTION get_custom_fields_schema()
RETURNS TABLE(
  field_key TEXT,
  field_type TEXT,
  sample_value TEXT,
  usage_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH field_analysis AS (
    SELECT 
      key as field_key,
      CASE 
        WHEN jsonb_typeof(value) = 'string' THEN 'string'
        WHEN jsonb_typeof(value) = 'number' THEN 'number'
        WHEN jsonb_typeof(value) = 'boolean' THEN 'boolean'
        ELSE 'string'
      END as field_type,
      value #>> '{}' as sample_value
    FROM profiles,
    LATERAL jsonb_each(COALESCE(custom_fields, '{}'::jsonb))
    WHERE custom_fields IS NOT NULL
  )
  SELECT 
    fa.field_key,
    fa.field_type,
    fa.sample_value,
    COUNT(*) as usage_count
  FROM field_analysis fa
  GROUP BY fa.field_key, fa.field_type, fa.sample_value
  ORDER BY fa.field_key;
END;
$$ LANGUAGE plpgsql;
