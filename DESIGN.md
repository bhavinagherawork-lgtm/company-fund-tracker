# DESIGN SYSTEM SPECIFICATION: Admission

> Target Domain: https://admission.gnums.co.in
> System Classification: AI Extracted Website
> Extracted Date: 2026-11-19
> Specification Standard: Context.dev System RFC v2

---

## 1. Brand Identity & Principles

Extracted visual design system and tokens for admission.gnums.co.in.

### Design Pillars

- **Visual Discipline**: Strict chromatic hierarchy centered around brand identity and high contrast ratios.
- **Utilitarian Density**: Balanced whitespace engineered for frictionless content navigation and task efficiency.
- **Component Consistency**: Predictable interactive control states and geometric corner radii.

---

## 2. Color Palette & Semantic Tokens

| Token                        | Hex Value | Role                   | Contrast  | Recommended Usage                           |
| :--------------------------- | :-------- | :--------------------- | :-------- | :------------------------------------------ |
| `--fintech-sapphire-primary` | `#0052FF` | Primary CTA / Brand    | `#FFFFFF` | UI elements matching primary cta / brand    |
| `--accent-highlight`         | `#05B169` | Focus / Active State   | `#FFFFFF` | UI elements matching focus / active state   |
| `--canvas-base`              | `#FFFFFF` | Document Background    | `#0A0B0D` | UI elements matching document background    |
| `--surface-container`        | `#F5F8FF` | Card / Panel Surface   | `#0A0B0D` | UI elements matching card / panel surface   |
| `--structural-border`        | `#E2E8F0` | Dividers / Line Stroke | `#5B616E` | UI elements matching dividers / line stroke |
| `--high-contrast-text`       | `#0A0B0D` | Headlines              | `#FFFFFF` | UI elements matching headlines              |
| `--muted-typography`         | `#5B616E` | Body Copy / Labels     | `#FFFFFF` | UI elements matching body copy / labels     |
| `--status-accent`            | `#05B169` | Validation / Active    | `#FFFFFF` | UI elements matching validation / active    |

### CSS Variables Definition (:root)

```css
:root {
  --fintech-sapphire-primary: #0052ff; /* Primary CTA / Brand */
  --accent-highlight: #05b169; /* Focus / Active State */
  --canvas-base: #ffffff; /* Document Background */
  --surface-container: #f5f8ff; /* Card / Panel Surface */
  --structural-border: #e2e8f0; /* Dividers / Line Stroke */
  --high-contrast-text: #0a0b0d; /* Headlines */
  --muted-typography: #5b616e; /* Body Copy / Labels */
  --status-accent: #05b169; /* Validation / Active */
}
```

---

## 3. Typography Hierarchy & Font Stacks

- **Heading Stack**: `Plus Jakarta Sans, sans-serif`
- **Body / Interface Stack**: `Plus Jakarta Sans, sans-serif`
- **Code / Monospace Stack**: `JetBrains Mono, monospace`

### Typographic Scale

| Hierarchy Level  | Font Size | Weight | Line Height | Usage Context                  |
| :--------------- | :-------- | :----- | :---------- | :----------------------------- |
| **Display Hero** | `52px`    | `700`  | `1.15`      | Display Hero typographic roles |
| **Heading 1**    | `36px`    | `700`  | `1.2`       | Heading 1 typographic roles    |
| **Heading 2**    | `24px`    | `600`  | `1.3`       | Heading 2 typographic roles    |
| **Body Large**   | `17px`    | `400`  | `1.5`       | Body Large typographic roles   |
| **Body Regular** | `15px`    | `400`  | `1.6`       | Body Regular typographic roles |
| **Caption**      | `13px`    | `500`  | `1.4`       | Caption typographic roles      |

### CSS Typography Mixins

```css
--type-display-hero: 700 52px/1.15 Plus Jakarta Sans, sans-serif;
--type-heading-1: 700 36px/1.2 Plus Jakarta Sans, sans-serif;
--type-heading-2: 600 24px/1.3 Plus Jakarta Sans, sans-serif;
--type-body-large: 400 17px/1.5 Plus Jakarta Sans, sans-serif;
--type-body-regular: 400 15px/1.6 Plus Jakarta Sans, sans-serif;
--type-caption: 500 13px/1.4 Plus Jakarta Sans, sans-serif;
```

---

## 4. Spacing Grid, Radii & Depth Tokens

- **Base Spacing Unit**: `4px / 8px scale`

### Geometric Corner Radii

| Token Name                | Radius Value | Target Controls & Containers       |
| :------------------------ | :----------- | :--------------------------------- |
| `--radius-button-control` | `8px`        | Button Control controls & elements |
| `--radius-panel-card`     | `12px`       | Panel / Card controls & elements   |
| `--radius-pill-tag`       | `9999px`     | Pill Tag controls & elements       |

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
  background: #0052ff;
  color: #ffffff;
  font-weight: 500;
  border-radius: 8px;
  padding: 10px 20px;
}
```

### Card Container

```css
/* Elevated content panel */
.card-surface {
  background: #f5f8ff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}
```

### Form Input Field

```css
/* Standard interactive text input */
.input-control {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  height: 44px;
  padding: 0 14px;
}
```

---

## 6. Motion Tokens & Micro-Interactions

The motion system for **Admission** is engineered with strict timing scales and deceleration curves.

### Easing Functions

| Curve Name   | Cubic Bezier Definition                   | Interaction Role                         |
| :----------- | :---------------------------------------- | :--------------------------------------- |
| **Standard** | `cubic-bezier(0.32, 0.72, 0, 1)`          | Button hovers, micro-interactions        |
| **Entrance** | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Viewport reveals, modal dialog entries   |
| **Hover**    | `cubic-bezier(0.32, 0.72, 0, 1)`          | State shifts, tooltip appearances        |
| **Bounce**   | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Spring physics, playful tactile feedback |

### Timing Durations

- **Instant**: `90ms` (checkboxes, radio buttons, icons)
- **Fast**: `160ms` (button hover, chip selection, tooltips)
- **Normal**: `240ms` (card elevation, dropdown menus)
- **Slow**: `380ms` (page transitions, complex modal reveals)

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

When implementing features or refactoring UI for **Admission**, AI coding agents (Cursor, Claude, Copilot, Antigravity) MUST obey these constraints:

1. **Never introduce arbitrary hex codes**: Use solely the extracted semantic tokens defined in Section 2.
2. **Preserve Font Pairings**: Ensure headings strictly use `Plus Jakarta Sans` and body copy uses `Plus Jakarta Sans`.
3. **Respect Corner Geometry**: Apply `8px` for interactive controls and `12px` for cards and modals.
4. **Contrast Compliance**: Ensure text contrast meets WCAG AA standards using the contrast pairings defined in Section 2.
5. **Honor Motion Physics**: Use `cubic-bezier(0.32, 0.72, 0, 1)` for all hover transitions and `160ms` for button micro-interactions.
