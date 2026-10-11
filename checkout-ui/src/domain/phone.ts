const CONGO_PREFIX = '242';
const CONGO_NATIONAL = /^0\d{8}$/;
const INTERNATIONAL = /^\d{8,15}$/;
const SEPARATORS = /[\s.\-()]/g;

/** Any common Congolese form, or another country typed with "+", becomes E.164; anything else is null. */
export function normalizePhoneNumber(input: string): string | null {
  const compact = input.replace(SEPARATORS, '');
  if (compact.startsWith('+')) return fromInternational(compact.slice(1));
  if (CONGO_NATIONAL.test(compact)) return `+${CONGO_PREFIX}${compact}`;
  if (compact.startsWith(CONGO_PREFIX)) return fromInternational(compact);
  return null;
}

function fromInternational(digits: string): string | null {
  if (digits.startsWith(CONGO_PREFIX)) {
    const national = digits.slice(CONGO_PREFIX.length);
    return CONGO_NATIONAL.test(national) ? `+${CONGO_PREFIX}${national}` : null;
  }
  return INTERNATIONAL.test(digits) ? `+${digits}` : null;
}
