import { describe, expect, it } from 'vitest';
import { isEmbeddingAllowed, isParentOriginConfirmed } from './embedding';

describe('isEmbeddingAllowed', () => {
  const live = { allowedDomains: ['shop.cg', '*.boutique.cg'], allowLocalhost: false };

  it('accepts a listed https host', () => {
    expect(isEmbeddingAllowed('https://shop.cg', live)).toBe(true);
  });

  it('accepts a subdomain only through a wildcard', () => {
    expect(isEmbeddingAllowed('https://www.shop.cg', live)).toBe(false);
    expect(isEmbeddingAllowed('https://www.boutique.cg', live)).toBe(true);
    expect(isEmbeddingAllowed('https://boutique.cg', live)).toBe(false);
  });

  it('refuses http in LIVE', () => {
    expect(isEmbeddingAllowed('http://shop.cg', live)).toBe(false);
  });

  it('refuses everything with an empty list in LIVE', () => {
    expect(isEmbeddingAllowed('https://shop.cg', { allowedDomains: [], allowLocalhost: false })).toBe(false);
  });

  it('accepts localhost only when allowed (TEST)', () => {
    expect(isEmbeddingAllowed('http://localhost:5173', live)).toBe(false);
    const test = { allowedDomains: [], allowLocalhost: true };
    expect(isEmbeddingAllowed('http://localhost:5173', test)).toBe(true);
    expect(isEmbeddingAllowed('http://127.0.0.1:8080', test)).toBe(true);
  });

  it('accepts http on a listed domain in TEST', () => {
    expect(isEmbeddingAllowed('http://shop.cg', { allowedDomains: ['shop.cg'], allowLocalhost: true })).toBe(true);
  });

  it('refuses a malformed or opaque origin', () => {
    expect(isEmbeddingAllowed('null', live)).toBe(false);
    expect(isEmbeddingAllowed('', live)).toBe(false);
  });

  it('is case-insensitive on the host', () => {
    expect(isEmbeddingAllowed('https://SHOP.cg', live)).toBe(true);
  });
});

describe('isParentOriginConfirmed (S2: the announced origin must be the real parent)', () => {
  it('accepts the same origin', () => {
    expect(isParentOriginConfirmed('https://shop.cg', 'https://shop.cg')).toBe(true);
    expect(isParentOriginConfirmed('https://shop.cg', 'https://shop.cg/')).toBe(true);
  });

  it('refuses an observed origin that differs from the announced one', () => {
    expect(isParentOriginConfirmed('https://shop.cg', 'https://evil.example')).toBe(false);
    expect(isParentOriginConfirmed('https://shop.cg', 'http://shop.cg')).toBe(false);
  });

  it('leaves an unknown parent origin (no ancestorOrigins, no Referer) to the challenge, in TEST and LIVE', () => {
    expect(isParentOriginConfirmed('https://shop.cg', null)).toBe(true);
  });

  it('refuses an opaque or malformed origin', () => {
    expect(isParentOriginConfirmed('https://shop.cg', 'null')).toBe(false);
    expect(isParentOriginConfirmed('nonsense', 'nonsense')).toBe(false);
    expect(isParentOriginConfirmed('nonsense', null)).toBe(false);
  });
});
