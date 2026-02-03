# @promanage/mobile-components

Shared React Native component library for ProManage mobile app.

## Overview

A collection of reusable React Native components optimized for mobile interfaces and field-focused tasks.

## Installation

```bash
# This package is part of the ProManage monorepo
# Install from project root
pnpm install
```

## Usage

```typescript
import { Button, Input, Card } from '@promanage/mobile-components'

function MyScreen() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button onPress={handlePress}>Submit</Button>
    </Card>
  )
}
```

## Components

### Form Components

- `Button` - Touch-optimized button
- `Input` - Text input with validation
- `Textarea` - Multi-line text input
- `Picker` - Dropdown picker
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio button group
- `Switch` - Toggle switch

### Layout Components

- `Card` - Content container
- `Container` - Screen container
- `Stack` - Vertical/horizontal stack
- `Divider` - Visual separator
- `SafeAreaView` - Safe area wrapper

### Navigation Components

- `TabBar` - Bottom tab bar
- `Header` - Screen header
- `BackButton` - Navigation back button

### Feedback Components

- `Alert` - Alert dialog
- `Toast` - Toast notification
- `LoadingSpinner` - Loading indicator
- `ProgressBar` - Progress indicator
- `Skeleton` - Loading skeleton

### Data Display

- `List` - Optimized list (FlashList)
- `Badge` - Status badge
- `Avatar` - User avatar
- `StatusDot` - Status indicator
- `EmptyState` - Empty list state

### Field-Specific

- `CameraButton` - Photo capture button
- `LocationDisplay` - GPS location display
- `TimeClockButton` - Clock in/out button
- `PhotoGrid` - Photo thumbnail grid

## Development

### Build

```bash
# Build package
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

### Touch Targets

All interactive components meet minimum touch target sizes:
- Minimum 44x44pt (iOS)
- Minimum 48x48dp (Android)

### Performance

- Use FlashList for long lists
- Memoize expensive components
- Lazy load images

### Styling

Components use NativeWind (Tailwind for React Native):
```typescript
<Button className="bg-blue-500 p-4 rounded-lg">
  Press me
</Button>
```

## Package Structure

```
packages/mobile-components/
├── src/
│   ├── components/      # React Native components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   ├── hooks/          # Shared hooks
│   ├── utils/          # Component utilities
│   └── index.ts        # Main export
└── tests/              # Component tests
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

AGPL-3.0 - See [LICENSE](../../LICENSE)
