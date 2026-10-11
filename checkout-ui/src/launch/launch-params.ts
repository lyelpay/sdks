import { BUTTON_LABELS, type ButtonLabel, type Surface } from '../domain/session';

export interface LaunchParams {
  surface: Surface;
  /** Hosted page only: the intent id read from `/pay/:id`. */
  intentId: string | null;
  publishableKey: string;
  sessionToken: string;
  /** Modal and block only: the page that embeds the widget, checked against the allowed domains (S2). */
  parentOrigin: string | null;
  locale: string | null;
  framed: boolean;
  buttonLabel: ButtonLabel | null;
}

export interface LaunchLocation {
  pathname: string;
  hash: string;
  search: string;
}

const HOSTED_PATH = /^\/pay\/([^/]+)\/?$/;
const EMBED_SURFACES = ['modal', 'embedded'] as const;

function asButtonLabel(value: string | null): ButtonLabel | null {
  return BUTTON_LABELS.find((label) => label === value) ?? null;
}

function asEmbedSurface(value: string | null): Surface | null {
  if (value === null) return 'modal';
  return EMBED_SURFACES.find((surface) => surface === value) ?? null;
}

/**
 * The token rides in the fragment, which browsers send neither to the server nor in a Referer (S11).
 * The legacy query string of the v0 SDK is still read for modes A and B only; its amount and merchant name
 * are ignored (S9). The hosted page reads the fragment only.
 */
export function parseLaunchParams(location: LaunchLocation): LaunchParams | null {
  const hosted = HOSTED_PATH.exec(location.pathname);
  const fromHash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const params = hosted || fromHash.has('st') ? fromHash : new URLSearchParams(location.search);
  const publishableKey = params.get('pk');
  const sessionToken = params.get('st');
  if (!publishableKey || !sessionToken) return null;

  const common = {
    publishableKey,
    sessionToken,
    locale: params.get('locale'),
    buttonLabel: asButtonLabel(params.get('button')),
  };

  if (hosted?.[1]) {
    return { ...common, surface: 'hosted', intentId: decodeURIComponent(hosted[1]), parentOrigin: null, framed: true };
  }

  const surface = asEmbedSurface(params.get('mode'));
  const parentOrigin = params.get('origin');
  if (!surface || !parentOrigin || location.pathname.startsWith('/pay')) return null;
  return { ...common, surface, intentId: null, parentOrigin, framed: params.get('framed') !== '0' };
}
