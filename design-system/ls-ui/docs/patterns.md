# Patterns

Patterns are higher-level compositions for dashboards and admin flows.

- `PageHeader` – breadcrumbs + title + actions
- `KpiCard` / `StatGrid` – KPI displays with trend badges
- `DataCard` – summary card w/ extra content (charts, tables)
- `FormSection` – labeled panels w/ responsive actions
- `EmptyState`, `InfoBanner` – onboarding + communication blocks

```tsx
import { PageHeader, StatGrid, KpiCard, EmptyState } from "@lyel/ls-ui/patterns";
import { Button } from "@lyel/ls-ui/primitives";

<PageHeader
  title="Payouts"
  description="Last 30 days performance"
  breadcrumbs={[{ label: "Finance", href: "/finance" }, { label: "Payouts" }]}
  actions={<Button>Export CSV</Button>}
/>;

<StatGrid
  items={[
    { label: "Net revenue", value: "$182k", trend: { direction: "up", value: "+9%" } },
    { label: "Refunds", value: "$3.2k", trend: { direction: "down", value: "-2%" } },
  ]}
/>;

<EmptyState
  title="No payouts yet"
  description="Connect your Stripe account to start collecting funds."
  action={{ label: "Connect account", onClick: openModal }}
/>;
```

Patterns are UI-only: pass them data, icons, and CTA slots. They render consistent spacing, typography, and states across Lyel apps.

