# Layout

Layout components orchestrate primitives into full shells.

- `AppShell` – overall frame with built-in sidebar/compact/centered variants
- `Sidebar` – responsive rail + mobile menu
- `HeaderBar` – breadcrumbs, title, search, actions
- `MobileNav` – chip-based navigation for compact layouts
- `PageContainer` – consistent max-width and gutters
- `ThemeProvider` / `useTheme` – CSS vars + layout preference store

```tsx
import { AppShell } from "@lyel/ls-ui/layout";
import { Button } from "@lyel/ls-ui/primitives";

<AppShell
  sidebar={{
    logo: <div className="font-bold">Lyel</div>,
    sections: [
      { label: "Core", items: [{ label: "Overview", href: "/", isActive: true }, { label: "Billing", href: "/billing" }] },
    ],
  }}
  header={{
    title: "Overview",
    actions: <Button>New report</Button>,
  }}
>
  {/* page content */}
</AppShell>;
```

Wrap the app with `ThemeProvider` to sync CSS vars and persist layout/brand preferences (see `theming.md`). Layout components never depend on Next.js routing—pass `href`, custom link components, or click handlers to integrate with any stack.

