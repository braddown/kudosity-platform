# Customer Data Platform (CDP) Guide

## Overview

The Kudosity Platform now includes a comprehensive Customer Data Platform (CDP) that provides intelligent customer data management with automatic profile matching, deduplication, and data quality scoring.

## Architecture

### Core Entities

1. **Users** (`cdp_users`) - Platform operators (admin, managers, agents)
2. **Profiles** (`cdp_profiles`) - Master customer records (golden records)
3. **Contacts** (`cdp_contacts`) - Individual touchpoints/data points
4. **Profile Activities** (`cdp_profile_activities`) - Activity audit trail
5. **Contact Review Queue** (`cdp_contact_review_queue`) - Manual review system
6. **Contacts Archive** (`cdp_contacts_archive`) - Processed contact history

### Data Flow

```
Contact Ingestion → Intelligent Matching → Profile Creation/Update → Activity Logging
                 ↓
            Manual Review Queue (low confidence matches)
```

## Key Features

### 🧠 Intelligent Matching
- **Mobile Priority**: Exact mobile match (85% confidence)
- **Email Matching**: Exact/fuzzy email scoring (70% confidence)  
- **Name Matching**: Fuzzy first/last name matching (25% each)
- **Confidence Scoring**: 0-100% match confidence with transparent reasoning

### 🔄 Automated Processing
- **High Confidence**: Auto-merge matches ≥90%
- **Medium Confidence**: Auto-merge ≥70% with review flag
- **Low Confidence**: Manual review queue
- **Batch Processing**: Process multiple contacts efficiently

### 📊 Data Quality Management
- **Quality Scoring**: 0-100% data completeness score
- **Progressive Enhancement**: Profiles improve over time
- **Deduplication**: Intelligent duplicate detection and merging
- **Activity Tracking**: Complete audit trail

### 🛡️ Compliance & Privacy
- **GDPR Ready**: Built-in consent and retention management
- **Data Retention**: Automated data lifecycle management
- **Audit Trail**: Complete activity logging for compliance

## Getting Started

### 1. Database Setup

The CDP tables are automatically created via Supabase migrations:

```sql
-- Core CDP tables already created:
-- cdp_users, cdp_profiles, cdp_contacts, cdp_profile_activities,
-- cdp_contact_review_queue, cdp_contacts_archive, cdp_profile_merge_log
```

### 2. Migration from Legacy System

Use the built-in migration tool to migrate existing data:

```bash
# Preview what will be migrated (safe)
npm run migrate-cdp:dry

# Perform the actual migration
npm run migrate-cdp

# Rollback if needed (DANGEROUS - will delete all CDP data)
npm run migrate-cdp:rollback
```

### 3. Using CDP Components

#### Profile Management

```tsx
import { CDPProfilePage } from '@/components/features/profiles'

// Enhanced profile page with CDP features
<CDPProfilePage
  profileId="profile-uuid"
  onBack={() => router.back()}
  onSave={() => router.push('/profiles')}
/>
```

#### Contact Processing

```tsx
import { CDPContactProcessor } from '@/components/features/profiles'

// Contact ingestion and processing interface
<CDPContactProcessor
  onContactProcessed={(result) => console.log('Processed:', result)}
  onError={(error) => console.error('Error:', error)}
/>
```

### 4. Using CDP Hooks

#### Profile Management

```tsx
import { useCDPProfiles } from '@/lib/hooks'

function ProfilesPage() {
  const {
    profiles,
    loading,
    error,
    createProfile,
    updateProfile,
    mergeProfiles,
    findPotentialDuplicates,
    processContact
  } = useCDPProfiles({
    filters: { lifecycle_stage: 'customer' },
    pagination: { page: 1, pageSize: 50 }
  })

  // Create a new contact and process through CDP
  const handleNewContact = async (contactData) => {
    const result = await processContact(contactData)
    console.log('Processing result:', result)
  }

  return (
    <div>
      {profiles.map(profile => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  )
}
```

#### Contact Processing

```tsx
import { useCDPContacts } from '@/lib/hooks'

function ContactProcessor() {
  const {
    contacts,
    processBatch,
    getReviewQueue,
    resolveReview
  } = useCDPContacts({
    filters: { processing_status: 'pending' }
  })

  const handleBatchProcess = async () => {
    const result = await processBatch(50)
    console.log('Processed:', result.processed_count)
  }

  return (
    <Button onClick={handleBatchProcess}>
      Process {contacts.length} Pending Contacts
    </Button>
  )
}
```

## API Reference

### Profile Matching Function

```sql
SELECT * FROM find_cdp_profile_matches(
  input_mobile := '+61412345678',
  input_email := 'john@example.com',
  input_first_name := 'John',
  input_last_name := 'Smith'
);
```

Returns potential matches with confidence scores and reasons.

### Contact Processing Function

```sql
SELECT process_cdp_contact('contact-uuid');
```

Processes a contact through the intelligent matching system.

### Batch Processing Function

```sql
SELECT process_pending_cdp_contacts(batch_size := 100);
```

Processes multiple pending contacts in a batch.

## Configuration

### Matching Confidence Thresholds

The system uses configurable confidence thresholds:

- **Auto-merge (High)**: ≥90% confidence
- **Auto-merge with Review**: ≥70% confidence  
- **Manual Review**: <70% confidence

### Data Quality Scoring

Profiles are scored based on:
- **Base Fields** (40%): mobile, first_name, last_name, email
- **Address Info** (20%): city, state, country, postal_code
- **Custom Fields** (20%): richness of additional data
- **Activity Recency** (20%): how recently the profile was active

## Monitoring & Review

### Processing Statistics

Monitor contact processing through the dashboard:

- **Total Contacts**: All contacts in the system
- **Pending**: Awaiting processing
- **Processing**: Currently being processed
- **Matched**: Successfully matched to profiles
- **Needs Review**: Requires manual intervention
- **Failed**: Processing errors

### Review Queue

Handle low-confidence matches and conflicts:

1. **Duplicate Checks**: Multiple potential matches found
2. **Data Conflicts**: Conflicting information detected
3. **Low Confidence**: Match confidence below threshold
4. **Manual Verification**: User-requested review
5. **Compliance Review**: GDPR or privacy concerns

### Resolution Actions

- **Create New Profile**: No suitable match found
- **Assign to Profile**: Match to specific existing profile
- **Merge Profiles**: Combine duplicate profiles
- **Reject Contact**: Invalid or spam contact

## Best Practices

### 1. Contact Ingestion

- Always provide mobile number (required field)
- Include as much contact info as possible for better matching
- Use consistent source tracking for audit purposes

### 2. Profile Management

- Regularly review duplicate detection results
- Monitor data quality scores and improve low-scoring profiles
- Use tags and custom fields for business-specific categorization

### 3. Processing Optimization

- Process contacts in batches during off-peak hours
- Monitor the review queue and resolve items promptly
- Set up alerts for failed processing or high queue volumes

### 4. Data Governance

- Implement retention policies using the `data_retention_date` field
- Track consent using `consent_date` and `consent_source`
- Regular audit of profile merge logs for compliance

## Troubleshooting

### Common Issues

#### High Review Queue Volume
**Symptoms**: Many contacts requiring manual review
**Solutions**: 
- Adjust confidence thresholds
- Improve source data quality
- Implement batch resolution workflows

#### Processing Failures
**Symptoms**: Contacts stuck in 'failed' status
**Solutions**:
- Check error logs in `processing_notes`
- Verify data format and required fields
- Use retry functionality for transient errors

#### Performance Issues
**Symptoms**: Slow profile searches or matching
**Solutions**:
- Ensure proper database indexing
- Use pagination for large result sets
- Consider archiving old inactive profiles

### Database Maintenance

```sql
-- Update all profile quality scores
SELECT update_all_profile_quality_scores();

-- Clean up old archived contacts
DELETE FROM cdp_contacts_archive 
WHERE archived_at < NOW() - INTERVAL '1 year';

-- Find profiles needing attention
SELECT * FROM cdp_profiles 
WHERE data_quality_score < 0.5 
ORDER BY last_activity_at DESC;
```

## Migration Considerations

When migrating from the legacy system:

1. **Data Backup**: Always backup existing data before migration
2. **Gradual Rollout**: Consider migrating in phases
3. **Dual Operation**: Run both systems temporarily during transition
4. **User Training**: Train staff on new CDP features and workflows
5. **Monitoring**: Closely monitor processing during initial period

## Support

For technical support or feature requests:

1. Check the processing statistics dashboard
2. Review the activity logs for specific profiles
3. Monitor the review queue for manual interventions
4. Contact development team with specific error messages or logs

---

*This guide covers the core CDP functionality. For advanced customization or enterprise features, please refer to the technical documentation or contact the development team.*