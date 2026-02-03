# @promanage/ui-components

Shared React component library for ProManage web applications.

## Overview

A collection of reusable, accessible React components built with Radix UI and TailwindCSS for use in ProManage web applications.

## Installation

```bash
# This package is part of the ProManage monorepo
# Install from project root
pnpm install
```

## Usage

```typescript
import { Button, Input, Card } from '@promanage/ui-components'

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button>Submit</Button>
    </Card>
  )
}
```

## Components

### Form Components

- `Button` - Styled button with variants
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Select` - Dropdown select
- `Checkbox` - Checkbox input
- `Radio` - Radio button input
- `Switch` - Toggle switch
- `Label` - Form label

### Layout Components

- `Card` - Content container
- `Container` - Page container
- `Stack` - Vertical/horizontal stack
- `Grid` - CSS Grid layout
- `Separator` - Visual divider

### Navigation Components

- `Tabs` - Tab navigation
- `Breadcrumbs` - Navigation breadcrumbs
- `Pagination` - Page pagination

### Feedback Components

- `Alert` - Alert messages
- `Toast` - Toast notifications
- `Dialog` - Modal dialog
- `Tooltip` - Hover tooltip
- `Progress` - Progress indicator
- `Skeleton` - Loading skeleton

### Data Display

- `Table` - Data table
- `Badge` - Status badge
- `Avatar` - User avatar
- `StatusIndicator` - Status dot

## Development

### Storybook

```bash
# Start Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

Visit [http://localhost:6006](http://localhost:6006)

### Build

```bash
# Build components
pnpm build

# Watch mode
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Coverage
pnpm test:coverage
```

## Component Guidelines

### Accessibility

All components follow WAI-ARIA guidelines:
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA attributes

### Styling

Components use TailwindCSS with custom design tokens:
- Consistent spacing
- Color palette
- Typography scale
- Responsive breakpoints

### Props

Components accept standard HTML props plus custom variants:
```typescript
<Button
  variant="primary"  // primary | secondary | ghost | danger
  size="md"         // sm | md | lg
  disabled={false}
  onClick={handleClick}
>
  Click me
</Button>
```

## Package Structure

```
packages/ui-components/
├── src/
│   ├── components/      # React components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   ├── hooks/          # Shared hooks
│   ├── utils/          # Component utilities
│   └── index.ts        # Main export
├── stories/            # Storybook stories
└── tests/              # Component tests
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
