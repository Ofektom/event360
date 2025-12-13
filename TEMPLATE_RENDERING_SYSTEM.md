# Template Rendering System Documentation

## Overview

The Gbedoo invitation template system uses a **hybrid approach** combining:
1. **Programmatic Template Rendering** - React components that render templates
2. **Free Template Sources** - Unsplash integration for preview images
3. **Template Rendering Engine** - html2canvas for generating preview images

## Architecture

### 1. Template Components (`src/components/templates/invitations/`)

Each template is a React component that renders the invitation design:

- **ElegantWeddingTemplate.tsx** - Classic wedding invitations
- **ModernBirthdayTemplate.tsx** - Fun birthday celebrations
- **CorporateEventTemplate.tsx** - Professional corporate events
- **CelebrationTemplate.tsx** - General celebrations

**How it works:**
- Components receive `config` (template structure) and `designData` (user customizations)
- They render HTML/CSS with inline styles based on the data
- Each template has a unique layout and styling

### 2. Template Renderer (`src/lib/template-renderer.ts`)

The core utility that handles template rendering:

**Key Functions:**
- `generatePreviewFromElement()` - Converts HTML element to image using html2canvas
- `generateTemplatePreview()` - Creates temporary DOM, renders template, generates image
- `getUnsplashImageUrl()` - Gets free images from Unsplash for previews
- `getUnsplashQueryForCategory()` - Maps categories to Unsplash search queries

**How html2canvas works:**
1. Takes an HTML element (the rendered template)
2. Renders it to a canvas element
3. Converts canvas to image (PNG data URL)
4. Returns the image URL

### 3. Preview Component (`src/components/organisms/InvitationPreview.tsx`)

Client-side component that:
- Renders the template using `TemplateRenderer`
- Generates preview images on-the-fly
- Updates when design data changes
- Can export preview images

**Usage:**
```tsx
<InvitationPreview
  templateType="Elegant Wedding"
  config={templateConfig}
  designData={userDesignData}
  onPreviewGenerated={(previewUrl) => {
    // Handle generated preview
  }}
/>
```

### 4. Seed Templates (`src/lib/seed-templates.ts`)

Initial templates seeded into the database:

**Templates included:**
1. Elegant Wedding
2. Modern Birthday
3. Corporate Event
4. Celebration
5. Rustic Wedding (new)
6. Kids Birthday (new)
7. Anniversary (new)
8. Graduation (new)

**Preview Images:**
- Uses Unsplash Source API (no API key required)
- Automatically generates preview URLs based on category
- Format: `https://source.unsplash.com/400x500/?{query}`

### 5. API Routes

**`/api/invitations/templates/seed`** - Seeds initial templates
- Requires authentication
- Creates/updates templates with Unsplash previews
- Can be called from the UI (seed button in template library)

**`/api/invitations/templates/generate-preview`** - Generates preview for existing templates
- Can use Unsplash or programmatic generation
- Updates template with preview URL

## How Templates Work

### Template Structure

Each template has:
```typescript
{
  name: string
  description: string
  category: string
  preview: string | null  // Unsplash URL or generated image
  config: {
    textFields: Array<{
      id: string
      label: string
      placeholder: string
      default: string
    }>
    colors: {
      primary: string
      secondary: string
      accent?: string
      background: string
      text: string
      heading?: string
      body?: string
    }
    graphics: Array<{
      id: string
      type: string
      url: string
    }>
  }
}
```

### Rendering Flow

1. **User selects template** → Template config loaded
2. **User customizes** → Design data updated
3. **Preview updates** → `InvitationPreview` component:
   - Renders template with `TemplateRenderer`
   - Generates image with `html2canvas`
   - Displays preview
4. **User saves** → Design saved to database

### Live Preview

The design editor shows a **live preview** that:
- Updates in real-time as user changes colors/text
- Uses the actual template component for rendering
- Generates preview images automatically
- Can be exported/downloaded

## Adding New Templates

### Step 1: Create Template Component

Create a new file in `src/components/templates/invitations/`:

```tsx
// MyNewTemplate.tsx
export function MyNewTemplate({ config, designData }) {
  const colors = { ...config.colors, ...designData.colors }
  const text = designData.text || {}
  
  return (
    <div style={{ /* your styles */ }}>
      {/* Your template layout */}
    </div>
  )
}
```

### Step 2: Register in TemplateRenderer

Add to `src/components/templates/invitations/TemplateRenderer.tsx`:

```tsx
const templateMap = {
  // ... existing
  'My New Template': MyNewTemplate,
  'my-new': MyNewTemplate,
}
```

### Step 3: Add to Seed Templates

Add to `src/lib/seed-templates.ts`:

```typescript
{
  name: 'My New Template',
  description: 'Description',
  category: 'category',
  preview: null, // Will be auto-generated
  config: { /* your config */ },
  isDefault: false,
  isActive: true,
}
```

### Step 4: Add Unsplash Query (Optional)

Add to `getUnsplashQueryForCategory()` in `template-renderer.ts`:

```typescript
const queries = {
  // ... existing
  'my-category': 'my search query',
}
```

## Using Free Template Sources

### Unsplash Integration

**How it works:**
- Uses Unsplash Source API (no authentication needed)
- Format: `https://source.unsplash.com/{width}x{height}/?{query}`
- Automatically fetches relevant images based on category

**Example:**
```typescript
const previewUrl = getUnsplashImageUrl('wedding invitation elegant', 400, 500)
// Returns: https://source.unsplash.com/400x500/?wedding%20invitation%20elegant
```

**Benefits:**
- Free, no API key required
- High-quality images
- Automatic relevance based on query
- No storage needed (direct URLs)

### Adding Other Sources

You can extend the system to use:
- **Pexels API** - Similar to Unsplash
- **Pixabay API** - Free images
- **Custom image storage** - Your own template images
- **Generated images** - Programmatically created previews

## Template Rendering Engine (html2canvas)

### How It Works

1. **Input**: HTML element (rendered template)
2. **Process**: 
   - Renders element to canvas
   - Captures all styles (CSS, inline styles)
   - Handles images, fonts, etc.
3. **Output**: Image data URL (PNG)

### Usage

```typescript
import { generatePreviewFromElement } from '@/lib/template-renderer'

const element = document.getElementById('my-template')
const imageUrl = await generatePreviewFromElement(element, {
  width: 400,
  height: 500,
  scale: 2, // For high-DPI displays
})
```

### Limitations

- Some CSS features may not render perfectly
- External fonts must be loaded
- Complex animations may not work
- Browser compatibility varies

### Alternatives

If html2canvas doesn't meet your needs:
- **Puppeteer** - Server-side rendering (more reliable)
- **Playwright** - Similar to Puppeteer
- **Canvas API** - Manual drawing (more control)
- **SVG to PNG** - For SVG-based templates

## Best Practices

1. **Template Design**
   - Keep layouts simple and clean
   - Use web-safe fonts or load custom fonts
   - Test across different screen sizes
   - Ensure colors have good contrast

2. **Performance**
   - Debounce preview generation (500ms delay)
   - Cache generated previews
   - Use lazy loading for template library
   - Optimize image sizes

3. **User Experience**
   - Show loading states during preview generation
   - Provide fallback for failed previews
   - Allow users to regenerate previews
   - Support preview download/export

4. **Maintenance**
   - Keep template components modular
   - Document template config structure
   - Version control template designs
   - Test templates after updates

## Future Enhancements

1. **Server-Side Rendering**
   - Use Puppeteer for more reliable previews
   - Generate previews on template save
   - Cache previews in database/storage

2. **More Template Sources**
   - Integrate Pexels API
   - Allow users to upload template images
   - Community template marketplace

3. **Advanced Features**
   - Drag-and-drop template builder
   - AI-generated templates
   - Template versioning
   - Template sharing between users

4. **Export Options**
   - PDF generation
   - High-resolution image export
   - Print-ready formats
   - Social media optimized sizes

## Troubleshooting

### Preview Not Generating
- Check browser console for errors
- Ensure html2canvas is loaded
- Verify template component renders correctly
- Check element dimensions

### Unsplash Images Not Loading
- Verify network connection
- Check Unsplash service status
- Try different search queries
- Consider fallback images

### Template Not Rendering
- Check template component imports
- Verify config structure matches template
- Test with default data first
- Check for CSS conflicts

## Summary

The hybrid template system provides:
- ✅ **Flexibility** - Multiple rendering approaches
- ✅ **Free Resources** - Unsplash integration
- ✅ **Live Previews** - Real-time design updates
- ✅ **Scalability** - Easy to add new templates
- ✅ **User-Friendly** - Simple customization interface

This system balances ease of use, performance, and extensibility for a production-ready invitation template system.

