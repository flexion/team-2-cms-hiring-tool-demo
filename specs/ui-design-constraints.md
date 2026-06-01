# UI Design Constraints

## Context

An internal tool for CMS (Centers for Medicare & Medicaid Services) BOG HR Specialists managing positions in the hiring pipeline. Data-heavy — tables of positions, side-by-side document comparison, suggestion panels. Users are federal employees familiar with government systems but not developers. The tool should feel professional, efficient, and information-dense without being cluttered. Multiple feature areas (pipeline, PD editor, resume reader) need clear navigation.

## Platforms

Desktop only. Users work from government-issued workstations with standard monitors (1920x1080 minimum). No mobile or tablet support needed.

## Brand Assets

No formal CMS brand assets for this internal tool. Use a clean, professional government aesthetic — neutral blues and grays, high contrast for readability, minimal decoration. Federal tools should look trustworthy and efficient, not playful.

### Colors

Using USWDS design tokens:

| Name | Token | Category |
|---|---|---|
| Primary Darker | primary-darker | Primary — headers, navigation |
| Ink | ink | Primary — body text |
| Base Lightest | base-lightest | Primary — page background |
| Primary | primary | Accent — interactive elements, links |
| Success | success | Expanded — success states, strong matches |
| Warning | warning | Expanded — warnings, partial matches |
| Error | error | Expanded — errors, rejected suggestions |

## Quality Attributes

Cross-cutting interaction principles that apply to every screen and component. These are binding design constraints — not optional nice-to-haves.

- **Escapability.** Users must be able to close out of what they're doing without following through. Every modal, form, and multi-step flow must have a cancel or back-out path. A user who starts an action by mistake should never be trapped.
- **Recognition over recall.** People shouldn't have to remember names of things and type them in correctly. Where the system asks the user to identify an existing entity in the system, offer selection from a list (dropdown, autocomplete, or clickable list) rather than requiring free-text entry.
- **Visibility of system state.** After any action, the user must see immediate confirmation that the action succeeded — or a clear error explaining why it failed. Buttons that do nothing and forms that close silently are not acceptable. Use success banners, error messages, and loading indicators.
- **Information density.** Screens should show as much relevant data as fits without scrolling when possible. Tables are preferred over card layouts for list views. Whitespace is used for grouping, not decoration.
- **Navigability.** The user should always know where they are in the application and be able to return to the pipeline view with one click. Breadcrumbs or a persistent navigation element should provide orientation.

## Testable Constraints

### Brand

- The application header displays "CMS Hiring Tool" as the application name.
- The application uses the Public Sans font family for all text.

### Escapability

- Every modal has a visible close or cancel button.
- Pressing Escape while a modal is open dismisses it.
- Every detail page has a visible link or button to return to the pipeline view.

### Recognition Over Recall

- When identifying an existing position, the interface offers selection from a list — not free-text.

### Visibility of System State

- After accepting an LLM suggestion, a success indicator appears.
- After rejecting an LLM suggestion, a visual indicator confirms the rejection.
- While waiting for LLM suggestions, a loading indicator is visible.

### Layout

- A navigation header is present on every page.
- The pipeline table is the default/home view of the application.
