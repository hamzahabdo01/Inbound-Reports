# Tech-Forward Echo: Deep Eucalyptus

## Brand & Style
Corporate Modernism with Minimalist lean. Deep forest teals and steel slates on a crisp airy background. Prioritizes clarity, precision, and a sophisticated professional tone.

## Colors

| Token | Hex |
|---|---|
| Primary / Primary Container | `#0B4F54` |
| Primary Dark | `#00373B` |
| Primary Hover | `#115E59` |
| On Primary Container | `#86BFC5` |
| Secondary (Steel Slate) | `#515F74` |
| Tertiary | `#003734` |
| Background / Surface | `#F6FAFC` |
| Surface Low | `#F0F4F6` |
| Surface Container | `#EAEEF0` |
| Surface Container High | `#E5E9EB` |
| Surface Container Highest | `#DFE3E5` |
| On Surface | `#181C1E` |
| On Surface Variant | `#404849` |
| Outline | `#707979` |
| Outline Variant / Gray Border | `#CFD8DC` |
| Text Primary | `#0A3235` |
| Error | `#BA1A1A` |
| Success | `#059669` |
| Warning | `#D97706` |
| Informational (Muted Teal-Blue) | `#4A8EA5` |

## Typography

| Style | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| Display Lg | 48px | 700 | 60px | -0.02em |
| Headline Lg | 32px | 600 | 40px | -0.01em |
| Title Md | 20px | 600 | 28px | — |
| Body Md | 16px | 400 | 24px | — |
| Label Sm | 14px | 500 | 20px | 0.01em |
| Caption | 12px | 500 | 16px | — |

Font: **Plus Jakarta Sans** throughout.

## Rounded Corners

| Element | Radius |
|---|---|
| Tags / Micro | 4px |
| Buttons, Inputs | 8px |
| Cards, Containers | 16px |

## Elevation

| Level | Usage | Shadow |
|---|---|---|
| 0 — Flat | App background | None |
| 1 — Floating | Cards | `0px 4px 20px rgba(10, 50, 53, 0.06)` |
| 2 — Overlay | Modals, Dropdowns | `0px 12px 32px rgba(10, 50, 53, 0.12)` |

## Charts & Data Visualization

### Pie Charts
All pie charts MUST use a brand-cohesive categorical palette drawn from the design system tokens. This ensures visual distinction between segments while remaining on-brand. Teal variants dominate (4 of 8) with complementary design system accent colors providing contrast.

| Segment | Hex | Source |
|---------|-----|--------|
| 1 | `#00373B` | Primary Dark |
| 2 | `#0B4F54` | Primary |
| 3 | `#216E6A` | Medium teal (between Primary & Tertiary) |
| 4 | `#4A9598` | Medium-light teal |
| 5 | `#86BFC5` | On Primary Container |
| 6 | `#515F74` | Secondary (Steel Slate) |
| 7 | `#D97706` | Warning |
| 8 | `#059669` | Success |

### Bar / Area Charts
Use `#00373B` (Primary Dark) for line strokes and area fills. Use `opacity-10` for filled areas and `strokeWidth="4"` for line strokes.

## Component Rules

- **Primary Button**: solid `#0B4F54` bg, white text, `#115E59` hover
- **Secondary Button**: `#CFD8DC` border, `#475569` text
- **Input Focus**: `#0B4F54` border + `3px rgba(11, 79, 84, 0.1)` glow
- **Card**: white bg, 16px radius, Level 1 shadow, 24px internal padding
- **Table Header**: `#CFD8DC` bg, uppercase 12px labels
- **Divider**: clean rows separated by 1px `#F0F4F6`

## KPICard (`variant="detailed"`)

Unified metric card used across all pages.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `string` | yes | Font Awesome icon class (e.g. `"fa-boxes-stacked"`) |
| `iconBg` | `string` | yes | Tailwind background class for icon circle |
| `iconColor` | `string` | yes | Tailwind text color class for icon |
| `label` | `string` | yes | Upper-cased title |
| `value` | `string\|number` | yes | Large display number |
| `valueColor` | `string` | no | Tailwind text color for value (defaults to `text-on-surface`) |
| `subtitle` | `string` | no | Small helper text below value |
| `variant` | `"detailed"` | no | Activates the detailed card layout |

### Structure

```
┌──────────────────────────┐
│  LABEL              [icon] │
│                          │
│  VALUE                   │
│  subtitle                │
└──────────────────────────┘
```

- White background, `rounded-xl`, `border-outline-variant` border, Level 1 shadow
- `hover:shadow-md` transition
- `p-lg` (16px) internal padding
- Icon: `w-8 h-8 rounded-full` circle
- Value: `text-display-kpi leading-none` (28px / 800 weight via Tailwind config)
- Subtitle: `text-xs font-semibold`

### Tone Mapping (iconBg / iconColor)

Use these standard patterns for semantic states:

| Tone | iconBg | iconColor | valueColor |
|------|--------|-----------|------------|
| Neutral | `bg-surface-container` | `text-primary` | `text-on-surface` |
| Success | `bg-success/10` | `text-success` | `text-success` |
| Warning | `bg-warning/10` | `text-warning` | `text-warning` |
| Error | `bg-error/10` | `text-error` | `text-error` |
| Info | `bg-[#4A8EA5]/10` | `text-[#4A8EA5]` | `text-[#4A8EA5]` |

For dynamic tones based on data (e.g. "Expired" shows error only when value > 0), inline the conditional:

```jsx
iconBg={kpis.expired ? 'bg-error/10' : 'bg-success/10'}
iconColor={kpis.expired ? 'text-error' : 'text-success'}
```

## Layout

- Max width: 1280px, centered
- Desktop: 12-column grid, 24px gutters, 64px side margins
- Mobile: 4-column fluid grid, 16px gutters
- Spacing baseline: 4px / 8px rhythm
- Section gap: 40px (xl), internal padding: 16px (md)
