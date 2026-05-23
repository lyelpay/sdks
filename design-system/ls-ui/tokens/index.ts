import type { ThemeMode } from "../foundations/colors";
import { colorCssVars, getColorTokens, semanticColors } from "./color";
import { radiusCssVars, radiusTokens } from "./radius";
import { shadowTokens } from "./shadow";
import { spacingTokens } from "./spacing";
import { typographyTokens } from "./typography";

export * from "./color";
export * from "./radius";
export * from "./shadow";
export * from "./spacing";
export * from "./typography";

export type LsTheme = ReturnType<typeof createLsTheme>;

export function createLsTheme(mode: ThemeMode = "light") {
  return {
    mode,
    colors: getColorTokens(mode),
    radius: radiusTokens,
    shadows: shadowTokens,
    spacing: spacingTokens,
    typography: typographyTokens,
  };
}

export const defaultTheme = createLsTheme("light");

export const themeCssVars = (mode: ThemeMode = "light") => ({
  ...colorCssVars(mode),
  ...radiusCssVars(),
});

export const themes = semanticColors;

