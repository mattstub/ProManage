# Design System

## Overview

ProManage's design system ensures consistency across web and mobile applications while optimizing for the primary desktop-first workflow.

## Design Principles

### 1. Desktop-First, Mobile-Optimized
- Primary focus on desktop usability (90% use case)
- Mobile app provides focused, task-specific interface
- Responsive design for tablets and smaller screens

### 2. Clarity Over Aesthetics
- Construction management requires clear, actionable information
- Minimize visual clutter
- Emphasize readability and scannability
- Use data visualization where appropriate

### 3. Efficiency for Power Users
- Keyboard shortcuts for common actions
- Quick filters and search
- Bulk operations support
- Minimal clicks to complete tasks

### 4. Accessible by Default
- WCAG 2.1 AA compliance
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast ratios

### 5. Feedback & Confirmation
- Clear loading states
- Success/error messages
- Confirmation for destructive actions
- Real-time sync indicators

## Color Palette

### Primary Colors

**Brand Primary** (To be defined)
```css
--color-primary-50: #...;
--color-primary-100: #...;
--color-primary-500: #...;  /* Main brand color */
--color-primary-900: #...;
```

**Neutrals** (Grays for UI)
```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Semantic Colors

**Success** (Green)
```css
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;
--color-success-700: #15803d;
```

**Warning** (Yellow/Orange)
```css
--color-warning-50: #fffbeb;
--color-warning-500: #f59e0b;
--color-warning-700: #b45309;
```

**Error** (Red)
```css
--color-error-50: #fef2f2;
--color-error-500: #ef4444;
--color-error-700: #b91c1c;
```

**Info** (Blue)
```css
--color-info-50: #eff6ff;
--color-info-500: #3b82f6;
--color-info-700: #1d4ed8;
```

### Construction-Specific Colors

**Safety** (High-visibility colors)
```css
--color-safety-yellow: #fbbf24;
--color-safety-orange: #fb923c;
--color-safety-red: #dc2626;
```

## Typography

### Font Families

**Primary Font** (UI Text)
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
```

**Monospace Font** (Code, Numbers)
```css
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Font Scales

**Desktop Scale**
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

**Mobile Scale** (Slightly larger for touchability)
```css
--text-mobile-xs: 0.875rem;   /* 14px */
--text-mobile-sm: 1rem;        /* 16px */
--text-mobile-base: 1.125rem;  /* 18px */
--text-mobile-lg: 1.25rem;     /* 20px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System

Based on 4px grid:

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

## Layout Components

### Page Structure

**Desktop Layout**
```
┌─────────────────────────────────────┐
│         Top Navigation              │
├──────┬──────────────────────────────┤
│      │                              │
│ Side │     Main Content Area        │
│ Nav  │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

**Mobile Layout**
```
┌─────────────────┐
│   Top Bar       │
├─────────────────┤
│                 │
│  Main Content   │
│                 │
│                 │
├─────────────────┤
│  Bottom Nav     │
└─────────────────┘
```

### Grid System

**Desktop Grid**
- 12-column grid
- Gutter: 24px (var(--space-6))
- Max width: 1440px
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

**Mobile Grid**
- Single column or 2-column
- Gutter: 16px (var(--space-4))
- Full-width sections

## Components

### Buttons

**Variants:**
- Primary (brand color, main actions)
- Secondary (outlined, secondary actions)
- Ghost (text only, tertiary actions)
- Danger (red, destructive actions)

**Sizes:**
- Small (sm): 32px height
- Medium (md): 40px height (default)
- Large (lg): 48px height

**States:**
- Default
- Hover
- Active
- Disabled
- Loading

### Forms

**Input Fields**
- Height: 40px (desktop), 48px (mobile)
- Border radius: 6px
- Focus ring: 2px brand color
- Error state: Red border + error message
- Disabled state: Gray background

**Labels**
- Above input (preferred)
- Inline for checkboxes/radios
- Required indicator: Red asterisk

**Validation**
- Real-time validation on blur
- Display errors below input
- Success state (green checkmark)

### Cards

**Default Card**
- Background: White
- Border: 1px gray-200
- Border radius: 8px
- Padding: 16px-24px
- Shadow: subtle (0 1px 3px rgba(0,0,0,0.1))

**Hover State** (clickable cards)
- Border: brand color
- Shadow: medium (0 4px 6px rgba(0,0,0,0.1))

### Tables

**Desktop Tables**
- Sticky header
- Zebra striping (optional)
- Row hover state
- Sortable columns
- Pagination or infinite scroll

**Mobile Tables**
- Card-based list view
- Swipeable actions
- Tap to expand details

### Modals/Dialogs

**Desktop Modal**
- Max width: 640px (default)
- Centered on screen
- Overlay: rgba(0,0,0,0.5)
- Close on overlay click or ESC key

**Mobile Modal**
- Full screen or bottom sheet
- Swipe down to dismiss
- Fixed header with close button

### Navigation

**Desktop Top Nav**
- Height: 64px
- Logo + main navigation items
- User menu (right aligned)
- Search (if applicable)

**Desktop Sidebar**
- Width: 240px (default)
- Collapsible to 64px (icon only)
- Nested navigation support
- Active state indicator

**Mobile Bottom Nav**
- Height: 56px
- 4-5 primary items
- Active state indicator
- Icon + label

## Icons

**Icon Library**: Heroicons (or similar)

**Sizes:**
- xs: 16px
- sm: 20px
- md: 24px
- lg: 32px
- xl: 48px

**Usage:**
- Always include accessible labels
- Use consistent icon set
- Align with text baseline

## Data Visualization

### Charts & Graphs

**Types:**
- Bar charts (budget comparisons)
- Line charts (progress over time)
- Pie/donut charts (cost breakdowns)
- Gantt charts (schedules)

**Colors:**
- Use semantic colors consistently
- Accessible color combinations
- Patterns for colorblind users

### Status Indicators

**Project Status:**
- On Track: Green
- At Risk: Yellow
- Delayed: Red
- Completed: Blue
- Not Started: Gray

**Time Entry Status:**
- Pending: Yellow
- Approved: Green
- Rejected: Red

### Progress Indicators

**Progress Bars**
- Height: 8px
- Border radius: 4px
- Background: gray-200
- Fill: brand color or semantic color

**Spinners**
- Size: 24px-48px
- Color: brand or context-specific
- Full-page loading: centered with overlay

## Mobile-Specific Patterns

### Touch Targets
- Minimum: 44x44px (iOS), 48x48px (Android)
- Spacing between targets: 8px minimum

### Gestures
- Swipe to delete (lists)
- Pull to refresh
- Swipe between tabs
- Pinch to zoom (photos)

### Bottom Sheets
- For contextual actions
- Swipe down to dismiss
- Handle indicator at top

### FAB (Floating Action Button)
- For primary mobile actions
- Position: bottom-right
- Size: 56x56px

## Accessibility

### Color Contrast
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Focus Indicators
- Visible focus ring (2px brand color)
- Never remove outline without replacement

### Screen Readers
- Semantic HTML
- ARIA labels where needed
- Skip navigation links
- Descriptive link text

### Keyboard Navigation
- Tab order follows visual layout
- All interactive elements keyboard-accessible
- Escape key closes modals/dropdowns

## Animation & Transitions

### Principles
- Subtle and purposeful
- Fast (200-300ms typical)
- Easing: ease-in-out

### Common Animations
- Page transitions: fade or slide
- Modal open/close: scale + fade
- Dropdown: slide down
- Notification: slide in from top/bottom

### Reduce Motion
- Respect `prefers-reduced-motion`
- Disable decorative animations
- Keep functional animations simple

## Responsive Breakpoints

```css
/* Mobile-first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Dark Mode

**Status**: Future consideration

When implementing:
- Follow system preference
- Manual toggle option
- Update all colors for dark background
- Ensure accessibility in both modes

---

**Last Updated**: 2026-02-02
**Status**: Draft - Refine as design evolves
