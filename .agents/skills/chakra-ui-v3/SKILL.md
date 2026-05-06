---
name: chakra-ui-v3
description: Chakra UI v3 component library for building accessible React interfaces
---

# Chakra UI v3 Skill

This project uses Chakra UI v3 for component primitives and styling.

## Setup

Chakra UI v3 requires a `ChakraProvider` wrapping the app:

```tsx
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      {/* Your app */}
    </ChakraProvider>
  )
}
```

## Key Components Used

### Layout
- `Box`, `Flex`, `Grid` — layout primitives
- `Container` — centered content wrapper
- `Stack`, `HStack`, `VStack` — flex layouts with spacing

### Data Display
- `Table` — for table view of manga
- `Card` — for kanban cards
- `Badge` — status indicators

### Forms
- `Input`, `Textarea` — text fields
- `Select` — dropdowns for status
- `Button` — actions
- `FormControl`, `FormLabel` — form structure

### Feedback
- `Spinner` — loading states
- `Alert` — error/success messages
- `Toast` — notifications

### Drag & Drop
For kanban, use `@dnd-kit` library integrated with Chakra components.

## Theming

Chakra UI v3 uses a system-based theming approach. Customize via:
- Color mode (light/dark)
- Semantic tokens
- Component variants

## Accessibility

Chakra components are accessible by default:
- Keyboard navigation
- ARIA attributes
- Focus management

Use Chakra's built-in accessibility features rather than reinventing.

## Resources

- [Chakra UI v3 Docs](https://chakra-ui.com/)
- [Component Reference](https://chakra-ui.com/docs/components)
