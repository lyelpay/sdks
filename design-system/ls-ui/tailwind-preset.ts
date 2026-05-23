import type { Config } from "tailwindcss";

import { shadowTokens } from "./tokens/shadow";
import { spacingTokens } from "./tokens/spacing";
import { radiusTokens } from "./tokens/radius";
import { typographyTokens } from "./tokens/typography";

const spacingScale = Object.fromEntries(
  Object.entries(spacingTokens).map(([key, value]) => [key.toString(), value]),
);

const sanitizeFontList = (input: string) =>
  input
    .split(",")
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

const preset: Config = {
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      spacing: spacingScale,
      borderRadius: {
        sm: radiusTokens.sm,
        md: radiusTokens.md,
        lg: radiusTokens.lg,
        xl: radiusTokens.xl,
        full: radiusTokens.pill,
      },
      boxShadow: {
        soft: shadowTokens.surface,
        card: shadowTokens.card,
        modal: shadowTokens.modal,
        focus: shadowTokens.focus,
      },
      fontFamily: {
        sans: sanitizeFontList(typographyTokens.fonts.sans),
        serif: sanitizeFontList(typographyTokens.fonts.serif),
        mono: sanitizeFontList(typographyTokens.fonts.mono),
      },
      transitionProperty: {
        smooth: "all",
      },
    },
  },
};

export default preset;

