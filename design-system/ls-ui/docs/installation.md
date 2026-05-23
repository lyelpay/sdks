# Installation

## 1. Add the package

```bash
# inside the repo root
pnpm add @lyel/ls-ui -F <your-app-package>
# or npm/yarn/bun add @lyel/ls-ui inside the app workspace
```

If you use pnpm workspaces, also point `pnpm-workspace.yaml` (or equivalent) to `packages/design-system/ls-ui`.

## 2. Wire Tailwind 4

```ts
// tailwind.config.ts
import lsPreset from "@lyel/ls-ui/tailwind-preset";

const config = {
  presets: [lsPreset],
};

export default config;
```

## 3. Wrap Next.js 16

```tsx
// app/providers.tsx
"use client";

import { ThemeProvider } from "@lyel/ls-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 4. Import primitives/patterns

```tsx
import { Button, AppShell, PageHeader } from "@lyel/ls-ui";
```

Done — you now share colors, type, spacing, and components with every Lyel product.

