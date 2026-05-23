import { fonts, textStyles } from "../foundations/typography";

export const typographyTokens = {
  fonts,
  text: textStyles,
} as const;

export type TypographyTokens = typeof typographyTokens;

