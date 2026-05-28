# specs/

This directory contains the inputs that drive development. The `/program` process reads these files to know what to build, how it should look, and what technologies to use.

**You define the boundaries; the AI has latitude inside them.** The four editable files (scenarios, tech-stack, design constraints, external boundaries) fence in *what* gets built, *with what tools*, *under what constraints*, and *talking to what external systems*. Inside that fence, the AI designs and develops. You can add more detail if you want — extra constraints, specific quality attributes, explicit testable rules — and the process will respect them. But you don't have to. Minimal specs are sufficient because the AI operates under Flexion's development discipline: test-driven, YAGNI, scenario-driven, with OEA refactoring conditions applied every iteration. The architecture that emerges reflects what your scenarios demand, not what the AI imagines.

## Files You Edit

These are yours. Change them to change what gets built.

| File | What it is | When to edit it |
|---|---|---|
| **`scenarios.md`** | The requirements. Business scenarios with actors, narratives, and postconditions. Every feature, behavior, and test traces back to this file. | When you want the system to do something new, or when business rules change. See `scenario-guidelines.md` for how to write them. |
| **`ui-design-constraints.md`** | Your design inputs. Brand colors, logo pointers, platform requirements, and quality attributes (escapability, recognition over recall, visibility of state). | When you have brand assets, UX principles, or visual preferences you want the system to follow. |
| **`tech-stack-recommendations.md`** | Technology choices. Which frameworks, libraries, databases, and tools to use for each concern (UI, API, testing, deployment, auth). | When you want to choose or change a technology. The process will not pick a technology that isn't listed here. |
| **`external-boundaries.md`** | External systems the application interacts with. Operations, data shapes, testing considerations, and production technologies for each boundary. | When you know the app will call an external API, send notifications, verify identity, or interact with any system you don't own. See `external-boundaries-guidelines.md`. |

## Files You Read but Don't Edit

These are generated or maintained by the process.

| File | What it is | Who maintains it |
|---|---|---|
| **`ui-design-reference.md`** | The detailed design system — layout, typography, spacing, component patterns, color tokens. Generated from your constraints. | The `/flexion-frontend-design` skill produces this from `ui-design-constraints.md`. Edit constraints to change inputs; edit this file only to adjust implementation details. |
| **`scenario-guidelines.md`** | How to write scenarios. Template, rules, and examples for actors, preconditions, narratives, postconditions, and mid-conditions. | Reference document. Read it before writing your first scenario. |

## Guidelines

Each editable file has a companion guidelines document:

| Template | Guidelines |
|---|---|
| `scenarios.md` | `scenario-guidelines.md` |
| `tech-stack-recommendations.md` | `tech-stack-guidelines.md` |
| `ui-design-constraints.md` | `ui-design-guidelines.md` |
| `external-boundaries.md` | `external-boundaries-guidelines.md` |

## Brand Assets

Drop logos, color palettes, icons, and other visual assets directly into this directory. Reference them by file path in `ui-design-constraints.md`. The design skill will read them.

## What to Put Here

- **Scenarios** — business requirements as stories with named actors and verifiable postconditions
- **Brand assets** — logos, color palettes, icons, fonts (as files or references)
- **Design constraints** — platform requirements, UX principles, visual preferences
- **Technology choices** — which frameworks and libraries to use

## What NOT to Put Here

- **Code** — source code lives in your project's source directories
- **Test infrastructure** — test drivers and helpers live alongside your test runner
- **Process documentation** — the development journal, module cache, and other process state live in `_program_workspace/`; dependency graphs live in `docs/`
