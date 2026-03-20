# @promanage/ui-components

Shared React component library for ProManage. Built on Radix UI primitives + CVA variants + TailwindCSS. 26 components.

---

## Build

```bash
pnpm --filter @promanage/ui-components build
```

React is a `peerDependency` — do not add it as a direct dep. Tailwind is not a dep; the consuming app runs Tailwind and must scan this package's source:

```typescript
// apps/web/tailwind.config.ts
content: [
  './src/**/*.{ts,tsx}',
  '../../packages/ui-components/src/**/*.{ts,tsx}',
]
```

---

## Components

### Form
`Button`, `Input`, `Textarea`, `Label`, `Checkbox`, `RadioGroup`, `Switch`, `Select`

### Layout
`Card` (+ `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`), `Container`, `Stack`, `Grid`, `Separator`

### Navigation
`Tabs`, `Breadcrumbs`, `Pagination`

### Feedback
`Alert`, `Toast` (+ `ToastProvider`, `ToastViewport`), `Dialog`, `Tooltip` (+ `TooltipProvider`), `Progress`, `Skeleton`

### Data Display
`Table` (+ `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), `Badge`, `Avatar`, `StatusIndicator`

### Utils
`cn()` — `clsx` + `tailwind-merge`

---

## Usage

```typescript
import { Button, Input, Card, CardContent, Badge, cn } from '@promanage/ui-components'

function Example() {
  return (
    <Card>
      <CardContent>
        <Input placeholder="Project name" />
        <Button variant="default" size="md">Save</Button>
        <Badge variant="outline">Active</Badge>
      </CardContent>
    </Card>
  )
}
```

### Button variants

```typescript
<Button variant="default" />   // primary filled
<Button variant="outline" />   // bordered
<Button variant="ghost" />     // transparent
<Button variant="destructive" /> // red
```

---

## License

AGPL-3.0 — See [LICENSE](../../LICENSE)
