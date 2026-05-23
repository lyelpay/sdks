export const radius = {
  none: "0px",
  xs: "4px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "16px",
  "2xl": "24px",
  pill: "999px",
} as const;

export type RadiusScale = keyof typeof radius;

export const defaultRadius = radius.md;

