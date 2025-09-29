# Dark Glassmorphism Theme Guide

This document defines the visual design system for Next Galaxy, establishing consistent dark glassmorphism aesthetics across all UI components.

## Design Philosophy

The theme follows these core principles:
- **Dark Mode First**: All components designed with dark color scheme optimized for extended viewing sessions
- **Glass-morphism**: Extensive use of transparency, blur effects, and layered visuals
- **Animated Interactions**: Smooth transitions and micro-animations enhance user experience
- **Space Aesthetic**: Clean, professional appearance suitable for galaxy/space visualization contexts
- **Performance-Aware**: Optimized animations and effects that maintain 60fps in 3D environments
- **Accessibility**: High contrast ratios and readable typography for data-heavy interfaces

## Core Principles

### 1. Semi-Transparent Foundations
All UI elements use semi-transparent backgrounds to create the signature glassmorphism effect:
- **Primary surfaces**: `rgba(0, 0, 0, 0.3)` to `rgba(0, 0, 0, 0.7)`
- **Secondary surfaces**: `rgba(16, 16, 24, 0.4)` to `rgba(16, 16, 24, 0.8)`
- **Overlay elements**: `rgba(0, 0, 0, 0.9)` for modals and dropdowns

### 2. Backdrop Blur Effects
Consistent blur values create depth and hierarchy:
- **Primary blur**: `backdrop-filter: blur(12px)`
- **Secondary blur**: `backdrop-filter: blur(8px)`
- **Intense blur**: `backdrop-filter: blur(20px)` for focused elements

### 3. Dark Color Palette
Base colors maintain the dark, space-themed aesthetic:

#### Primary Colors
- **Background**: `#0a0a0f` (deep space)
- **Surface**: `#101018` (dark matter)
- **Accent**: `#1a1a2e` (nebula dark)
- **Highlight**: `#16213e` (cosmic blue)

#### Extended Palette
```css
/* Background Colors */
--bg-primary: #000000;           /* Pure black background */
--bg-secondary: #1f2937;         /* Dark gray-800 */
--bg-tertiary: #111827;          /* Gray-900 */

/* Accent Colors */
--accent-blue: #3b82f6;          /* Blue-500 */
--accent-purple: #7c3aed;        /* Purple-600 */
--accent-green: #059669;         /* Emerald-600 */
--accent-pink: #ec4899;          /* Pink-500 */
--accent-cyan: #0891b2;          /* Cyan-600 */

/* Background Blob Colors for animated effects */
--blob-purple: #581c87;          /* Purple-900 */
--blob-blue: #1e3a8a;            /* Blue-900 */
--blob-green: #064e3b;           /* Emerald-900 */
--blob-pink: #831843;            /* Pink-900 */
```

## Typography

### Text Colors
- **Primary text**: `#ffffff` (100% opacity)
- **Secondary text**: `rgba(255, 255, 255, 0.8)`
- **Muted text**: `rgba(255, 255, 255, 0.6)`
- **Disabled text**: `rgba(255, 255, 255, 0.4)`

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Font Hierarchy
- **Headings**: Use system font stack with `font-weight: 600`
- **Body text**: Use system font stack with `font-weight: 400`
- **UI elements**: Use system font stack with `font-weight: 500`

### Text Scales
```css
/* Hero/Welcome Text */
.hero-text {
  font-size: clamp(1.875rem, 4vw, 3rem); /* 3xl to 5xl responsive */
  font-weight: 400;
  color: #ffffff;
  text-align: center;
}

/* Component Headers */
.component-header {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600;
  color: #ffffff;
}

/* Body Text */
.body-text {
  font-size: 0.875rem; /* text-sm */
  font-weight: 400;
  color: #d1d5db; /* gray-300 */
}

/* Button Text */
.button-text {
  font-size: 0.875rem; /* text-sm */
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}
```

## Borders and Highlights

### Border Specifications
- **Subtle borders**: `border: 1px solid rgba(255, 255, 255, 0.1)`
- **Emphasized borders**: `border: 1px solid rgba(255, 255, 255, 0.2)`
- **Interactive borders**: `border: 1px solid rgba(255, 255, 255, 0.3)`

### Highlight Effects
- **Top highlight**: `border-top: 1px solid rgba(255, 255, 255, 0.2)`
- **Inner glow**: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1)`

## Shadow System

### Multi-Layer Shadows
Combine multiple shadows for realistic depth:

```css
/* Standard glassmorphism shadow */
.glass-shadow {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Elevated element shadow */
.elevated-shadow {
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

## Component Patterns

### Cards and Panels
```css
.glass-card {
  background: rgba(16, 16, 24, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Buttons
```css
.glass-button {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
```

### Navigation Buttons
Floating, rounded navigation buttons with hover effects and tooltips:

```css
.nav-button {
  @apply rounded-full flex items-center justify-center;
  @apply transition-all duration-300;
  @apply border border-transparent shadow-lg hover:shadow-xl;
  @apply w-12 h-12;
  @apply bg-gray-800 bg-opacity-0 hover:bg-opacity-70;
  @apply text-gray-300 hover:text-white;
  @apply hover:bg-gray-700/80 hover:border-gray-600;
  @apply hover:scale-110;
}

.nav-button-tooltip {
  @apply absolute left-full top-1/2 -translate-y-1/2 ml-2;
  @apply px-3 py-1 bg-black bg-opacity-80;
  @apply text-white text-xs rounded shadow;
  @apply opacity-0 group-hover:opacity-100;
  @apply transition-opacity duration-200 pointer-events-none;
  @apply whitespace-nowrap z-50;
}
```

### Interactive Button Grid
Grid layout for interactive buttons with hover animations:

```css
.button-grid {
  @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4;
  @apply w-full max-w-4xl px-3;
}

.grid-button {
  @apply bg-gray-800 bg-opacity-70 rounded-xl p-4;
  @apply flex flex-col items-center justify-center text-center;
  @apply text-white text-opacity-90 shadow-lg hover:shadow-2xl;
  @apply hover:bg-gray-700/70 transform hover:-translate-y-1;
  @apply transition-all duration-300 cursor-pointer relative z-10;
}
```

### Input Fields
```css
.glass-input {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
}

.glass-input:focus {
  border-color: rgba(255, 255, 255, 0.3);
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}
```

## Animation Guidelines

### Transition Standards
- **Default transition**: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **Hover effects**: `transition: transform 0.2s ease, background 0.2s ease`
- **Focus states**: `transition: border-color 0.15s ease, box-shadow 0.15s ease`

### Motion Principles
- Use subtle transforms: `translateY(-2px)` for hover states
- Avoid jarring movements or rapid animations
- Prefer opacity and transform changes over layout shifts
- Use GSAP for complex animations requiring precise timing

### Animation Timing Guidelines
- **Fast interactions**: 200ms
- **Standard transitions**: 300ms
- **Page transitions**: 500ms
- **Complex animations**: 1000ms+

### CSS Keyframe Animations
```css
/* Welcome sequence animations */
@keyframes welcome-fade {
  0% { opacity: 0; transform: scale(0.7); }
  5% { opacity: 0.8; transform: scale(0.8); }
  60% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

@keyframes buttons-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes chat-expand {
  0% { transform: scaleX(1) scaleY(0.1); opacity: 0; }
  29% { transform: scaleX(1) scaleY(0.1); opacity: 0; }
  100% { transform: scaleX(1) scaleY(1); opacity: 0.6; }
}

/* Background blob animations */
@keyframes blob-1 {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(80px, -120px) scale(1.1); }
  66% { transform: translate(-60px, 80px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes blob-2 {
  0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
  33% { transform: translate(-80px, 120px) scale(0.9) rotate(120deg); }
  66% { transform: translate(60px, -80px) scale(1.1) rotate(240deg); }
  100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
}

@keyframes blob-3 {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(120px, -60px) scale(1.2); }
  100% { transform: translate(0px, 0px) scale(1); }
}

/* Streaming/Loading indicator */
@keyframes streaming-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* Galaxy particle effects */
@keyframes particle-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(180deg); }
}
```

## Responsive Considerations

### Mobile Adaptations
- Reduce blur intensity on mobile: `backdrop-filter: blur(8px)` → `blur(6px)`
- Increase touch targets to minimum 44px
- Simplify shadows to improve performance
- Consider reduced transparency for better readability

### Dark Mode Compatibility
This theme IS the dark mode. No light mode variations needed.

## Background Effects

**Key Properties:**
- `mix-blend-screen`: Creates color blending effects
- `filter blur-xl`: Heavy blur for soft appearance
- `opacity-30`: Reduced opacity to not interfere with galaxy
- Custom animations with different timing for organic movement

### Viewport-Based Sizing
```css
/* Main container uses viewport height */
.main-container {
  height: 90vh; /* Accounts for header/footer space */
  width: 100%;
}

/* Responsive text sizing */
.hero-text {
  font-size: clamp(1.875rem, 4vw, 3rem);
}
```

## Layout System

### Responsive Grid Layouts
```jsx
/* Galaxy controls grid - responsive columns */
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

/* Dashboard card grid - flexible layout */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

/* Tool cards - auto-fit layout */
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
```

### Z-Index Management
```css
/* Z-index scale for proper layering */
:root {
  --z-background: 1;
  --z-galaxy: 5;
  --z-content: 10;
  --z-navigation: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-tooltip: 50;
}
```

## Interactive States

### Hover Effects
```css
/* Standard hover pattern */
.interactive-element {
  transition: all 300ms ease;
  transform: translateY(0);
}

.interactive-element:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Button hover with scale */
.scale-hover:hover {
  transform: scale(1.1);
}

/* Glow effect for galaxy-themed elements */
.glow-hover:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

/* Galaxy particle hover */
.particle-hover:hover {
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(59, 130, 246, 0.2),
    0 0 30px rgba(147, 51, 234, 0.1);
}
```

### Loading States
```jsx
/* Skeleton loading for galaxy controls */
<div className="animate-pulse">
  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
</div>

/* Streaming indicators */
<div className="flex items-center space-x-2">
  <div className="w-2 h-2 bg-blue-500 rounded-full animate-streaming-pulse"></div>
  <span className="text-gray-400 text-sm">Galaxy loading...</span>
</div>
```

### Custom Scrollbar
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

## Component Variants

### Container Variants
```css
:root {
  /* Main content container */
  --container-primary: bg-black bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-700 border-opacity-80;
  
  /* Card container */
  --container-card: bg-gray-900 bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl border border-gray-600 border-opacity-60 shadow-xl;
  
  /* Overlay container */
  --container-overlay: bg-black bg-opacity-90 backdrop-filter backdrop-blur-md;
  
  /* Galaxy control panel */
  --container-controls: bg-gray-800 bg-opacity-40 backdrop-filter backdrop-blur-sm rounded-2xl border border-gray-600 border-opacity-50;
}
```

### Button Sizes
```css
.btn-sm { @apply w-8 h-8 text-sm; }
.btn-md { @apply w-12 h-12 text-base; }
.btn-lg { @apply w-16 h-16 text-lg; }
```

## Accessibility Standards

### Contrast Requirements
- Ensure 4.5:1 contrast ratio for normal text
- Ensure 3:1 contrast ratio for large text
- Test with screen readers and high contrast mode
- Provide focus indicators that meet visibility requirements

### Interactive States
- **Focus**: Clear visual indication with `outline` or `box-shadow`
- **Hover**: Subtle background and transform changes
- **Active**: Slight scale or position shift to indicate interaction
- **Disabled**: Reduced opacity and no pointer events

## Implementation Checklist

When creating new components, verify:
- [ ] Background uses approved rgba values
- [ ] Backdrop blur is implemented correctly
- [ ] Borders use white with appropriate opacity
- [ ] Text contrast meets accessibility standards
- [ ] Shadows follow the multi-layer pattern
- [ ] Animations use approved transition timing
- [ ] Mobile adaptations are considered
- [ ] Focus states are clearly visible

## CSS Variables

Use these CSS custom properties for consistency:

```css
:root {
  /* Backgrounds */
  --glass-bg-primary: rgba(16, 16, 24, 0.6);
  --glass-bg-secondary: rgba(0, 0, 0, 0.4);
  --glass-bg-overlay: rgba(0, 0, 0, 0.9);
  
  /* Borders */
  --glass-border-subtle: rgba(255, 255, 255, 0.1);
  --glass-border-emphasized: rgba(255, 255, 255, 0.2);
  --glass-border-interactive: rgba(255, 255, 255, 0.3);
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-muted: rgba(255, 255, 255, 0.6);
  --text-disabled: rgba(255, 255, 255, 0.4);
  
  /* Effects */
  --blur-primary: blur(12px);
  --blur-secondary: blur(8px);
  --blur-intense: blur(20px);
  
  /* Transitions */
  --transition-default: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s ease;
  --transition-slow: all 0.5s ease;
  
  /* Extended Accent Colors */
  --accent-blue: #3b82f6;
  --accent-purple: #7c3aed;
  --accent-green: #059669;
  --accent-pink: #ec4899;
  --accent-cyan: #0891b2;
  
  /* Background Blobs */
  --blob-purple: #581c87;
  --blob-blue: #1e3a8a;
  --blob-green: #064e3b;
  --blob-pink: #831843;
  
  /* Z-Index Management */
  --z-background: 1;
  --z-galaxy: 5;
  --z-content: 10;
  --z-navigation: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-tooltip: 50;
}
```

## Performance Considerations

### Animation Performance
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflow)
- Use `will-change` property sparingly and remove after animation
- Limit simultaneous animations to maintain 60fps alongside galaxy simulation

### Glassmorphism Optimization
```css
/* Efficient backdrop-filter usage */
.optimized-glass {
  backdrop-filter: blur(12px);
  /* Use transform3d to force GPU acceleration */
  transform: translate3d(0, 0, 0);
  /* Optimize for compositing */
  will-change: transform;
}

/* Remove will-change after animation */
.optimized-glass.animation-complete {
  will-change: auto;
}
```

### Mobile Performance
- Reduce blur intensity on mobile: `blur(12px)` → `blur(8px)`
- Simplify shadows on touch devices
- Use `prefers-reduced-motion` for accessibility
- Limit background blob animations on low-power devices

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
```

## Examples

Reference the following components as implementation examples:
- `app/components/LoadingScreen.tsx` - Proper glassmorphism loading UI
- `app/galaxy/GalaxyCanvas.tsx` - 3D component integration with theme
- `app/globals.css` - Base theme implementation

This theme guide ensures consistent, professional dark glassmorphism aesthetics that complement the galaxy simulation and maintain visual coherence across all user interface elements.