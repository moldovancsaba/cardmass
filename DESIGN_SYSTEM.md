# DESIGN SYSTEM

Version: 1.17.1  
Updated: 2025-12-21T22:04:14.780Z

## Philosophy

**CRITICAL RULES:**
1. ❌ **NO hardcoded styles in components**
2. ✅ **ALL styles defined in centralized design system components**
3. ✅ **Reuse components - NEVER duplicate styles**
4. ✅ **Single source of truth for colors, spacing, typography**

## Components

### Button (`src/components/Button.tsx`)

**Usage:**
```tsx
import { Button } from '@/components/Button'

// As link
<Button as="link" href="/path">Click Me</Button>

// As button
<Button onClick={handleClick}>Submit</Button>
<Button type="submit" variant="danger">Delete</Button>
```

**Variants:**
- `primary` (default) - Blue gradient, white text
- `secondary` - Gray solid, white text
- `danger` - Red solid, white text
- `ghost` - Transparent, gray text
- `outline` - Transparent with border, gray text

**Sizes:**
- `sm` - Small (px-3 py-1.5 text-sm)
- `md` (default) - Medium (px-5 py-3 text-base)
- `lg` - Large (px-6 py-4 text-lg)

**Props:**
- `variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'`
- `size?: 'sm' | 'md' | 'lg'`
- `fullWidth?: boolean` - Make button full width
- `disabled?: boolean` - Disable button
- `className?: string` - Additional custom classes (use sparingly)

**Examples:**
```tsx
// Primary button (SSO login)
<Button as="link" href="/api/auth/sso/login">Sign in with SSO</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>Delete</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>

// Full width
<Button fullWidth>Submit Form</Button>
```

## Colors

**Primary Palette:**
- Blue: `blue-600` to `blue-700` (primary actions)
- Cyan: `cyan-600` to `cyan-700` (gradient accent)
- Gray: `gray-50` to `gray-900` (neutrals)
- Red: `red-600` to `red-700` (danger/errors)

**Semantic Colors:**
- **Primary Action**: Blue-Cyan gradient
- **Secondary Action**: Gray solid
- **Danger/Delete**: Red solid
- **Success**: Green (future)
- **Warning**: Yellow/Orange (future)
- **Error Messages**: `bg-red-50` border `border-red-200` text `text-red-800`
- **Info Messages**: `bg-blue-50` border `border-blue-200` text `text-blue-800`

## Typography

**Headings:**
- H1: `text-3xl font-bold` (page titles)
- H2: `text-2xl font-bold` (section headers)
- H3: `text-xl font-semibold` (subsections)
- H4: `text-lg font-semibold` (cards)

**Body:**
- Base: `text-base` (default)
- Small: `text-sm` (labels, captions)
- Extra Small: `text-xs` (helper text)

**Weights:**
- Normal: `font-normal` (body text)
- Medium: `font-medium` (buttons, emphasis)
- Semibold: `font-semibold` (subheadings)
- Bold: `font-bold` (headings)

## Spacing

**Consistent spacing scale:**
- `gap-1` (0.25rem / 4px)
- `gap-2` (0.5rem / 8px)
- `gap-3` (0.75rem / 12px)
- `gap-4` (1rem / 16px)
- `gap-6` (1.5rem / 24px)
- `gap-8` (2rem / 32px)

**Padding/Margin:**
- Use same scale for `p-`, `px-`, `py-`, `m-`, `mx-`, `my-`
- Standard section padding: `py-10 px-4`
- Card padding: `p-6` or `p-8`

## Layout

**Container:**
- Max width: `max-w-5xl` (sections)
- Max width (wide): `max-w-7xl` (dashboards)
- Centering: `mx-auto`

**Flexbox:**
- Row: `flex flex-row`
- Column: `flex flex-col`
- Center: `items-center justify-center`
- Space between: `justify-between`
- Gap: Use `gap-{n}` instead of margins

**Grid:**
- Cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

## Borders & Shadows

**Borders:**
- Default: `border border-gray-200`
- Thick: `border-2`
- Rounded: `rounded-lg` (standard for cards/buttons)
- Fully rounded: `rounded-full` (badges, pills)

**Shadows:**
- Subtle: `shadow-sm` (buttons)
- Default: `shadow` (cards at rest)
- Medium: `shadow-md` (elevated cards)
- Large: `shadow-lg` (modals, hover states)

## Forms

**Input Fields:**
```tsx
className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
```

**Labels:**
```tsx
className="block text-sm font-medium text-gray-700 mb-2"
```

## Migration Plan

### Phase 1: Core Components (COMPLETED)
- ✅ Button component created

### Phase 2: Replace Hardcoded Buttons
- [ ] Update app/page.tsx (home page SSO button)
- [ ] Update app/admin/login/page.tsx
- [ ] Update app/admin/dashboard/page.tsx
- [ ] Update all other pages with buttons

### Phase 3: Additional Components
- [ ] Create Input component
- [ ] Create Card component
- [ ] Create Badge component
- [ ] Create Alert/Message component

### Phase 4: Documentation
- [ ] Add examples for all components
- [ ] Create Storybook or component showcase page

## Rules for New Components

1. **Check first**: Does a component already exist?
2. **Reuse**: Use existing Button, Input, Card components
3. **Extend carefully**: Only add custom classes when absolutely necessary
4. **Document**: If creating new component, add to this file
5. **No hardcoding**: All styles must come from design system

## Anti-Patterns (FORBIDDEN)

❌ **DON'T DO THIS:**
```tsx
// Hardcoded button styles
<Link className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-white...">
  Login
</Link>

// Duplicate styles
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
```

✅ **DO THIS:**
```tsx
// Use design system components
<Button as="link" href="/login">Login</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
```

## Enforcement

- **Code Reviews**: Check for hardcoded styles
- **Refactor Priority**: Replace hardcoded styles when touching code
- **New Code**: MUST use design system components
