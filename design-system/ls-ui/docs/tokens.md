# Tokens

Tokens sit on top of foundations and align Tailwind 4, CSS vars, and Figma.

```ts
import { createLsTheme, themeCssVars, semanticColors, spacingTokens } from "@lyel/ls-ui/tokens";

const theme = createLsTheme("light");
console.log(theme.colors.primary, spacingTokens[6]);
```

- `createLsTheme(mode)` → typed theme object (colors, radius, typography…)
- `themeCssVars(mode)` → CSS variable map for manual injection
- `semanticColors`, `spacingTokens`, `radiusTokens`, etc. → individual maps

### Overriding colors or radius

```ts
const enterpriseTheme = {
  ...createLsTheme("dark"),
  colors: {
    ...semanticColors.dark,
    primary: "#6366F1",
  },
};
```

Use semantic names (`background`, `surface.card`, `chart.1`) instead of raw hex values so design + code stay in sync.

