import type { Embedding } from './session';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

function parseOrigin(origin: string): URL | null {
  try {
    const url = new URL(origin);
    return url.origin === 'null' ? null : url;
  } catch {
    return null;
  }
}

function matchesDomain(host: string, pattern: string): boolean {
  const domain = pattern.toLowerCase();
  if (domain.startsWith('*.')) {
    const parent = domain.slice(2);
    return host.endsWith(`.${parent}`);
  }
  return host === domain;
}

/** S2: the widget only shows itself in, and only talks to, a page of an allowed domain. */
export function isEmbeddingAllowed(origin: string, embedding: Embedding): boolean {
  const url = parseOrigin(origin);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  if (embedding.allowLocalhost && LOCAL_HOSTS.includes(host)) return true;
  const secureEnough = url.protocol === 'https:' || (embedding.allowLocalhost && url.protocol === 'http:');
  return secureEnough && embedding.allowedDomains.some((domain) => matchesDomain(host, domain));
}
