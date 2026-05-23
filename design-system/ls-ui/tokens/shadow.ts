import { shadows } from "../foundations/shadows";

export const shadowTokens = {
  surface: shadows.soft,
  card: shadows.card,
  modal: shadows.modal,
  focus: shadows.focus,
} as const;

export type ShadowTokens = typeof shadowTokens;

