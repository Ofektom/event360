# Shapes and Symbols Implementation

## Overview
This document describes the implementation of shapes and symbols for the invitation design system.

## Database Schema
Added `DesignShape` model to `prisma/schema.prisma`:
- Stores reusable shapes and symbols
- Includes SVG path data, default colors, categories, and types

## Components Created

### 1. `ShapesLibrary.tsx`
- Browse and search shapes/symbols
- Filter by category and type
- Click to add shape to design

### 2. `EditableShape.tsx`
- Interactive shape component
- Drag to move (mouse events)
- Resize handle in bottom-right corner
- Color picker support
- Delete button when selected

### 3. API Route: `/api/shapes`
- GET endpoint to fetch all shapes
- Supports filtering by category and type

### 4. Seed Script: `scripts/seed-shapes.ts`
- Seeds 16 default shapes and symbols
- Categories: geometric, decorative, symbols
- Types: shape, symbol

## Integration Steps

1. **Run Migration:**
   ```bash
   npx prisma migrate dev --name add_design_shapes
   ```

2. **Seed Shapes:**
   ```bash
   pnpm seed:shapes
   ```

3. **Update InvitationDesignEditor:**
   - Add shapes state management
   - Add ShapesLibrary component
   - Add EditableShape overlay on preview
   - Save shapes in designData

4. **Update Template Renderer:**
   - Render shapes in template preview
   - Support shapes in BlankTemplate

## Shape Data Structure
```typescript
interface DesignShape {
  id: string
  name: string
  svgPath: string
  color: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation?: number
}
```

## Features
- ✅ Browse shapes library
- ✅ Add shapes to design
- ✅ Drag to reposition
- ✅ Resize with mouse (drag handle)
- ✅ Change color
- ✅ Delete shapes
- ✅ Save shapes with design

