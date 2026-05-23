import { radius } from "../foundations/radius";

export const radiusTokens = {
  base: radius.md,
  sm: "6px",
  md: "8px",
  lg: radius.md,
  xl: "14px",
  pill: radius.pill,
} as const;

export type RadiusTokens = typeof radiusTokens;

export const radiusCssVars = () => ({
  "--radius": radiusTokens.base,
  "--radius-sm": radiusTokens.sm,
  "--radius-md": radiusTokens.md,
  "--radius-lg": radiusTokens.lg,
  "--radius-xl": radiusTokens.xl,
});

