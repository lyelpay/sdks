# Usage

LS UI ships multiple layers. Import only what you need:

```tsx
import { Button, Input, FormSection } from "@lyel/ls-ui";
import { PageHeader, StatGrid } from "@lyel/ls-ui/patterns";
import { AppShell } from "@lyel/ls-ui/layout";
```

## App shell + layout

```tsx
<AppShell
  sidebar={{
    logo: <Logo />,
    sections: [{ label: "Main", items: [{ label: "Dashboard", href: "/dashboard", isActive: true }] }],
  }}
  header={{
    title: "Revenue",
    breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }, { label: "Revenue" }],
    actions: <Button>Export</Button>,
  }}
>
  <PageHeader title="Revenue" description="Last 30 days overview" />
  <StatGrid items={[{ label: "MRR", value: "$82k", trend: { direction: "up", value: "+12%" } }]} />
</AppShell>
```

## Tailwind + tokens

```ts
import { createLsTheme, colors } from "@lyel/ls-ui/tokens";

const theme = createLsTheme("dark");
console.log(theme.colors.primary, colors.chart.mint);
```

Use tokens for charts, CSS-in-JS, design tooling, etc.

## Primitives & patterns

Every primitive mirrors the shadcn/ui API (`variant`, `size`, `asChild`) but uses Lyel tokens. Patterns (page headers, KPI cards, empty states) keep dashboards consistent. See `primitives.md` and `patterns.md` for deep dives.

