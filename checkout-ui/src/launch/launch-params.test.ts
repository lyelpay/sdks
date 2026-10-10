import { describe, expect, it } from 'vitest';
import { parseLaunchParams } from './launch-params';

describe('parseLaunchParams', () => {
  it('reads the hosted page from the path and the fragment', () => {
    expect(parseLaunchParams({ pathname: '/pay/pi_1', hash: '#pk=pk_test_a&st=tok', search: '' })).toEqual({
      surface: 'hosted',
      intentId: 'pi_1',
      publishableKey: 'pk_test_a',
      sessionToken: 'tok',
      parentOrigin: null,
      locale: null,
      framed: true,
      buttonLabel: null,
    });
  });

  it('reads the embedded block from the fragment', () => {
    const params = parseLaunchParams({
      pathname: '/',
      hash: '#pk=pk_live_a&st=tok&mode=embedded&origin=https%3A%2F%2Fshop.cg&locale=en&framed=0&button=DONATE',
      search: '',
    });
    expect(params).toEqual({
      surface: 'embedded',
      intentId: null,
      publishableKey: 'pk_live_a',
      sessionToken: 'tok',
      parentOrigin: 'https://shop.cg',
      locale: 'en',
      framed: false,
      buttonLabel: 'DONATE',
    });
  });

  it('opens the modal by default and still reads the legacy query string, ignoring amount and merchant name', () => {
    const params = parseLaunchParams({
      pathname: '/',
      hash: '',
      search: '?pk=pk_test_a&st=tok&amount=1&currency=XAF&origin=https%3A%2F%2Fshop.cg&merchant_name=Fake',
    });
    expect(params?.surface).toBe('modal');
    expect(params).not.toHaveProperty('amount');
    expect(params).not.toHaveProperty('merchantName');
  });

  it('ignores a button label outside the closed list', () => {
    const params = parseLaunchParams({ pathname: '/', hash: '#pk=pk_test_a&st=tok&origin=https%3A%2F%2Fshop.cg&button=FREE', search: '' });
    expect(params?.buttonLabel).toBeNull();
  });

  it.each([
    { pathname: '/', hash: '', search: '' },
    { pathname: '/', hash: '#pk=pk_test_a&st=tok', search: '' },
    { pathname: '/', hash: '#st=tok&origin=https%3A%2F%2Fshop.cg', search: '' },
    { pathname: '/pay/', hash: '#pk=pk_test_a&st=tok', search: '' },
    { pathname: '/pay/pi_1', hash: '#pk=pk_test_a', search: '' },
    { pathname: '/', hash: '#pk=pk_test_a&st=tok&origin=https%3A%2F%2Fshop.cg&mode=popup', search: '' },
  ])('refuses an incomplete link %#', (location) => {
    expect(parseLaunchParams(location)).toBeNull();
  });
});
