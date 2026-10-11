import { describe, expect, it } from 'vitest';
import { buildLaunchUrl, checkoutOriginOf } from './launch-url';

const base = {
  checkoutUrl: 'https://dev.checkout.lyelpay.com',
  publishableKey: 'pk_test_abc',
  sessionToken: 'st_123',
  parentOrigin: 'https://shop.cg',
};

function hashOf(url: string): URLSearchParams {
  return new URLSearchParams(new URL(url).hash.slice(1));
}

describe('buildLaunchUrl', () => {
  it('puts every parameter after the #, never in the query string', () => {
    const url = new URL(buildLaunchUrl({ ...base, surface: 'modal' }));
    expect(url.origin).toBe('https://dev.checkout.lyelpay.com');
    expect(url.pathname).toBe('/');
    expect(url.search).toBe('');
    expect(Object.fromEntries(hashOf(url.toString()))).toEqual({
      pk: 'pk_test_abc',
      st: 'st_123',
      origin: 'https://shop.cg',
      mode: 'modal',
    });
  });

  it('passes the embedded mode, the frameless choice, the locale and the button label', () => {
    const hash = hashOf(
      buildLaunchUrl({ ...base, surface: 'embedded', framed: false, locale: 'en', buttonLabel: 'DONATE' }),
    );
    expect(hash.get('mode')).toBe('embedded');
    expect(hash.get('framed')).toBe('0');
    expect(hash.get('locale')).toBe('en');
    expect(hash.get('button')).toBe('DONATE');
  });

  it('leaves the frame on by default', () => {
    expect(hashOf(buildLaunchUrl({ ...base, surface: 'embedded' })).has('framed')).toBe(false);
  });

  it('keeps a local checkout address and drops its own query and hash', () => {
    const url = new URL(buildLaunchUrl({ ...base, checkoutUrl: 'http://localhost:5174/?x=1#y', surface: 'modal' }));
    expect(url.origin).toBe('http://localhost:5174');
    expect(url.search).toBe('');
    expect(hashOf(url.toString()).get('pk')).toBe('pk_test_abc');
  });
});

describe('checkoutOriginOf', () => {
  it('keeps the origin only', () => {
    expect(checkoutOriginOf('https://dev.checkout.lyelpay.com/some/path')).toBe('https://dev.checkout.lyelpay.com');
  });

  it.each(['', 'not a url', 'javascript:alert(1)', 'ftp://checkout.lyelpay.com'])('refuses %j', (value) => {
    expect(() => checkoutOriginOf(value)).toThrow(/checkoutUrl/);
  });
});
