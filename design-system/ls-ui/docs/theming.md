# Theming

LS UI exposes a CSS-variable-based theming system that stays in sync with Tailwind 4.

## Wrap the app

```tsx
import { ThemeProvider } from "@lyel/ls-ui/layout";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
```

## Read & update preferences

```tsx
import { useTheme } from "@lyel/ls-ui/layout";

function ThemeControls() {
  const { theme, setMode, setPrimary, setRadius, toggleBlur, setLayout } = useTheme();

  return (
    <div className="space-y-3">
      <select value={theme.mode} onChange={(e) => setMode(e.target.value as typeof theme.mode)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <input type="color" value={theme.primary} onChange={(e) => setPrimary(e.target.value)} />
      <input type="range" min={6} max={24} value={theme.radius} onChange={(e) => setRadius(Number(e.target.value))} />
      <button onClick={toggleBlur}>Blur: {theme.backgroundBlur ? "on" : "off"}</button>
      <button onClick={() => setLayout("compact")}>Compact layout</button>
    </div>
  );
}
```

Behind the scenes `ThemeProvider`:

- Applies `themeCssVars(resolvedMode)` to `document.documentElement`
- Toggles `dark` class when appropriate
- Overrides `--primary`, `--secondary`, `--radius*`, and `--ls-blur`
- Persists preferences (`localStorage` by default)

Tokens, Tailwind preset, and layout components all read the same source of truth, keeping Figma ↔ code parity.

