# Component Structure Documentation

## Overview

This project follows **Atomic Design** principles with a **theme system** for customizable event pages.

## Folder Structure

```
src/components/
├── atoms/              # Basic building blocks
│   ├── Button.tsx      # Themeable button component
│   ├── Input.tsx       # Form input with label/error
│   └── Card.tsx        # Container component
│
├── molecules/          # Combined atoms
│   ├── FormField.tsx   # Label + Input + Error
│   └── MediaCard.tsx   # Image/video card
│
├── organisms/          # Complex components
│   ├── Timeline.tsx           # Social media-style timeline
│   ├── PhotoGallery.tsx       # Photo grid with lightbox
│   ├── ProgrammeList.tsx      # Event programme/timeline
│   ├── VendorSection.tsx      # Vendor showcase
│   ├── EventHeader.tsx        # Event hero section
│   ├── InvitationManager.tsx  # Invitation templates/upload
│   └── QRCodeUpload.tsx       # Guest photo upload
│
├── layout/             # Layout components
│   ├── Navbar.tsx      # Navigation (dashboard/public variants)
│   └── Footer.tsx      # Footer (dashboard/public variants)
│
├── templates/          # Page layouts
│   ├── DashboardLayout.tsx    # Organizer dashboard layout
│   └── PublicEventLayout.tsx  # Guest-facing event layout (themeable)
│
└── shared/             # Shared utilities
    ├── LoadingSpinner.tsx
    └── ErrorMessage.tsx
```

## Theme System

### ThemeProvider
Wraps components and provides theme context. Automatically applies CSS variables.

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext'

<ThemeProvider theme={customTheme}>
  <YourComponent />
</ThemeProvider>
```

### CSS Variables
All themeable components use CSS variables:
- `--theme-primary` - Primary brand color
- `--theme-secondary` - Secondary/accent color
- `--theme-background` - Background color
- `--theme-text` - Text color
- `--theme-accent` - Accent/hover color

## Component Usage Examples

### Dashboard (Organizer Interface)

```tsx
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { Button, Card } from '@/components'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Card>
        <h1>My Events</h1>
        <Button variant="primary">Create Event</Button>
      </Card>
    </DashboardLayout>
  )
}
```

### Public Event Page (Guest Interface)

```tsx
import { PublicEventLayout } from '@/components/templates/PublicEventLayout'
import { EventHeader, ProgrammeList, PhotoGallery } from '@/components'

export default function EventPage({ event, theme }) {
  return (
    <PublicEventLayout theme={theme}>
      <EventHeader {...event} />
      <ProgrammeList items={event.programme} />
      <PhotoGallery photos={event.photos} />
    </PublicEventLayout>
  )
}
```

## Component Variants

### Button Variants
- `primary` - Main action (uses theme primary color)
- `secondary` - Secondary action
- `outline` - Outlined button
- `ghost` - Minimal button
- `danger` - Destructive action

### Card Variants
- `default` - White background with border
- `outlined` - Transparent with colored border
- `elevated` - White with shadow

### Navbar/Footer Variants
- `dashboard` - For organizer interface
- `public` - For guest-facing pages

## Design Patterns

### 1. Themeable Components
All components that need theming use CSS variables:
```tsx
style={{ backgroundColor: 'var(--theme-primary)' }}
```

### 2. Responsive Design
All components are mobile-first and responsive using Tailwind breakpoints:
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)

### 3. Composition
Components are built to be composed together:
```tsx
<Card>
  <EventHeader />
  <ProgrammeList />
  <PhotoGallery />
</Card>
```

## Adding New Components

1. **Atoms** - Basic, single-purpose components
2. **Molecules** - Combinations of atoms
3. **Organisms** - Complex, feature-specific components
4. **Templates** - Page-level layouts
5. **Pages** - Full page compositions (in `app/` directory)

## Best Practices

1. **Use TypeScript interfaces** for all props
2. **Make components themeable** using CSS variables
3. **Keep components focused** - single responsibility
4. **Export from index.ts** for easier imports
5. **Use Tailwind CSS** for styling
6. **Make components responsive** by default
7. **Handle loading/error states** appropriately

