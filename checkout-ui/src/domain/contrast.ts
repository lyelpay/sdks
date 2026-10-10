export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Theme {
  /** Background of the main button and the logo badge. */
  accent: string;
  /** Text on the accent. */
  onAccent: string;
  /** Links and text buttons: the merchant colour at 4.5:1 on white, else the Lyel Pay dark. */
  link: string;
  /** Border of the active field: the merchant colour at 3:1 on white, else the Lyel Pay dark. */
  focus: string;
  /** Soft ring around the active field. */
  halo: string;
}

export const LYEL_ORANGE = '#FE6A49';
export const LYEL_PETROL = '#08313A';

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const PETROL: Rgb = { r: 8, g: 49, b: 58 };
/** The button text is 19px bold, large text in WCAG terms, so 3:1 applies (decision Adam, 2026-10-06). */
const BUTTON_TEXT_RATIO = 3;
const LINK_RATIO = 4.5;
const FIELD_BORDER_RATIO = 3;
const HALO_ALPHA = 0.28;

export function parseHexColor(input: string): Rgb | null {
  const raw = input.trim().replace(/^#/, '');
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function readableOnWhite(color: Rgb, ratio: number): Rgb {
  return contrastRatio(color, WHITE) >= ratio ? color : PETROL;
}

/** Derives every coloured token from the merchant colour, keeping each one readable. */
export function buildTheme(primaryColor: string | null): Theme {
  const accent = (primaryColor && parseHexColor(primaryColor)) || parseHexColor(LYEL_ORANGE) || PETROL;
  return {
    accent: toHex(accent),
    onAccent: contrastRatio(accent, WHITE) >= BUTTON_TEXT_RATIO ? toHex(WHITE) : toHex(PETROL),
    link: toHex(readableOnWhite(accent, LINK_RATIO)),
    focus: toHex(readableOnWhite(accent, FIELD_BORDER_RATIO)),
    halo: `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${HALO_ALPHA})`,
  };
}
