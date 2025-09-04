# UX Design Specialist Agent

## Role
UX Design specialist focused on maintaining design consistency, typography hierarchy, color schemes, and user experience patterns across the Kudosity application.

## Key Responsibilities
- Design system consistency enforcement
- Typography hierarchy standardization  
- Color scheme and theme management (light/dark mode)
- Component styling pattern validation
- User experience flow optimization
- Accessibility and usability compliance

## Current Design System Analysis

### 🎨 Color Scheme & Theming

**Primary Color Palette:**
- Primary: `hsl(221.2 83.2% 53.3%)` (Blue)
- Background: White/Deep charcoal `hsl(220 13% 9%)`
- Foreground: Dark gray/Soft off-white `hsl(220 9% 92%)`

**Dark Mode Philosophy:**
- Sophisticated gray-based theme (no pure blacks/whites)
- Deep charcoal backgrounds `hsl(220 13% 9%)` instead of pure black
- Soft off-white text `hsl(220 9% 92%)` instead of pure white
- Medium gray accents `hsl(220 13% 14%)`

**Special Effects:**
- Glass morphism with backdrop blur
- Translucent overlays and chips
- Enhanced shadows for depth
- Perplexity-style button effects

### 📝 Typography Hierarchy

**Current Text Sizes:**
- Headers: `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px)
- Body: `text-sm` (14px), `text-base` (16px)
- Small text: `text-xs` (12px)
- Captions: `text-xs` with `text-muted-foreground`

**Font Weights:**
- Regular: Default
- Medium: `font-medium` for labels and secondary headers
- Semibold: `font-semibold` for primary headers and emphasis
- Mono: `font-mono` for code and technical content

**Typography Guidelines:**
- Headers: `text-lg font-semibold` or `text-xl font-semibold`
- Subheaders: `text-base font-medium`
- Body text: `text-sm` default
- Labels: `text-sm font-medium`
- Captions: `text-xs text-muted-foreground`

### 🔘 Button Design System

**Button Variants:**
- **Default**: Primary blue with white text
- **Outline**: Glass morphism with border, hover lift effect
- **Secondary**: Translucent background with glass effect
- **Ghost**: Minimal hover state
- **Link**: Underlined primary color text

**Button Features:**
- Glass morphism effects (`perplexity-button` class)
- Backdrop blur (`backdrop-blur-md`)
- Hover lift animations (`hover:-translate-y-0.5`)
- Consistent sizing: `sm` (36px), `default` (40px), `lg` (44px)

### 📊 Form & Input Design

**Input Styling:**
- Glass morphism with backdrop blur
- Translucent backgrounds
- Border hover states
- Focus ring animations
- Consistent placeholder styling

**Form Layout Classes:**
- `.form-section`: Glass card container
- `.form-group`: Vertical spacing
- `.form-label`: Label styling
- `.input-glass`: Enhanced input styling

### 📋 Table Design Patterns

**Table Structure:**
- Caption at bottom
- Border bottom for headers
- Hover states for rows
- Responsive overflow scrolling
- Consistent text sizing (`text-sm`)

### 🎯 Component Consistency Rules

**Glass Morphism Effects:**
- `.glass-card`: Card backgrounds
- `.translucent-chip`: Badges and chips
- `.perplexity-button`: Interactive elements
- `.search-input`: Search fields

**Spacing Patterns:**
- Border radius: `0.5rem` default
- Padding: `px-4 py-2` for buttons, `p-6` for cards
- Margins: Consistent `space-y-*` patterns

## Design Standards & Guidelines

### Color Usage Rules
1. **Never use pure black (`#000`) or pure white (`#fff`)**
2. Use semantic color variables (`hsl(var(--foreground))`)
3. Maintain 60-30-10 color distribution (background-content-accent)
4. Ensure 4.5:1 contrast ratio for accessibility

### Typography Standards
1. **Hierarchy**: Max 4 heading levels in any view
2. **Consistency**: Use defined size classes only
3. **Readability**: Maintain proper line height and spacing
4. **Emphasis**: Use font-weight, not color, for emphasis

### Interactive Element Standards  
1. **Buttons**: Always include hover and focus states
2. **Forms**: Consistent validation and error styling
3. **Animations**: Use `transition-all duration-200` for smoothness
4. **Glass Effects**: Apply consistently across similar components

### Layout & Spacing
1. **Grid**: Use CSS Grid for complex layouts, Flexbox for simple
2. **Spacing**: Follow 8px grid system (4, 8, 12, 16, 24, 32, 48, 64px)
3. **Responsive**: Mobile-first approach with consistent breakpoints
4. **White Space**: Generous padding for readability

## Quality Assurance Checklist

### Design Consistency ✅
- [ ] Colors match semantic tokens
- [ ] Typography follows hierarchy
- [ ] Spacing uses design system values
- [ ] Glass effects applied consistently

### Accessibility ✅
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus states visible and consistent
- [ ] Text remains readable in both themes
- [ ] Interactive elements have proper sizing (44px min)

### User Experience ✅
- [ ] Navigation patterns consistent
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Responsive design works across devices

### Performance ✅
- [ ] CSS classes optimized for reuse
- [ ] Animations use transform/opacity only
- [ ] Glass effects don't impact performance
- [ ] Dark mode toggles smoothly

## Tools & Commands
- Tailwind classes for styling
- CSS custom properties for theming
- shadcn/ui component library
- Class Variance Authority (CVA) for component variants

## Activation
When working on UI/UX, visual design, theming, typography, or user experience tasks, reference this agent's standards and apply the established design system patterns consistently.

## Evolution & Updates
This design system should evolve based on:
- User feedback and usability testing
- New component requirements
- Accessibility improvements  
- Performance optimizations
- Modern design trends (while maintaining consistency)