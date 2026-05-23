# @lyel/oasis-react

React components for the **Oasis** design system (Next 16, CVE-safe). Tokens from [@lyel/oasis](../oasis).

## Installation

```bash
npm install @lyel/oasis @lyel/oasis-react
```

## Usage

1. Import styles once (layout or `_app`):

```tsx
import "@lyel/oasis-react/styles";
```

2. Import components:

```tsx
import { OasisButton, OasisAlert, OasisInput, OasisCard, OasisContainer } from "@lyel/oasis-react";

<OasisButton variant="primary">Submit</OasisButton>
<OasisAlert variant="success" title="OK">Success.</OasisAlert>
```

## Components

All components use Oasis tokens (without modifying them) and are responsive.

- **OasisButton** – variants: primary, secondary, outline, ghost, destructive; sizes: sm, md, lg
- **OasisButtonGroup** – button group
- **OasisAlert** – variants: success, warning, error, info
- **OasisInput**, **OasisTextarea**, **OasisSelect** – form fields with label, error
- **OasisCheckbox**, **OasisRadio**, **OasisSwitch** – form controls
- **OasisCard** – header, body, footer
- **OasisContainer** – responsive container (Oasis breakpoints)
- **OasisAccordion** – accordion (single / multiple)
- **OasisAvatar** – sizes: sm, md, lg
- **OasisBadge** – variants: default, primary, secondary, destructive, outline
- **OasisBreadcrumbs** – breadcrumb navigation
- **OasisDivider** – horizontal / vertical
- **OasisDropdown** – dropdown menu
- **OasisModal** – modal dialog
- **OasisPopover** – popover
- **OasisTooltip** – hover tooltip
- **OasisProgress** – progress bar
- **OasisTabs** – tabs
- **OasisGrid** – responsive grid (1–4 columns)
- **OasisHeading**, **OasisText**, **OasisLink** – typography
- **OasisList** – list (optional striped)
- **OasisPagination** – pagination
- **OasisTable** – table (columns + data)
- **OasisEmptyState** – empty state (title, description, action)
- **OasisSkeleton** – loading placeholder
- **OasisDrawer** – drawer (left / right)
- **OasisErrorBoundary** – React error boundary
- **OasisToast** + **OasisToastProvider** / **useOasisToast** – notifications

## Docs / demo

```bash
cd packages/design-system/oasis-react && npm run dev
```

Open http://localhost:4000 for the demo page.

## Library build (publishing)

```bash
npm run build
```

Produces `dist/` (JS/TS + `styles.css`) for publishing as `@lyel/oasis-react`.
