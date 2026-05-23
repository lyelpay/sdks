import { ErrorCodes, type ErrorCode } from '../src/error-codes';

describe('ErrorCodes', () => {
  it('exposes stable string values equal to keys', () => {
    expect(ErrorCodes.E_PROFILE_NOT_FOUND).toBe('E_PROFILE_NOT_FOUND');
    expect(ErrorCodes.E_INVALID_API_KEY).toBe('E_INVALID_API_KEY');
  });

  it('has unique values', () => {
    const values = Object.values(ErrorCodes);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('types ErrorCode as union of values', () => {
    const code: ErrorCode = ErrorCodes.E_NOT_FOUND;
    expect(code).toBe('E_NOT_FOUND');
  });
});
