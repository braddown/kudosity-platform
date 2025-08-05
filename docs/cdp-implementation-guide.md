# Customer Data Platform (CDP) Implementation Guide

This guide documents the comprehensive Customer Data Platform architecture implemented for Kudosity, including database schema, TypeScript types, API repositories, and custom hooks.

## 🏗️ Architecture Overview

The CDP architecture separates three core entities:

1. **👤 Users** - Platform operators (your team members)
2. **🎯 Profiles** - Master customer records (unique by mobile, allows duplicates)
3. **📊 Contacts** - Individual touchpoints/data sources that feed into profiles

## 📊 Database Schema

### Core Tables

#### 1. `users` - Platform Operators
```sql
- id (UUID, Primary Key)
- email (TEXT, Unique)
- password_hash (TEXT)
- first_name, last_name (TEXT)
- role (admin, manager, agent, viewer)
- department (TEXT)
- is_active (BOOLEAN)
- permissions (TEXT[])
- notification_preferences (JSONB)
- created_at, updated_at (TIMESTAMP)
```

#### 2. `profiles` - Master Customer Records
```sql
- id (UUID, Primary Key)
- mobile (TEXT, Primary matching field)
- first_name, last_name, email (TEXT)
- address fields (TEXT)
- lifecycle_stage (lead, prospect, customer, churned, blocked)
- lead_score (INTEGER 0-100)
- lifetime_value (DECIMAL)
- data_quality_score (DECIMAL 0-1)
- custom_fields (JSONB)
- notification_preferences (JSONB)
- tags (TEXT[])
- source, source_details (TEXT, JSONB)
- merge_status (active, duplicate, merged, archived)
- duplicate_of_profile_id (UUID, self-reference)
- created_at, updated_at, last_activity_at (TIMESTAMP)
```

#### 3. `contacts` - Individual Touchpoints
```sql
- id (UUID, Primary Key)
- profile_id (UUID, FK to profiles, nullable until matched)
- source (form_submission, sms_inbound, csv_upload, etc.)
- source_details (JSONB)
- batch_id (UUID, for bulk operations)
- mobile, email, first_name, last_name (TEXT)
- company, job_title (TEXT)
- raw_data (JSONB, preserves original data)
- processing_status (pending, matched, needs_review, etc.)
- match_confidence (DECIMAL 0-1)
- potential_matches (JSONB array)
- processed_at, processed_by (TIMESTAMP, UUID)
```

#### 4. `profile_activities` - Activity Log
```sql
- id (UUID, Primary Key)
- profile_id (UUID, FK to profiles)
- contact_id (UUID, reference to source contact)
- activity_type (profile_created, contact_merged, data_updated, etc.)
- activity_description (TEXT)
- changes (JSONB, before/after data)
- data_source, channel (TEXT)
- created_at, created_by (TIMESTAMP, UUID)
```

#### 5. Supporting Tables
- `contacts_archive` - Processed contacts audit trail
- `contact_review_queue` - Manual review system
- `profile_merge_log` - Profile merge history

## 🔧 Implementation Files

### Database Migrations
- **`scripts/migrations/001_create_cdp_architecture.sql`** - Core table structure
- **`scripts/migrations/002_matching_functions.sql`** - Intelligent matching functions
- **`scripts/apply-cdp-migration.js`** - Simple Node.js migration runner

### TypeScript Types
- **`lib/types/cdp-types.ts`** - Comprehensive type definitions
- **`lib/types/index.ts`** - Updated to export CDP types

### API Repositories
- **`lib/api/repositories/CDPProfilesRepository.ts`** - Profile management
- **`lib/api/repositories/CDPContactsRepository.ts`** - Contact processing

### Custom Hooks
- **`lib/hooks/useCDPProfiles.ts`** - Profile management hook
- **`lib/hooks/useCDPContacts.ts`** - Contact processing hook

## 🚀 Getting Started

### 1. Apply Database Migration

**Option A: Using Node.js script (Recommended)**
```bash
# Set your Supabase service role key
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Run the migration
node scripts/apply-cdp-migration.js
```

**Option B: Using SQL files directly**
```bash
# Apply migrations in order using Supabase dashboard SQL editor
# 1. scripts/migrations/001_create_cdp_architecture.sql
# 2. scripts/migrations/002_matching_functions.sql
```

### 2. Update Your Components

Replace existing profile/contact management with new CDP hooks:

```typescript
// Old approach
import { useProfiles } from '@/hooks/useProfiles'

// New CDP approach
import { useCDPProfiles } from '@/hooks/useCDPProfiles'

function ProfilesPage() {
  const {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    searchProfiles,
    // ... many more features
  } = useCDPProfiles({
    pageSize: 20,
    autoFetch: true
  })

  // Your component logic
}
```

### 3. Configure Contact Processing

Set up automated contact processing:

```typescript
import { useCDPContacts } from '@/hooks/useCDPContacts'

function ContactProcessingDashboard() {
  const {
    processPendingContacts,
    retryFailedContacts,
    metrics,
    loadMetrics
  } = useCDPContacts()

  // Process pending contacts automatically
  const handleProcessContacts = async () => {
    const result = await processPendingContacts(100)
    console.log(`Processed: ${result.success_count}/${result.processed_count}`)
  }
}
```

## 🎯 Key Features

### Intelligent Contact Matching
- **Exact mobile matching** (85% confidence)
- **Fuzzy email matching** (70% confidence)  
- **Name similarity matching** (25% confidence each)
- **Automatic vs manual review** based on confidence scores

### Profile Management
- **CRUD operations** with validation
- **Custom fields** with type definitions
- **Tags** for segmentation
- **Notification preferences** per channel
- **Data quality scoring**
- **Profile merging** with conflict resolution

### Contact Processing Workflow
```
Contact Created → Find Matches → Score Confidence → 
  ↓
High Confidence (>90%) → Auto-match
Medium Confidence (70-90%) → Auto-match + Review Queue  
Low Confidence (<70%) → Manual Review Queue
No Match → Create New Profile
```

### Notification Preferences Structure
```typescript
{
  marketing_sms: boolean,
  marketing_email: boolean,
  marketing_whatsapp: boolean,
  marketing_rcs: boolean,
  transactional_sms: boolean,
  transactional_email: boolean,
  transactional_whatsapp: boolean,
  transactional_rcs: boolean
}
```

## 📋 API Examples

### Creating a Contact
```typescript
const contact = await createContact({
  source: 'form_submission',
  source_details: { form_id: 'newsletter-signup' },
  mobile: '+1234567890',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  raw_data: { utm_source: 'google', utm_campaign: 'summer-sale' }
})
```

### Processing Contacts
```typescript
// Process single contact
const result = await processContact(contactId)

// Batch process pending contacts
const batchResult = await processPendingContacts(100)

// Retry failed contacts
const retryResult = await retryFailedContacts()
```

### Profile Operations
```typescript
// Create profile
const profile = await createProfile({
  mobile: '+1234567890',
  first_name: 'John',
  last_name: 'Doe',
  source: 'manual_entry',
  lifecycle_stage: 'lead'
})

// Update custom field
await updateCustomField(profileId, 'company', 'Acme Corp')

// Update notification preferences
await updateNotificationPreferences(profileId, {
  marketing_sms: false,
  transactional_email: true
})

// Add tags
await addTags(profileId, ['vip', 'enterprise'])
```

### Search & Filtering
```typescript
// Search profiles
const results = await searchProfiles({
  search: 'john',
  lifecycle_stage: ['lead', 'customer'],
  tags: ['vip'],
  has_email: true,
  created_after: '2024-01-01'
}, 1, 20) // page 1, 20 per page

// Get opted-in profiles for SMS campaign
const optedIn = await getOptedInProfiles('marketing_sms', {
  lifecycle_stage: ['customer']
})
```

## 🔍 Monitoring & Analytics

### Dashboard Metrics
- **Profile metrics**: Total, active, duplicates, by lifecycle stage
- **Contact metrics**: Pending, matched, processing success rate
- **Data quality**: Average scores, completeness
- **Processing performance**: Match confidence, resolution times

### Review Queue Management
- **Automatic routing** based on confidence scores
- **Priority assignment** (low, medium, high, urgent)
- **Conflict resolution** tracking
- **Performance analytics** for review efficiency

## 🛡️ Data Quality & Compliance

### Data Validation
- **Mobile number formatting** and validation
- **Email format** validation
- **Required field** enforcement
- **Custom validation rules** per field type

### GDPR Compliance
- **Consent tracking** (date, source)
- **Data retention** policies
- **Right to be forgotten** (archive/delete)
- **Audit trails** for all changes

### Data Quality Scoring
Automatic scoring based on:
- **Completeness** (40%): Name, mobile, email, address
- **Recency** (20%): Last activity date
- **Richness** (20%): Custom fields count
- **Address data** (20%): Geographic information

## 🚦 Next Steps

1. **Apply the migration** to create database structure
2. **Update existing components** to use CDP hooks
3. **Configure contact sources** (forms, API endpoints, imports)
4. **Set up processing workflows** and review queues
5. **Create custom field definitions** for your business needs
6. **Configure notification preferences** and compliance rules
7. **Build reporting dashboards** using the metrics APIs

## ⚠️ Important Notes

- **Default admin user**: `admin@kudosity.com` / `admin123` (change password immediately)
- **Service role key** required for migrations and admin operations
- **Profile mobile numbers** allow duplicates when business logic requires it
- **Contact processing** is designed to be run in batches for efficiency
- **All changes are logged** in `profile_activities` for audit trails
- **Soft deletes** are used - profiles are archived, not hard deleted

This implementation provides a robust foundation for customer data management with intelligent matching, comprehensive tracking, and compliance-ready features.