# UI Design Reference

## Aesthetic Direction

**Federal precision instrument.** A dense, efficient internal tool built on USWDS — not a citizen-facing portal. HR specialists spend full workdays in this interface; every pixel earns its place. The aesthetic is calm authority: structured, information-rich, and fast to scan. No decoration for decoration's sake. The system communicates through hierarchy and density, not embellishment.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (usa-header--basic)                                 │
│  [CMS Hiring Tool]                    [Pipeline] [Positions]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MAIN CONTENT (usa-section)                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Page heading + breadcrumb                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │  Content area                                       │   │
│  │  (tables, split panes, editors, panels)             │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Header:** USWDS basic header (`usa-header--basic`). Fixed height 56px. Contains app name left-aligned, primary navigation right-aligned.
- **Main content:** Full-width below header. Max-width: none (use available screen width for data density). Padding: 24px horizontal, 16px vertical.
- **Split-pane layouts:** Used for PD editor (editor + suggestions panel) and resume reader (requirements + resume). Implemented with CSS Grid `grid-template-columns: 1fr 1fr` or `2fr 1fr` depending on context. 16px gap between panes.
- **No sidebar.** Navigation is top-level only (header nav). The tool has few enough views that a sidebar would waste horizontal space better used for data.

---

## Typography

**Font family:** Public Sans (via @fontsource/public-sans). USWDS default. Applied globally.

| Purpose | Size | Weight | Line-height | Token |
|---|---|---|---|---|
| Page title (h1) | 32px | 700 | 1.2 | font-size-2xl |
| Section heading (h2) | 24px | 700 | 1.3 | font-size-xl |
| Subsection heading (h3) | 20px | 600 | 1.4 | font-size-lg |
| Body text | 16px | 400 | 1.5 | font-size-md |
| Table cell text | 14px | 400 | 1.4 | font-size-sm |
| Small/caption text | 12px | 400 | 1.5 | font-size-xs |
| Button text | 16px | 700 | 1 | font-size-md |
| Navigation links | 14px | 400 | 1 | font-size-sm |

**Letter-spacing:** Default for all sizes. No custom tracking.

---

## Color System

All colors use USWDS design tokens. No custom hex values.

### Primary

| Token | Usage |
|---|---|
| `primary-darker` | Header background, primary navigation background |
| `primary-dark` | Header nav hover state |
| `primary` | Links, interactive elements, focus ring, active states |
| `primary-light` | Selected row highlight (tables) |
| `primary-lighter` | Subtle active/hover backgrounds |

### Neutrals

| Token | Usage |
|---|---|
| `ink` | Body text, headings, table cell text |
| `base-darker` | Secondary text (status labels, timestamps) |
| `base-dark` | Disabled text, placeholder text |
| `base` | Borders, dividers |
| `base-light` | Table header background, subtle borders |
| `base-lighter` | Alternating table row background |
| `base-lightest` | Page background, card backgrounds |
| `white` | Header text, primary button text, card surface |

### Semantic

| Token | Usage |
|---|---|
| `success` | Success banners, strong match indicators, accepted suggestions |
| `success-lighter` | Success banner background |
| `warning` | Warning states, partial match indicators |
| `warning-lighter` | Warning banner background |
| `error` | Error messages, rejected suggestion indicators |
| `error-lighter` | Error banner background |
| `info` | Informational states |
| `info-lighter` | Info banner background |

---

## Spacing Scale

Uses USWDS spacing units (1 unit = 8px):

| Token | Value | Usage |
|---|---|---|
| `0.5` | 4px | Tight spacing: between icon and label, badge padding |
| `1` | 8px | Compact spacing: table cell padding vertical, inline element gaps |
| `1.5` | 12px | Standard tight: form field internal padding |
| `2` | 16px | Standard: card padding, section gaps, split-pane gutter |
| `3` | 24px | Comfortable: page horizontal padding, between form groups |
| `4` | 32px | Generous: between major sections |
| `5` | 40px | Large: page vertical margins |
| `6` | 48px | Extra large: between page-level blocks |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `0` | 0px | Tables, header, navigation (sharp federal aesthetic) |
| `sm` | 4px | Buttons, form inputs, badges, chips |
| `md` | 8px | Cards, panels, modals |
| `lg` | 16px | Not used — too soft for this aesthetic |
| `pill` | 9999px | Not used |

---

## Shadows / Elevation

| Token | Value | Usage |
|---|---|---|
| `shadow-1` | `0 1px 3px rgba(0,0,0,0.12)` | Cards, panels at rest |
| `shadow-2` | `0 4px 8px rgba(0,0,0,0.15)` | Elevated elements: modals, dropdown menus |
| `shadow-3` | `0 8px 16px rgba(0,0,0,0.18)` | Modals overlay |
| none | — | Tables, inline elements (flat by default) |

---

## Motion

| Property | Value | Usage |
|---|---|---|
| Duration (fast) | 150ms | Button hover, focus ring appearance, icon transitions |
| Duration (standard) | 250ms | Panel open/close, suggestion slide-in, row highlight |
| Duration (slow) | 400ms | Modal open/close, page transitions |
| Easing | `ease-in-out` | All transitions |
| Reduced motion | `prefers-reduced-motion: reduce` → disable all animations | Accessibility |

---

## Component Patterns

### Buttons

Uses USWDS button classes (`usa-button`).

| Variant | Usage | Styles |
|---|---|---|
| Primary | Main actions: "LLM Suggest", "Accept" | `usa-button` — solid primary background, white text |
| Secondary | Secondary actions: "Reject", "Cancel" | `usa-button--outline` — primary border, primary text |
| Destructive | Irreversible actions | `usa-button--secondary` — error color background |
| Unstyled | Tertiary/ghost: navigation links acting as buttons | `usa-button--unstyled` — text-only, primary color |

**States:**
- Default: as above
- Hover: darker background shade (`primary-dark` for primary)
- Active: `primary-darker` background
- Focus: 4px `primary` outline offset by 2px (USWDS default focus)
- Disabled: `base-light` background, `base-dark` text, no pointer events

**Sizes:** Standard (padding 12px 20px, height 44px) is the only size used. All buttons meet 44×44px minimum touch target.

### Form Fields

Uses USWDS form components (`usa-input`, `usa-label`, `usa-select`).

- **Label:** Above input. 14px weight-700 `ink` color. Required fields marked with red asterisk after label text.
- **Input:** Full-width within container. Height 44px. Border: 1px `base`. Padding: 12px. Border-radius: 4px.
- **Focus:** 4px `primary` outline (USWDS default).
- **Error:** Border changes to `error`. Error message below field in `error` color, 14px. Prefixed with validation icon.
- **Disabled:** `base-lighter` background, `base-dark` text.
- **Helper text:** Below input, 12px, `base-darker`.

### Selection Controls

- **Dropdown/Select:** USWDS `usa-select`. Same height as inputs (44px). Arrow indicator right-aligned.
- **Checkbox:** USWDS `usa-checkbox`. 20×20px box, 4px radius. Checked state uses `primary` fill with white checkmark.
- **Radio:** USWDS `usa-radio`. 20×20px circle. Selected state uses `primary` fill.

### Cards / Panels

- **Background:** `white`
- **Border:** 1px `base-light`
- **Border-radius:** 8px
- **Padding:** 16px
- **Shadow:** `shadow-1`
- **Used for:** Suggestion panels, PD working copy container, resume content panes

### Navigation

- **Header nav:** USWDS basic header. Background `primary-darker`, text `white`. Nav items 14px weight-400. Active item has bottom border 3px `white`. Hover: background `primary-dark`.
- **Breadcrumbs:** USWDS `usa-breadcrumb`. Below header, above page title. 14px, `base-darker` for inactive crumbs, `ink` for current.

### Modals / Dialogs

Uses USWDS modal (`usa-modal`).

- **Overlay:** `rgba(0,0,0,0.5)` full-screen backdrop
- **Container:** `white` background, `shadow-3`, border-radius 8px, max-width 640px, centered
- **Header:** 20px weight-600 title, close button (X icon) top-right
- **Body:** 16px body text, 16px padding
- **Footer:** Right-aligned buttons, 16px padding-top with `base-light` top border
- **Close:** X button always visible. Escape key dismisses.

### Toasts / Alerts

Uses USWDS alert (`usa-alert`).

| Variant | Background | Border-left | Icon |
|---|---|---|---|
| Success | `success-lighter` | 4px `success` | Checkmark circle |
| Warning | `warning-lighter` | 4px `warning` | Warning triangle |
| Error | `error-lighter` | 4px `error` | Error circle |
| Info | `info-lighter` | 4px `info` | Info circle |

- Auto-dismiss: success alerts after 5 seconds. Errors persist until dismissed.
- Position: top of content area, full-width within main content padding.
- Text: 16px `ink`. Action link (if any) in `primary`.

### Tables

Uses USWDS table (`usa-table`).

- **Header row:** Background `base-light`. Text 14px weight-700 `ink`. Padding 8px 12px.
- **Body rows:** Background alternating `white` / `base-lighter`. Text 14px weight-400 `ink`. Padding 8px 12px.
- **Hover:** Row background `primary-lighter`.
- **Clickable rows:** Cursor pointer. Entire row is the click target.
- **Selected row:** Background `primary-light`, left border 3px `primary`.
- **Full-width:** Tables stretch to fill container width. No horizontal scroll at 1920px minimum viewport.
- **Status badges:** Inline in table cells. 12px text, 4px border-radius, 4px 8px padding. Background matches semantic color lighter variant; text matches semantic color.

### Suggestion Panel

- **Container:** Card pattern (white, 1px border, 8px radius, shadow-1)
- **Individual suggestion:** Separated by 1px `base-light` border. Padding 12px.
- **Suggestion header:** 14px weight-600. Section reference badge (e.g., "Duties") in `primary-lighter` background.
- **Suggestion body:** 14px weight-400 `ink`. The proposed text change.
- **Explanation:** 12px `base-darker` italic. The federal PD rule being addressed.
- **Actions:** Two buttons per suggestion: "Accept" (primary, compact) and "Reject" (secondary outline, compact).
- **Accepted state:** Green left border, `success-lighter` background tint, "Accepted" label.
- **Rejected state:** Muted (`base-lighter` background), strikethrough on suggestion text, "Rejected" label.

### Split-Pane (Resume Reader)

- **Layout:** CSS Grid `grid-template-columns: 1fr 1fr`. Gap 16px.
- **Left pane (PD Requirements):** Card pattern. Clickable sections with hover highlight.
- **Right pane (Resume Content):** Card pattern. Clickable passages.
- **Highlight (active mapping):** Background `primary-lighter` with 2px left border `primary` on mapped passages.
- **Match strength indicators:** Strong match: `success` left border + subtle `success-lighter` tint. Partial match: `warning` left border + subtle `warning-lighter` tint.

---

## Focus States

All interactive elements use the USWDS default focus pattern:
- **Style:** 4px solid outline in `primary` color, offset 2px from the element edge.
- **Applied to:** buttons, links, inputs, selects, table rows (when clickable), modal close buttons.
- **Never removed.** No `outline: 0` or `outline: none` without replacement.

---

## Icons

Lucide React icons (per tech stack). Consistent 20×20px size for inline icons, 24×24px for standalone/button icons. Stroke-width 2. Color inherits from text color.

---

## Responsive Behavior

Desktop-only (minimum 1920×1080). No responsive breakpoints needed. Layout optimized for wide screens:
- Tables use full available width
- Split panes use 50/50 or 66/33 splits
- No column stacking or mobile layouts
