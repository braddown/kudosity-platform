# Filter Groups Implementation

## Overview
The Recipient Profiles filter system has been enhanced to support complex filter logic using filter groups. This allows for creating sophisticated queries that combine AND and OR logic.

## How It Works

### Filter Structure
- **Filter Groups**: Collections of conditions that are evaluated together
- **Within Groups**: All conditions use AND logic (all must match)
- **Between Groups**: Groups are combined with OR logic (at least one group must match)

### Example Scenarios

#### Example 1: Country-based filtering with mobile requirement
```
Group 1: Country = "Australia" AND Mobile = "Exists"
OR
Group 2: Country = "New Zealand" AND Mobile = "Exists"
```
This will find all profiles from Australia or New Zealand that have a mobile number.

#### Example 2: Complex customer segmentation
```
Group 1: Country = "USA" AND Status = "Active" AND Tags contains "VIP"
OR
Group 2: Country = "Canada" AND Status = "Active" AND Tags contains "Premium"
OR
Group 3: Last Activity > "2024-01-01" AND Mobile = "Exists"
```
This will find VIP customers from USA, Premium customers from Canada, or any recently active customer with a mobile number.

## User Interface

### Adding Filter Groups
1. Click "Filter Profiles" in the dropdown menu to create custom filters
2. The first group is created automatically
3. Add conditions to a group using the "+ AND" button at the end of the last condition
4. Add more groups using the centered "+ OR" button

### Visual Indicators
- **AND separator**: Small gray badge between conditions within a group
- **OR separator**: Blue badge with divider lines between groups
- **Group labels**: "Group 1", "Group 2", etc. with note about AND logic when multiple conditions exist
- **Streamlined buttons**: "+ AND" at the end of conditions, centered "+ OR" for new groups

### Segment Selection
- When selecting a pre-saved segment from the dropdown, the filter UI is hidden
- The segment's filters are applied automatically without showing the configuration
- To edit a segment's filters, click "Filter Profiles" to open the filter builder

### Operators
The system supports these operators:
- `contains`: Partial text match
- `equals`: Exact match
- `is` / `is not`: Exact match with negation
- `starts with` / `ends with`: Text position matching
- `greater than` / `less than`: Numeric comparisons
- `exists` / `not exists`: Field presence check (no value input needed)

## Data Structure

### FilterGroup Interface
```typescript
interface FilterGroup {
  id: string
  conditions: FilterCondition[]
}

interface FilterCondition {
  field: string
  operator: string
  value: string
}
```

### Segment Storage
Segments now store filter groups in the `filter_criteria`:
```typescript
filter_criteria: {
  filterGroups?: FilterGroup[]     // New grouped filter support
  conditions?: FilterCondition[]   // Legacy support for old segments
  profileType?: string
  searchTerm?: string
}
```

## Backward Compatibility
The system maintains backward compatibility with existing segments:
- Old segments with simple `conditions` array are automatically converted to a single filter group
- New segments use the `filterGroups` structure
- Both formats work seamlessly

## Implementation Details

### Filter Evaluation Logic
```typescript
// Pseudo-code for filter evaluation
profiles.filter(profile => {
  return filterGroups.some(group => {           // OR between groups
    return group.conditions.every(condition => { // AND within group
      return evaluateCondition(profile, condition)
    })
  })
})
```

### Special Cases
1. **Empty conditions**: Conditions with no value are skipped
2. **Exists operators**: Automatically set a placeholder value, no user input needed
3. **Array fields**: Tags and similar fields are joined and searched as text
4. **Custom fields**: Accessed via `custom_fields.` prefix

## Benefits
1. **Flexibility**: Create complex queries without limitations
2. **Clarity**: Visual separation makes logic clear
3. **Power**: Combine multiple criteria in sophisticated ways
4. **Simplicity**: Intuitive UI with clear AND/OR indicators

## Migration Notes
- Existing segments continue to work without modification
- Users can edit old segments and they'll be upgraded to the new format when saved
- No data migration required
