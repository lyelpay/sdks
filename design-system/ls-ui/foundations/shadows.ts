export const shadows = {
  soft: "0 18px 40px rgba(15, 23, 42, 0.08)",
  card: "0 4px 12px rgba(0,0,0,0.08)",
  modal: "0 8px 24px rgba(0,0,0,0.12)",
  focus: "0 0 0 3px rgba(58,186,180,0.35)",
} as const;

export type ShadowToken = keyof typeof shadows;

