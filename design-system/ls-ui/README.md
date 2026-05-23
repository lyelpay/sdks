# LS UI – Lyel System UI

LS UI is the shared design system powering every Lyel interface (Console, Freiya, Naap Analytics, Lyel Pay, and future apps). It provides design foundations, Tailwind presets, reusable primitives, layout structures, and opinionated dashboard patterns so teams can move fast without drifting.

## Features

- **Foundations** – colors, typography, spacing, radii, shadows, transitions
- **Tokens & Preset** – normalized theme objects and a drop-in Tailwind v4 preset
- **Primitives** – polished shadcn/ui building blocks adapted to Lyel
- **Layout** – responsive shells (App Shell, Sidebar, Header Bar, Breadcrumbs)
- **Patterns** – dashboard-ready compositions (PageHeader, DataCard, StatGrid…)
- **Utilities** – `cn`, variant helpers, and shared types

## Installation

```bash
pnpm add @lyel/ls-ui
```

Peer dependencies: `react@19`, `react-dom@19`, `tailwindcss@4`, `react-hook-form@7`.

```ts
// tailwind.config.ts
import lsPreset from "@lyel/ls-ui/tailwind-preset";

export default {
  presets: [lsPreset],
};
```

## Quick start

Wrap your app once:

```tsx
import { ThemeProvider } from "@lyel/ls-ui/layout";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

Compose layouts + patterns:

```tsx
import { AppShell } from "@lyel/ls-ui/layout";
import { PageHeader, StatGrid } from "@lyel/ls-ui/patterns";
import { Button } from "@lyel/ls-ui/primitives";

<AppShell
  sidebar={{ sections: [{ label: "Core", items: [{ label: "Overview", href: "/", isActive: true }] }] }}
  header={{ title: "Overview", actions: <Button>New report</Button> }}
>
  <PageHeader title="Revenue" description="Last 30 days" />
  <StatGrid items={[{ label: "MRR", value: "$82k", trend: { direction: "up", value: "+12%" } }]} />
</AppShell>;
```

Documentation lives in `docs/` (installation, theming, primitives, patterns). The same content will back the future `packages/design-system/docs-web` site.

