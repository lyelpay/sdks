type SemanticColor =
  | "background"
  | "foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "border"
  | "input"
  | "ring";

type SemanticMap = Record<SemanticColor, string>;

const light: SemanticMap = {
  background: "#F8FAF9",
  foreground: "#1A1A1A",
  card: "#FFFFFF",
  "card-foreground": "#1A1A1A",
  popover: "#FFFFFF",
  "popover-foreground": "#1A1A1A",
  primary: "#3ABAB4",
  "primary-foreground": "#FFFFFF",
  secondary: "#0E3A4C",
  "secondary-foreground": "#FFFFFF",
  muted: "#F8FAF9",
  "muted-foreground": "#4A4A4A",
  accent: "#C4ECEA",
  "accent-foreground": "#0E3A4C",
  destructive: "#D9534F",
  border: "#E7ECEB",
  input: "#E7ECEB",
  ring: "#3ABAB4",
};

const dark: SemanticMap = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  "card-foreground": "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  "popover-foreground": "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  "primary-foreground": "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  "secondary-foreground": "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  "muted-foreground": "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  "accent-foreground": "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
};

const sidebar = {
  light: {
    surface: "#FFFFFF",
    foreground: "#1A1A1A",
    primary: "#3ABAB4",
    "primary-foreground": "#FFFFFF",
    accent: "#C4ECEA",
    "accent-foreground": "#0E3A4C",
    border: "#E7ECEB",
    ring: "#3ABAB4",
  },
  dark: {
    surface: "oklch(0.205 0 0)",
    foreground: "oklch(0.985 0 0)",
    primary: "oklch(0.488 0.243 264.376)",
    "primary-foreground": "oklch(0.985 0 0)",
    accent: "oklch(0.269 0 0)",
    "accent-foreground": "oklch(0.985 0 0)",
    border: "oklch(1 0 0 / 10%)",
    ring: "oklch(0.556 0 0)",
  },
} as const;

const chart = {
  mint: "#3ABAB4",
  coral: "#F0776C",
  midnight: "#0E3A4C",
  emerald: "#5CB85C",
  amber: "#F0AD4E",
} as const;

export const colors = {
  light,
  dark,
  sidebar,
  chart,
};

export type ThemeMode = "light" | "dark";
export type SidebarTheme = typeof sidebar.light;

export function getSemanticColor(mode: ThemeMode, token: SemanticColor) {
  return colors[mode][token];
}

