# Profile Status Redesign Proposal

## Current Implementation (Just Added)
- Single `status` field with values: 'active', 'archived', 'deleted', 'destroyed'
- Status is derived from notification preferences
- Problem: Mixing lifecycle status with channel preferences

## Improved Design

### Single Status Field Approach

```sql
-- Profile lifecycle status (mutually exclusive)
status ENUM('active', 'inactive', 'deleted', 'destroyed')
```

### Status Definitions

1. **active** 
   - Profile is active and contactable
   - Default state for new profiles
   - At least one channel enabled in notification_preferences

2. **inactive**
   - Profile exists but all channels disabled
   - Can be reactivated anytime
   - Full data retained
   - Shows in lists/segments with inactive badge

3. **deleted**
   - Soft deleted
   - Hidden from all UI lists
   - Data retained for recovery
   - Can be restored to previous state

4. **destroyed**
   - Permanently deleted
   - Only ID and mobile retained for compliance
   - Cannot be restored
   - Never shown in UI

### Derived States (from notification_preferences)
These are calculated on-the-fly, not stored:

- **Has Marketing**: Any marketing_* channel is true
- **Fully Unsubscribed**: All marketing_* channels are false
- **Transactional Only**: All marketing false, some transactional true

### State Transitions

```
   ┌─────────┐
   │  NEW    │
   └────┬────┘
        │
        ▼
   ┌─────────┐     disable all      ┌──────────┐
   │ ACTIVE  │───────channels──────▶│ INACTIVE │
   └────┬────┘                      └────┬─────┘
        │         ◀──────enable──────────┘
        │              channels
        │
        │ soft delete
        ▼
   ┌─────────┐
   │ DELETED │
   └────┬────┘
        │ hard delete
        ▼
   ┌───────────┐
   │ DESTROYED │
   └───────────┘
```

### Benefits of This Approach

1. **Clear Separation of Concerns**
   - Status = lifecycle state
   - notification_preferences = channel preferences
   
2. **Data Integrity**
   - Profile can only be in one state
   - State transitions are controlled
   
3. **Performance**
   - Single indexed field for filtering
   - Derived states calculated only when needed
   
4. **Flexibility**
   - Easy to add new states if needed
   - Channel preferences independent of lifecycle

### Implementation Changes Needed

1. Update status logic to not derive from notification_preferences
2. Set status based on user actions (delete, restore, destroy)
3. Keep notification_preferences separate for channel management
4. Update counts to use combination of status + preferences

### Migration Path

```sql
UPDATE cdp_profiles
SET status = CASE
    WHEN status = 'archived' THEN 'inactive'
    WHEN status = 'deleted' THEN 'deleted'
    WHEN status = 'destroyed' THEN 'destroyed'
    ELSE 'active'
END;
```

### UI Card Counts

- **All**: COUNT(*) WHERE status != 'destroyed'
- **Active**: COUNT(*) WHERE status = 'active'
- **Marketing**: COUNT(*) WHERE status = 'active' AND has_marketing_channel()
- **Inactive**: COUNT(*) WHERE status = 'inactive'
- **Unsubscribed**: COUNT(*) WHERE status IN ('active','inactive') AND all_marketing_false()
- **Deleted**: COUNT(*) WHERE status = 'deleted'

