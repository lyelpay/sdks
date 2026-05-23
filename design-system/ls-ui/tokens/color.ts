import { colors, type ThemeMode } from "../foundations/colors";

type SemanticColorSet = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

export const semanticColors: Record<ThemeMode, SemanticColorSet> = {
  light: {
    background: colors.light.background,
    foreground: colors.light.foreground,
    card: colors.light.card,
    cardForeground: colors.light["card-foreground"],
    popover: colors.light.popover,
    popoverForeground: colors.light["popover-foreground"],
    primary: colors.light.primary,
    primaryForeground: colors.light["primary-foreground"],
    secondary: colors.light.secondary,
    secondaryForeground: colors.light["secondary-foreground"],
    muted: colors.light.muted,
    mutedForeground: colors.light["muted-foreground"],
    accent: colors.light.accent,
    accentForeground: colors.light["accent-foreground"],
    destructive: colors.light.destructive,
    border: colors.light.border,
    input: colors.light.input,
    ring: colors.light.ring,
    sidebar: colors.sidebar.light.surface,
    sidebarForeground: colors.sidebar.light.foreground,
    sidebarPrimary: colors.sidebar.light.primary,
    sidebarPrimaryForeground: colors.sidebar.light["primary-foreground"],
    sidebarAccent: colors.sidebar.light.accent,
    sidebarAccentForeground: colors.sidebar.light["accent-foreground"],
    sidebarBorder: colors.sidebar.light.border,
    sidebarRing: colors.sidebar.light.ring,
    chart1: colors.chart.mint,
    chart2: colors.chart.coral,
    chart3: colors.chart.midnight,
    chart4: colors.chart.emerald,
    chart5: colors.chart.amber,
  },
  dark: {
    background: colors.dark.background,
    foreground: colors.dark.foreground,
    card: colors.dark.card,
    cardForeground: colors.dark["card-foreground"],
    popover: colors.dark.popover,
    popoverForeground: colors.dark["popover-foreground"],
    primary: colors.dark.primary,
    primaryForeground: colors.dark["primary-foreground"],
    secondary: colors.dark.secondary,
    secondaryForeground: colors.dark["secondary-foreground"],
    muted: colors.dark.muted,
    mutedForeground: colors.dark["muted-foreground"],
    accent: colors.dark.accent,
    accentForeground: colors.dark["accent-foreground"],
    destructive: colors.dark.destructive,
    border: colors.dark.border,
    input: colors.dark.input,
    ring: colors.dark.ring,
    sidebar: colors.sidebar.dark.surface,
    sidebarForeground: colors.sidebar.dark.foreground,
    sidebarPrimary: colors.sidebar.dark.primary,
    sidebarPrimaryForeground: colors.sidebar.dark["primary-foreground"],
    sidebarAccent: colors.sidebar.dark.accent,
    sidebarAccentForeground: colors.sidebar.dark["accent-foreground"],
    sidebarBorder: colors.sidebar.dark.border,
    sidebarRing: colors.sidebar.dark.ring,
    chart1: colors.chart.mint,
    chart2: colors.chart.coral,
    chart3: colors.chart.midnight,
    chart4: colors.chart.emerald,
    chart5: colors.chart.amber,
  },
};

export type SemanticColors = SemanticColorSet;

export const COLOR_MODES = ["light", "dark"] satisfies ThemeMode[];

export const getColorTokens = (mode: ThemeMode = "light"): SemanticColors =>
  semanticColors[mode];

export type CssVarMap = Record<string, string>;

export const colorCssVars = (mode: ThemeMode): CssVarMap => {
  const tokens = semanticColors[mode];

  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.popover,
    "--popover-foreground": tokens.popoverForeground,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--destructive": tokens.destructive,
    "--border": tokens.border,
    "--input": tokens.input,
    "--ring": tokens.ring,
    "--chart-1": tokens.chart1,
    "--chart-2": tokens.chart2,
    "--chart-3": tokens.chart3,
    "--chart-4": tokens.chart4,
    "--chart-5": tokens.chart5,
    "--sidebar": tokens.sidebar,
    "--sidebar-foreground": tokens.sidebarForeground,
    "--sidebar-primary": tokens.sidebarPrimary,
    "--sidebar-primary-foreground": tokens.sidebarPrimaryForeground,
    "--sidebar-accent": tokens.sidebarAccent,
    "--sidebar-accent-foreground": tokens.sidebarAccentForeground,
    "--sidebar-border": tokens.sidebarBorder,
    "--sidebar-ring": tokens.sidebarRing,
  };
};

