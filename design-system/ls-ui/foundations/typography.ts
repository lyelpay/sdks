export const fonts = {
  sans: "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  serif: "var(--font-dm-serif), 'DM Serif Display', serif",
  mono: "var(--font-geist-mono), 'JetBrains Mono', monospace",
} as const;

export type FontToken = keyof typeof fonts;

export const textStyles = {
  heading1: {
    fontFamily: fonts.serif,
    fontSize: "2.25rem",
    lineHeight: "1.2",
    fontWeight: 400,
  },
  heading2: {
    fontFamily: fonts.sans,
    fontSize: "1.5rem",
    lineHeight: "1.3",
    fontWeight: 500,
  },
  heading3: {
    fontFamily: fonts.sans,
    fontSize: "1.25rem",
    lineHeight: "1.4",
    fontWeight: 500,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: "1rem",
    lineHeight: "1.5",
    fontWeight: 400,
  },
  numeric: {
    fontFamily: fonts.mono,
    fontSize: "1.125rem",
    lineHeight: "1.4",
    fontWeight: 500,
  },
} as const;

export type TextStyle = keyof typeof textStyles;

