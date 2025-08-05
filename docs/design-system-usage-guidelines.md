# Design System Usage Guidelines

## Overview

This document establishes clear guidelines for using the shadcn/ui design system consistently across the Kudosity Platform. Following these guidelines ensures visual consistency, maintainability, and proper theming support.

## Core Principles

### 1. **Always Use Design System Components First**
- Prefer shadcn/ui components over custom implementations
- Only create custom styling for unique business logic or data visualization
- When in doubt, check if a shadcn/ui component exists before implementing custom styling

### 2. **Semantic Color Usage**
- Use semantic color variables instead of hardcoded values
- Leverage the design system's theming capabilities
- Ensure proper dark/light mode support

### 3. **Consistent Sizing and Spacing**
- Use standardized size variants (sm, default, lg)
- Follow established spacing patterns
- Avoid custom padding/margin unless necessary

## Component Usage Standards

### **Buttons**

#### ✅ **Correct Usage**

```tsx
// Primary actions
<Button variant="default">
  Save Changes
</Button>

// Secondary actions
<Button variant="secondary">
  Cancel
</Button>

// Destructive actions
<Button variant="destructive">
  Delete Item
</Button>

// Subtle actions
<Button variant="ghost">
  Cancel
</Button>

// Outlined actions
<Button variant="outline">
  Edit
</Button>

// Icon buttons
<Button variant="outline" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// Loading states
<Button disabled={loading}>
  {loading ? "Saving..." : "Save"}
</Button>
```

#### ❌ **Incorrect Usage**

```tsx
// Don't override with custom classes
<Button className="bg-blue-500 hover:bg-blue-600 text-white">
  Save
</Button>

// Don't duplicate variant styling
<Button variant="default" className="bg-primary hover:bg-primary/90">
  Save
</Button>

// Don't use hardcoded colors
<Button className="bg-red-600 hover:bg-red-700">
  Delete
</Button>
```

### **Forms**

#### ✅ **Correct Usage**

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Standard form fields
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>

// Select fields
<div className="space-y-2">
  <Label htmlFor="status">Status</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### ❌ **Incorrect Usage**

```tsx
// Don't use custom styled inputs
<input className="border border-gray-300 rounded px-3 py-2" />

// Don't override design system styling
<Input className="border-blue-500 focus:border-blue-600" />
```

### **Cards and Containers**

#### ✅ **Correct Usage**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

#### ❌ **Incorrect Usage**

```tsx
// Don't create custom card styling
<div className="bg-white border border-gray-200 rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-4">Settings</h3>
  <p>Content</p>
</div>
```

### **Tables**

#### ✅ **Correct Usage**

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### ❌ **Incorrect Usage**

```tsx
// Don't override hover states manually
<TableRow className="hover:bg-muted/40 dark:hover:bg-muted/50">
  <TableCell>Content</TableCell>
</TableRow>

// Don't use custom table styling
<tr className="border-b hover:bg-gray-50">
  <td className="px-4 py-2">Content</td>
</tr>
```

## Color System Guidelines

### **Semantic Colors**

Use these semantic color classes that adapt to light/dark themes:

#### **Text Colors**
```tsx
text-foreground          // Primary text
text-muted-foreground    // Secondary/muted text
text-primary            // Brand/accent text
text-destructive        // Error/warning text
```

#### **Background Colors**
```tsx
bg-background           // Main background
bg-card                // Card/panel background
bg-muted               // Subtle backgrounds
bg-primary             // Brand/accent background
bg-destructive         // Error/warning background
```

#### **Border Colors**
```tsx
border-border          // Standard borders
border-input          // Form input borders
border-primary        // Brand/accent borders
border-destructive    // Error/warning borders
```

### ❌ **Avoid Hardcoded Colors**

```tsx
// Don't use specific color values
className="bg-blue-500 hover:bg-blue-600"
className="text-gray-700 hover:text-gray-900"
className="border-gray-300"

// Don't use custom hex values
className="bg-[#2563EB] hover:bg-[#1d4ed8]"
style={{ backgroundColor: '#3b82f6' }}
```

## Layout and Spacing

### **Spacing Scale**

Use standardized spacing classes:

```tsx
// Prefer design system spacing
className="p-4 m-2 space-y-4 gap-2"

// Component-specific spacing
<div className="space-y-6">        // Vertical spacing between sections
<div className="flex gap-2">       // Horizontal spacing in flex layouts
<div className="grid gap-4">       // Grid spacing
```

### **Container Patterns**

```tsx
// Page containers
<div className="container mx-auto px-4 py-8">
  <div className="space-y-6">
    {/* Page content */}
  </div>
</div>

// Card grids
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Form layouts
<div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Form fields */}
  </div>
</div>
```

## Special Cases and Exceptions

### **When Custom Styling is Acceptable**

1. **Data Visualization**: Charts, graphs, progress bars with dynamic values
   ```tsx
   // Acceptable for chart bars
   <div 
     className="bg-primary hover:bg-primary/80"
     style={{ height: `${percentage}%` }}
   />
   ```

2. **Layout Calculations**: Dynamic sizing based on content
   ```tsx
   // Acceptable for responsive layouts
   <div style={{ height: 'calc(100vh - 64px)' }}>
   ```

3. **Third-Party Integration**: When integrating with external libraries
   ```tsx
   // Acceptable for library-specific styling
   <div className="react-flow-container">
   ```

### **Required Custom Classes**

Some components may require specific CSS classes for functionality:

```tsx
// Acceptable when required for functionality
<Button className="perplexity-button" variant="outline">
  Action
</Button>
```

## Migration Patterns

### **From Custom Buttons to Design System**

```tsx
// Before
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// After
<Button variant="default">
  Click me
</Button>
```

### **From Custom Cards to Design System**

```tsx
// Before
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold mb-4">Title</h3>
  <p>Content</p>
</div>

// After
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

### **From Custom Forms to Design System**

```tsx
// Before
<input 
  className="border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
  placeholder="Enter text"
/>

// After
<Input placeholder="Enter text" />
```

## Enforcement and Code Review

### **ESLint Rules** (Future Implementation)

```json
{
  "rules": {
    "@kudosity/no-hardcoded-colors": "error",
    "@kudosity/prefer-design-system-components": "warn",
    "@kudosity/no-duplicate-button-styling": "error"
  }
}
```

### **Code Review Checklist**

- [ ] No hardcoded color values (bg-blue-500, text-gray-700, etc.)
- [ ] Proper use of semantic colors (bg-primary, text-foreground, etc.)
- [ ] shadcn/ui components used instead of custom implementations
- [ ] No duplicate styling on design system components
- [ ] Proper variant usage for buttons, inputs, etc.
- [ ] Consistent spacing and sizing patterns
- [ ] Dark/light mode compatibility

### **PR Template Section**

Add to PR template:

```markdown
## Design System Compliance
- [ ] All new components use shadcn/ui design system
- [ ] No hardcoded colors or custom button implementations
- [ ] Proper semantic color usage for theming
- [ ] Components tested in both light and dark modes
```

## Common Mistakes and Solutions

### **Mistake 1: Redundant Styling**

```tsx
// ❌ Wrong - redundant classes
<Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Submit
</Button>

// ✅ Correct - variant handles styling
<Button variant="default">
  Submit
</Button>
```

### **Mistake 2: Custom Button Components**

```tsx
// ❌ Wrong - unnecessary wrapper
function CustomButton({ children, ...props }) {
  return (
    <Button className="bg-blue-500 hover:bg-blue-600 text-white" {...props}>
      {children}
    </Button>
  )
}

// ✅ Correct - use design system directly
<Button variant="default">
  {children}
</Button>
```

### **Mistake 3: Hardcoded Theme Colors**

```tsx
// ❌ Wrong - breaks theming
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>

// ✅ Correct - semantic colors
<div className="bg-background text-foreground">
  Content
</div>
```

## Resources and References

### **Design System Documentation**
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Component Architecture Guidelines](./component-architecture-guidelines.md)

### **Internal Resources**
- [Design System Audit Report](./design-system-audit.md)
- [Component Refactoring Examples](./refactoring-post-mortem.md)
- [Naming Conventions](./naming-conventions.md)

---

**Last Updated**: Task 5 - Design System Standardization  
**Next Review**: After major design system updates  
**Maintained By**: Development Team