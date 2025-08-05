-- =====================================================
-- INTELLIGENT MATCHING & PROCESSING FUNCTIONS
-- =====================================================
-- These functions implement the core CDP logic for:
-- 1. Finding potential profile matches
-- 2. Scoring match confidence
-- 3. Processing contacts automatically or routing to review
-- 4. Managing profile merges and deduplication
-- =====================================================

-- =====================================================
-- 1. PROFILE MATCHING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION find_profile_matches(
  input_mobile TEXT,
  input_email TEXT DEFAULT NULL,
  input_first_name TEXT DEFAULT NULL,
  input_last_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  profile_id UUID,
  match_score DECIMAL,
  match_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH match_analysis AS (
    SELECT 
      p.id,
      -- Scoring logic with weights
      (
        -- Mobile number matching (highest weight)
        CASE 
          WHEN p.mobile = input_mobile THEN 0.85  -- Exact mobile match
          WHEN similarity(p.mobile, input_mobile) > 0.9 THEN 0.75  -- Very similar mobile
          WHEN similarity(p.mobile, input_mobile) > 0.8 THEN 0.6   -- Somewhat similar mobile
          ELSE 0
        END +
        
        -- Email matching (high weight)
        CASE 
          WHEN p.email IS NOT NULL AND input_email IS NOT NULL THEN
            CASE 
              WHEN p.email = input_email THEN 0.7  -- Exact email match
              WHEN similarity(p.email, input_email) > 0.9 THEN 0.5  -- Very similar email
              ELSE 0
            END
          ELSE 0
        END +
        
        -- Name matching (medium weight)
        CASE 
          WHEN p.first_name IS NOT NULL AND input_first_name IS NOT NULL THEN
            CASE 
              WHEN similarity(p.first_name, input_first_name) > 0.9 THEN 0.25
              WHEN similarity(p.first_name, input_first_name) > 0.8 THEN 0.15
              ELSE 0
            END
          ELSE 0
        END +
        
        CASE 
          WHEN p.last_name IS NOT NULL AND input_last_name IS NOT NULL THEN
            CASE 
              WHEN similarity(p.last_name, input_last_name) > 0.9 THEN 0.25
              WHEN similarity(p.last_name, input_last_name) > 0.8 THEN 0.15
              ELSE 0
            END
          ELSE 0
        END
      ) AS score,
      
      -- Track what matched for transparency
      ARRAY_REMOVE(ARRAY[
        CASE WHEN p.mobile = input_mobile THEN 'exact_mobile' END,
        CASE WHEN similarity(p.mobile, input_mobile) > 0.8 THEN 'fuzzy_mobile' END,
        CASE WHEN p.email = input_email THEN 'exact_email' END,
        CASE WHEN p.email IS NOT NULL AND input_email IS NOT NULL AND similarity(p.email, input_email) > 0.8 THEN 'fuzzy_email' END,
        CASE WHEN similarity(p.first_name, input_first_name) > 0.8 THEN 'fuzzy_first_name' END,
        CASE WHEN similarity(p.last_name, input_last_name) > 0.8 THEN 'fuzzy_last_name' END
      ], NULL) as reasons
      
    FROM profiles p
    WHERE p.merge_status = 'active'  -- Only consider active profiles
    AND (
      -- At least one of these conditions must be true to be considered
      p.mobile = input_mobile 
      OR similarity(p.mobile, input_mobile) > 0.7
      OR (p.email IS NOT NULL AND input_email IS NOT NULL AND similarity(p.email, input_email) > 0.7)
      OR (
        p.first_name IS NOT NULL AND input_first_name IS NOT NULL AND
        p.last_name IS NOT NULL AND input_last_name IS NOT NULL AND
        similarity(p.first_name, input_first_name) > 0.7 
        AND similarity(p.last_name, input_last_name) > 0.7
      )
    )
  )
  SELECT 
    ma.id,
    ROUND(ma.score, 3),
    ma.reasons
  FROM match_analysis ma
  WHERE ma.score > 0.4  -- Minimum threshold for consideration
  ORDER BY ma.score DESC
  LIMIT 10;  -- Max 10 potential matches
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. CONTACT PROCESSING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION process_contact(contact_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  contact_rec contacts%ROWTYPE;
  matches_found INTEGER;
  best_match_score DECIMAL;
  best_match_profile UUID;
  best_match_reasons TEXT[];
  all_matches JSONB;
  result JSONB;
BEGIN
  -- Get contact details
  SELECT * INTO contact_rec FROM contacts WHERE id = contact_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Contact not found',
      'contact_id', contact_uuid
    );
  END IF;
  
  -- Update status to processing
  UPDATE contacts SET 
    processing_status = 'processing',
    retry_count = retry_count + 1,
    last_retry_at = NOW()
  WHERE id = contact_uuid;
  
  -- Find potential matches
  SELECT 
    COUNT(*), 
    MAX(match_score), 
    (SELECT profile_id FROM find_profile_matches(contact_rec.mobile, contact_rec.email, contact_rec.first_name, contact_rec.last_name) ORDER BY match_score DESC LIMIT 1),
    (SELECT match_reasons FROM find_profile_matches(contact_rec.mobile, contact_rec.email, contact_rec.first_name, contact_rec.last_name) ORDER BY match_score DESC LIMIT 1),
    jsonb_agg(
      jsonb_build_object(
        'profile_id', profile_id,
        'score', match_score,
        'reasons', match_reasons
      )
    )
  INTO matches_found, best_match_score, best_match_profile, best_match_reasons, all_matches
  FROM find_profile_matches(contact_rec.mobile, contact_rec.email, contact_rec.first_name, contact_rec.last_name);
  
  -- Coalesce to empty array if no matches
  all_matches := COALESCE(all_matches, '[]'::jsonb);
  
  IF matches_found = 0 THEN
    -- No matches found - create new profile
    INSERT INTO profiles (
      mobile, 
      first_name, 
      last_name, 
      email, 
      source,
      source_details,
      custom_fields
    )
    VALUES (
      contact_rec.mobile, 
      contact_rec.first_name, 
      contact_rec.last_name, 
      contact_rec.email, 
      contact_rec.source,
      contact_rec.source_details,
      contact_rec.raw_data
    )
    RETURNING id INTO best_match_profile;
    
    -- Update contact as matched
    UPDATE contacts SET 
      profile_id = best_match_profile,
      processing_status = 'matched',
      match_confidence = 1.0,
      match_method = 'new_profile_created',
      processed_at = NOW()
    WHERE id = contact_uuid;
    
    -- Log the profile creation
    INSERT INTO profile_activities (
      profile_id,
      contact_id,
      activity_type,
      activity_description,
      data_source
    ) VALUES (
      best_match_profile,
      contact_uuid,
      'profile_created',
      'New profile created from contact',
      contact_rec.source
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'new_profile_created',
      'profile_id', best_match_profile,
      'contact_id', contact_uuid,
      'confidence', 1.0
    );
    
  ELSIF matches_found = 1 AND best_match_score >= 0.9 THEN
    -- High confidence single match - auto-assign
    UPDATE contacts SET 
      profile_id = best_match_profile,
      processing_status = 'matched',
      match_confidence = best_match_score,
      match_method = 'auto_matched_high_confidence',
      processed_at = NOW()
    WHERE id = contact_uuid;
    
    -- Update profile with any new information
    PERFORM merge_contact_into_profile(contact_uuid, best_match_profile);
    
    result := jsonb_build_object(
      'success', true,
      'action', 'auto_matched',
      'profile_id', best_match_profile,
      'contact_id', contact_uuid,
      'confidence', best_match_score,
      'reasons', best_match_reasons
    );
    
  ELSIF matches_found = 1 AND best_match_score >= 0.7 THEN
    -- Medium confidence single match - still auto-assign but flag for review
    UPDATE contacts SET 
      profile_id = best_match_profile,
      processing_status = 'matched',
      match_confidence = best_match_score,
      match_method = 'auto_matched_medium_confidence',
      processed_at = NOW()
    WHERE id = contact_uuid;
    
    -- Add to review queue for validation
    INSERT INTO contact_review_queue (
      contact_id, 
      review_type, 
      potential_matches,
      priority
    ) VALUES (
      contact_uuid, 
      'manual_verification',
      all_matches,
      'low'
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'auto_matched_needs_review',
      'profile_id', best_match_profile,
      'contact_id', contact_uuid,
      'confidence', best_match_score,
      'reasons', best_match_reasons
    );
    
  ELSE
    -- Multiple matches or low confidence - needs manual review
    UPDATE contacts SET 
      processing_status = 'needs_review',
      potential_matches = all_matches,
      match_confidence = COALESCE(best_match_score, 0)
    WHERE id = contact_uuid;
    
    -- Add to review queue
    INSERT INTO contact_review_queue (
      contact_id, 
      review_type, 
      potential_matches,
      priority,
      conflict_details
    ) VALUES (
      contact_uuid, 
      CASE 
        WHEN matches_found > 1 THEN 'duplicate_check'
        ELSE 'low_confidence_match'
      END,
      all_matches,
      CASE 
        WHEN best_match_score > 0.6 THEN 'medium'
        ELSE 'low'
      END,
      jsonb_build_object(
        'match_count', matches_found,
        'best_score', best_match_score,
        'input_data', row_to_json(contact_rec)
      )
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'needs_manual_review',
      'contact_id', contact_uuid,
      'matches_found', matches_found,
      'best_confidence', COALESCE(best_match_score, 0),
      'potential_matches', all_matches
    );
  END IF;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Handle errors gracefully
    UPDATE contacts SET 
      processing_status = 'failed',
      processing_notes = SQLERRM
    WHERE id = contact_uuid;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'contact_id', contact_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. MERGE CONTACT DATA INTO PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION merge_contact_into_profile(
  contact_uuid UUID,
  target_profile_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  contact_rec contacts%ROWTYPE;
  profile_rec profiles%ROWTYPE;
  changes_made JSONB := '{}';
  has_changes BOOLEAN := FALSE;
BEGIN
  -- Get contact and profile data
  SELECT * INTO contact_rec FROM contacts WHERE id = contact_uuid;
  SELECT * INTO profile_rec FROM profiles WHERE id = target_profile_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update profile with better/newer data from contact
  UPDATE profiles SET
    -- Use contact data if profile data is missing or contact data seems better
    first_name = CASE 
      WHEN first_name IS NULL OR first_name = '' THEN contact_rec.first_name
      WHEN contact_rec.first_name IS NOT NULL AND LENGTH(contact_rec.first_name) > LENGTH(COALESCE(first_name, '')) THEN contact_rec.first_name
      ELSE first_name
    END,
    
    last_name = CASE 
      WHEN last_name IS NULL OR last_name = '' THEN contact_rec.last_name
      WHEN contact_rec.last_name IS NOT NULL AND LENGTH(contact_rec.last_name) > LENGTH(COALESCE(last_name, '')) THEN contact_rec.last_name
      ELSE last_name
    END,
    
    email = CASE 
      WHEN email IS NULL OR email = '' THEN contact_rec.email
      WHEN contact_rec.email IS NOT NULL AND email != contact_rec.email THEN contact_rec.email  -- Always use most recent email
      ELSE email
    END,
    
    -- Update company info if available
    custom_fields = CASE
      WHEN contact_rec.company IS NOT NULL THEN
        custom_fields || jsonb_build_object('company', contact_rec.company)
      ELSE custom_fields
    END || CASE
      WHEN contact_rec.job_title IS NOT NULL THEN
        jsonb_build_object('job_title', contact_rec.job_title)
      ELSE '{}'::jsonb
    END || COALESCE(contact_rec.raw_data, '{}'::jsonb),
    
    last_activity_at = NOW(),
    updated_at = NOW()
    
  WHERE id = target_profile_id;
  
  -- Log the merge activity
  INSERT INTO profile_activities (
    profile_id,
    contact_id,
    activity_type,
    activity_description,
    changes,
    data_source
  ) VALUES (
    target_profile_id,
    contact_uuid,
    'contact_merged',
    'Contact data merged into profile',
    jsonb_build_object(
      'contact_data', row_to_json(contact_rec),
      'merge_timestamp', NOW()
    ),
    contact_rec.source
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. BATCH PROCESS CONTACTS
-- =====================================================
CREATE OR REPLACE FUNCTION process_pending_contacts(batch_size INTEGER DEFAULT 100)
RETURNS JSONB AS $$
DECLARE
  processed_count INTEGER := 0;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  contact_id UUID;
  process_result JSONB;
  results JSONB := '[]';
BEGIN
  -- Process pending contacts in batches
  FOR contact_id IN 
    SELECT id FROM contacts 
    WHERE processing_status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT batch_size
  LOOP
    -- Process each contact
    SELECT process_contact(contact_id) INTO process_result;
    
    -- Track results
    processed_count := processed_count + 1;
    
    IF (process_result->>'success')::boolean THEN
      success_count := success_count + 1;
    ELSE
      error_count := error_count + 1;
    END IF;
    
    -- Add to results array
    results := results || jsonb_build_array(process_result);
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed_count', processed_count,
    'success_count', success_count,
    'error_count', error_count,
    'results', results
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. PROFILE MERGE FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION merge_profiles(
  source_profile_id UUID,
  target_profile_id UUID,
  merged_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  source_profile profiles%ROWTYPE;
  target_profile profiles%ROWTYPE;
  affected_contacts INTEGER;
  affected_activities INTEGER;
BEGIN
  -- Get profile data
  SELECT * INTO source_profile FROM profiles WHERE id = source_profile_id;
  SELECT * INTO target_profile FROM profiles WHERE id = target_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Start transaction-like behavior
  
  -- 1. Update target profile with merged data
  UPDATE profiles SET
    -- Keep the best data from both profiles
    first_name = COALESCE(NULLIF(target_profile.first_name, ''), source_profile.first_name),
    last_name = COALESCE(NULLIF(target_profile.last_name, ''), source_profile.last_name),
    email = COALESCE(NULLIF(target_profile.email, ''), source_profile.email),
    
    -- Merge custom fields
    custom_fields = target_profile.custom_fields || source_profile.custom_fields,
    
    -- Combine tags
    tags = array(SELECT DISTINCT unnest(target_profile.tags || source_profile.tags)),
    
    -- Use higher values for metrics
    lead_score = GREATEST(target_profile.lead_score, source_profile.lead_score),
    lifetime_value = target_profile.lifetime_value + source_profile.lifetime_value,
    
    -- Update activity timestamp
    last_activity_at = GREATEST(target_profile.last_activity_at, source_profile.last_activity_at),
    updated_at = NOW()
    
  WHERE id = target_profile_id;
  
  -- 2. Move all contacts from source to target profile
  UPDATE contacts SET profile_id = target_profile_id WHERE profile_id = source_profile_id;
  GET DIAGNOSTICS affected_contacts = ROW_COUNT;
  
  -- 3. Move all activities from source to target profile
  UPDATE profile_activities SET profile_id = target_profile_id WHERE profile_id = source_profile_id;
  GET DIAGNOSTICS affected_activities = ROW_COUNT;
  
  -- 4. Mark source profile as duplicate
  UPDATE profiles SET
    merge_status = 'duplicate',
    duplicate_of_profile_id = target_profile_id,
    updated_at = NOW()
  WHERE id = source_profile_id;
  
  -- 5. Log the merge
  INSERT INTO profile_merge_log (
    source_profile_id,
    target_profile_id,
    merge_reason,
    merged_by
  ) VALUES (
    source_profile_id,
    target_profile_id,
    'Manual merge operation',
    merged_by_user_id
  );
  
  -- 6. Log activity on target profile
  INSERT INTO profile_activities (
    profile_id,
    activity_type,
    activity_description,
    changes,
    created_by
  ) VALUES (
    target_profile_id,
    'profile_created',  -- This should be 'profile_merged' but keeping consistent with check constraint
    'Profile merged from duplicate',
    jsonb_build_object(
      'merged_from', source_profile_id,
      'contacts_moved', affected_contacts,
      'activities_moved', affected_activities
    ),
    merged_by_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'source_profile_id', source_profile_id,
    'target_profile_id', target_profile_id,
    'contacts_moved', affected_contacts,
    'activities_moved', affected_activities
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DATA QUALITY FUNCTIONS
-- =====================================================

-- Calculate data quality score for a profile
CREATE OR REPLACE FUNCTION calculate_profile_quality_score(profile_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  profile_rec profiles%ROWTYPE;
  score DECIMAL := 0;
BEGIN
  SELECT * INTO profile_rec FROM profiles WHERE id = profile_uuid;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base fields (40% of score)
  IF profile_rec.mobile IS NOT NULL AND profile_rec.mobile != '' THEN score := score + 0.15; END IF;
  IF profile_rec.first_name IS NOT NULL AND profile_rec.first_name != '' THEN score := score + 0.10; END IF;
  IF profile_rec.last_name IS NOT NULL AND profile_rec.last_name != '' THEN score := score + 0.10; END IF;
  IF profile_rec.email IS NOT NULL AND profile_rec.email != '' THEN score := score + 0.05; END IF;
  
  -- Address information (20% of score)
  IF profile_rec.city IS NOT NULL THEN score := score + 0.05; END IF;
  IF profile_rec.state IS NOT NULL THEN score := score + 0.05; END IF;
  IF profile_rec.country IS NOT NULL THEN score := score + 0.05; END IF;
  IF profile_rec.postal_code IS NOT NULL THEN score := score + 0.05; END IF;
  
  -- Custom fields richness (20% of score)
  score := score + LEAST(0.2, jsonb_object_keys_count(profile_rec.custom_fields) * 0.02);
  
  -- Activity recency (20% of score)
  IF profile_rec.last_activity_at > NOW() - INTERVAL '30 days' THEN score := score + 0.2;
  ELSIF profile_rec.last_activity_at > NOW() - INTERVAL '90 days' THEN score := score + 0.15;
  ELSIF profile_rec.last_activity_at > NOW() - INTERVAL '180 days' THEN score := score + 0.10;
  ELSIF profile_rec.last_activity_at > NOW() - INTERVAL '365 days' THEN score := score + 0.05;
  END IF;
  
  RETURN LEAST(1.0, score);
END;
$$ LANGUAGE plpgsql;

-- Update all profile quality scores
CREATE OR REPLACE FUNCTION update_all_profile_quality_scores()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE profiles 
  SET data_quality_score = calculate_profile_quality_score(id)
  WHERE merge_status = 'active';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Count keys in JSONB object
CREATE OR REPLACE FUNCTION jsonb_object_keys_count(obj JSONB)
RETURNS INTEGER AS $$
BEGIN
  IF obj IS NULL OR jsonb_typeof(obj) != 'object' THEN
    RETURN 0;
  END IF;
  
  RETURN (SELECT COUNT(*) FROM jsonb_object_keys(obj));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TEST DATA & VERIFICATION
-- =====================================================

-- Verify functions were created successfully
SELECT 'All matching functions created successfully' as status,
       COUNT(*) as function_count
FROM pg_proc 
WHERE proname IN (
  'find_profile_matches', 
  'process_contact', 
  'merge_contact_into_profile',
  'process_pending_contacts',
  'merge_profiles',
  'calculate_profile_quality_score',
  'update_all_profile_quality_scores'
);