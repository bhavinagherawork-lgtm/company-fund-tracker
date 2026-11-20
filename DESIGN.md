# DESIGN SYSTEM SPECIFICATION: Reui

> Target Domain: https://reui.io
> System Classification: AI Extracted Website
> Extracted Date: 2026-11-20
> Specification Standard: Context.dev System RFC v2

---

## 1. Brand Identity & Principles

Extracted visual design system and tokens for reui.io.

### Design Pillars

- **Visual Discipline**: Strict chromatic hierarchy centered around brand identity and high contrast ratios.
- **Utilitarian Density**: Balanced whitespace engineered for frictionless content navigation and task efficiency.
- **Component Consistency**: Predictable interactive control states and geometric corner radii.

---

## 2. Color Palette & Semantic Tokens

| Token                     | Hex Value | Role                   | Contrast  | Recommended Usage                           |
| :------------------------ | :-------- | :--------------------- | :-------- | :------------------------------------------ |
| `--obsidian-gold-primary` | `#18181B` | Primary CTA / Brand    | `#FFFFFF` | UI elements matching primary cta / brand    |
| `--accent-highlight`      | `#EAB308` | Focus / Active State   | `#FFFFFF` | UI elements matching focus / active state   |
| `--canvas-base`           | `#FAFAFA` | Document Background    | `#09090B` | UI elements matching document background    |
| `--surface-container`     | `#FFFFFF` | Card / Panel Surface   | `#09090B` | UI elements matching card / panel surface   |
| `--structural-border`     | `#E4E4E7` | Dividers / Line Stroke | `#71717A` | UI elements matching dividers / line stroke |
| `--high-contrast-text`    | `#09090B` | Headlines              | `#FAFAFA` | UI elements matching headlines              |
| `--muted-typography`      | `#71717A` | Body Copy / Labels     | `#FAFAFA` | UI elements matching body copy / labels     |
| `--status-accent`         | `#22C55E` | Validation / Active    | `#FFFFFF` | UI elements matching validation / active    |

### CSS Variables Definition (:root)

```css
:root {
  --obsidian-gold-primary: #18181b; /* Primary CTA / Brand */
  --accent-highlight: #eab308; /* Focus / Active State */
  --canvas-base: #fafafa; /* Document Background */
  --surface-container: #ffffff; /* Card / Panel Surface */
  --structural-border: #e4e4e7; /* Dividers / Line Stroke */
  --high-contrast-text: #09090b; /* Headlines */
  --muted-typography: #71717a; /* Body Copy / Labels */
  --status-accent: #22c55e; /* Validation / Active */
}
```

---

## 3. Typography Hierarchy & Font Stacks

- **Heading Stack**: `Space Grotesk, sans-serif`
- **Body / Interface Stack**: `Inter, sans-serif`
- **Code / Monospace Stack**: `Space Mono, monospace`

### Typographic Scale

| Hierarchy Level    | Font Size | Weight | Line Height | Usage Context                    |
| :----------------- | :-------- | :----- | :---------- | :------------------------------- |
| **Hero Banner**    | `48px`    | `700`  | `1.1`       | Hero Banner typographic roles    |
| **Section Header** | `32px`    | `600`  | `1.25`      | Section Header typographic roles |
| **Subhead**        | `22px`    | `600`  | `1.3`       | Subhead typographic roles        |
| **Body Regular**   | `15px`    | `400`  | `1.5`       | Body Regular typographic roles   |
| **Label**          | `13px`    | `500`  | `1.4`       | Label typographic roles          |

### CSS Typography Mixins

```css
--type-hero-banner: 700 48px/1.1 Space Grotesk, sans-serif;
--type-section-header: 600 32px/1.25 Inter, sans-serif;
--type-subhead: 600 22px/1.3 Inter, sans-serif;
--type-body-regular: 400 15px/1.5 Inter, sans-serif;
--type-label: 500 13px/1.4 Inter, sans-serif;
```

---

## 4. Spacing Grid, Radii & Depth Tokens

- **Base Spacing Unit**: `4px / 8px scale`

### Geometric Corner Radii

| Token Name               | Radius Value | Target Controls & Containers      |
| :----------------------- | :----------- | :-------------------------------- |
| `--radius-pill-button`   | `9999px`     | Pill Button controls & elements   |
| `--radius-soft-card`     | `16px`       | Soft Card controls & elements     |
| `--radius-modal-overlay` | `24px`       | Modal Overlay controls & elements |

### Elevation & Box Shadows

| Shadow Token             | CSS Box-Shadow Value                 | Elevation Role            |
| :----------------------- | :----------------------------------- | :------------------------ |
| `--shadow-subtle-float`  | `0 2px 8px rgba(0, 0, 0, 0.06)`      | Subtle Float depth layer  |
| `--shadow-elevated-card` | `0 8px 24px -4px rgba(0, 0, 0, 0.1)` | Elevated Card depth layer |

---

## 5. Core Component Anatomy & CSS Specifications

### Primary Action Button

```css
/* Primary interactive call-to-action */
.btn-primary {
  background: #18181b;
  color: #ffffff;
  font-weight: 500;
  border-radius: 9999px;
  padding: 10px 20px;
}
```

### Card Container

```css
/* Elevated content panel */
.card-surface {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 24px;
}
```

### Form Input Field

```css
/* Standard interactive text input */
.input-control {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 9999px;
  height: 44px;
  padding: 0 14px;
}
```

---

## 6. Motion Tokens & Micro-Interactions

The motion system for **Reui** is engineered with strict timing scales and deceleration curves.

### Easing Functions

| Curve Name   | Cubic Bezier Definition             | Interaction Role                         |
| :----------- | :---------------------------------- | :--------------------------------------- |
| **Standard** | `cubic-bezier(0.16, 1, 0.3, 1)`     | Button hovers, micro-interactions        |
| **Entrance** | `cubic-bezier(0.16, 1, 0.3, 1)`     | Viewport reveals, modal dialog entries   |
| **Hover**    | `cubic-bezier(0.16, 1, 0.3, 1)`     | State shifts, tooltip appearances        |
| **Bounce**   | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring physics, playful tactile feedback |

### Timing Durations

- **Instant**: `110ms` (checkboxes, radio buttons, icons)
- **Fast**: `180ms` (button hover, chip selection, tooltips)
- **Normal**: `270ms` (card elevation, dropdown menus)
- **Slow**: `440ms` (page transitions, complex modal reveals)

### Keyframe Animation Snippets

```css
/* Shimmer Loading Skeleton */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Scroll Entrance Fade & Slide */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 7. AI Agent Implementation Directives

When implementing features or refactoring UI for **Reui**, AI coding agents (Cursor, Claude, Copilot, Antigravity) MUST obey these constraints:

1. **Never introduce arbitrary hex codes**: Use solely the extracted semantic tokens defined in Section 2.
2. **Preserve Font Pairings**: Ensure headings strictly use `Space Grotesk` and body copy uses `Inter`.
3. **Respect Corner Geometry**: Apply `9999px` for interactive controls and `16px` for cards and modals.
4. **Contrast Compliance**: Ensure text contrast meets WCAG AA standards using the contrast pairings defined in Section 2.
5. **Honor Motion Physics**: Use `cubic-bezier(0.16, 1, 0.3, 1)` for all hover transitions and `180ms` for button micro-interactions.
