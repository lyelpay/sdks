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
  it('uses the Lyel Pay petrol with white text when the merchant set no colour', () => {
    const theme = buildTheme(null);
    expect(theme.accent).toBe('#08313A');
    expect(theme.onAccent).toBe('#FFFFFF');
    expect(theme.link).toBe('#08313A');
    expect(theme.focus).toBe('#08313A');
  });

  it('falls back to the Lyel Pay petrol on an unreadable colour', () => {
    expect(buildTheme('not-a-colour').accent).toBe('#08313A');
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

  it('falls back to the Lyel Pay dark for links below 4.5:1, never a darkened merchant colour', () => {
    expect(buildTheme('#FE6A49').link).toBe('#08313A');
    expect(buildTheme('#1E8E3E').link).toBe('#08313A');
  });

  it('keeps the merchant colour for links at 4.5:1 or more', () => {
    expect(buildTheme('#1F5FAF').link).toBe('#1F5FAF');
  });

  it('keeps the merchant colour for the active field border at 3:1 or more, else the Lyel Pay dark', () => {
    expect(buildTheme('#1E8E3E').focus).toBe('#1E8E3E');
    expect(buildTheme('#FE6A49').focus).toBe('#08313A');
    expect(buildTheme('#F5C518').focus).toBe('#08313A');
  });
});
