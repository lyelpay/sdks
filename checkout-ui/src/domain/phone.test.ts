import { describe, expect, it } from 'vitest';
import { normalizePhoneNumber } from './phone';

describe('normalizePhoneNumber', () => {
  it.each([
    '06 123 45 67',
    '061234567',
    '+242 06 123 45 67',
    '+242061234567',
    '242061234567',
    '06-123-45-67',
    '06.123.45.67',
    ' 06 123 45 67 ',
  ])('reads %s as +242061234567', (input) => {
    expect(normalizePhoneNumber(input)).toBe('+242061234567');
  });

  it('keeps another international number typed with +', () => {
    expect(normalizePhoneNumber('+237 600 000 002')).toBe('+237600000002');
  });

  it.each([
    '',
    '   ',
    '6123456',
    '0612345678',
    '61234567',
    '+242 6 123 45 67',
    '+2420612345678',
    'abc',
    '06 12a 45 67',
    '+12',
    '+1234567890123456',
  ])('refuses %s', (input) => {
    expect(normalizePhoneNumber(input)).toBeNull();
  });
});
