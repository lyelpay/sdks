import { describe, expect, it } from 'vitest';
import { buildTheme, contrastRatio, parseHexColor } from './contrast';

const WHITE = { r: 255, g: 255, b: 255 };

describe('parseHexColor', () => {
  it('reads 6 and 3 digit codes', () => {
    expect(parseHexColor('#1E8E3E')).toEqual({ r: 30, g: 142, b: 62 });
    expect(parseHexColor('fff')).toEqual(WHITE);
  });

  it.each(['', '#12', 'zzzzzz', '#1234567'])('refuses %s', (input) => {
    expect(parseHexColor(input)).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('matches the reference values of the brief', () => {
    expect(contrastRatio(parseHexColor('#FE6A49') ?? WHITE, WHITE)).toBeCloseTo(2.85, 1);
    expect(contrastRatio(parseHexColor('#1E8E3E') ?? WHITE, WHITE)).toBeCloseTo(4.2, 1);
  });
});

describe('buildTheme', () => {
  it('keeps the Lyel Pay colours when the merchant set none', () => {
    const theme = buildTheme(null);
    expect(theme.accent).toBe('#FE6A49');
    expect(theme.onAccent).toBe('#08313A');
  });

  it('falls back to Lyel Pay on an unreadable colour', () => {
    expect(buildTheme('not-a-colour').accent).toBe('#FE6A49');
  });

  it('writes white on green (4.2:1 reaches 3:1)', () => {
    expect(buildTheme('#1E8E3E').onAccent).toBe('#FFFFFF');
  });

  it('writes dark on orange (2.85:1 misses 3:1)', () => {
    expect(buildTheme('#FE6A49').onAccent).toBe('#08313A');
  });

  it('writes dark on light yellow', () => {
    expect(buildTheme('#F5C518').onAccent).toBe('#08313A');
  });

  it('darkens links until they reach 4.5:1 on white', () => {
    const theme = buildTheme('#FE6A49');
    expect(contrastRatio(parseHexColor(theme.link) ?? WHITE, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it('darkens the active field border until it reaches 3:1 on white', () => {
    const theme = buildTheme('#F5C518');
    expect(contrastRatio(parseHexColor(theme.focus) ?? WHITE, WHITE)).toBeGreaterThanOrEqual(3);
  });

  it('keeps a colour that is already dark enough', () => {
    const theme = buildTheme('#08313A');
    expect(theme.link).toBe('#08313A');
    expect(theme.focus).toBe('#08313A');
  });

  it('turns pure white into a readable ink', () => {
    const theme = buildTheme('#FFFFFF');
    expect(contrastRatio(parseHexColor(theme.link) ?? WHITE, WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});
