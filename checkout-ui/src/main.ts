import './styles.css';
import { createCheckoutApi } from './api/checkout-api';
import { CheckoutController, type ControllerSnapshot } from './app/checkout-controller';
import { embeddedHost, hostedHost, type CheckoutHost } from './app/checkout-host';
import { readConfig, type CheckoutConfig } from './config/env';
import { buildTheme } from './domain/contrast';
import { parseLaunchParams, type LaunchParams } from './launch/launch-params';
import { createParentChannel } from './messaging/contract';
import { confirmWindowParent } from './messaging/window-handshake';
import { buildRenderContext } from './ui/build-context';
import { bindInteractions, captureTyping, focusStep, restoreTyping } from './ui/dom-binding';
import { applyLiveUpdates } from './ui/live-updates';
import { renderShell } from './ui/shells';
import { applyTheme } from './ui/theme';
import { initialState } from './app/checkout-machine';

const TICK_MS = 1000;

function isFramed(): boolean {
  return window.self !== window.top;
}

/** S2: the parent origin as the browser reports it; null when it cannot be known. */
function observedParentOrigin(): string | null {
  const ancestors = 'ancestorOrigins' in window.location ? window.location.ancestorOrigins : null;
  const ancestor = ancestors && ancestors.length > 0 ? ancestors.item(0) : null;
  if (ancestor) return ancestor;
  try {
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch {
    return null;
  }
}

function originOf(value: string | null): string | null {
  if (!value) return null;
  try {
    const { origin } = new URL(value);
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

interface Surroundings {
  host: CheckoutHost;
  confirmParent: () => Promise<boolean>;
}

const NO_PARENT = (): Promise<boolean> => Promise.resolve(true);

/** Modes A and B live in the SDK iframe; the hosted page must never be framed (anti-clickjacking). */
function createSurroundings(launch: LaunchParams): Surroundings | null {
  if (launch.surface === 'hosted') return isFramed() ? null : { host: hostedHost(window.location), confirmParent: NO_PARENT };
  const parentOrigin = originOf(launch.parentOrigin);
  if (!isFramed() || !parentOrigin) return null;
  const channel = createParentChannel(window.parent, parentOrigin);
  return { host: embeddedHost(channel), confirmParent: confirmWindowParent(channel, parentOrigin) };
}

function renderUnavailable(root: HTMLElement, launch: LaunchParams | null, config: CheckoutConfig): void {
  const fallback: LaunchParams = launch ?? {
    surface: 'hosted',
    intentId: null,
    publishableKey: '',
    sessionToken: '',
    parentOrigin: null,
    locale: null,
    framed: true,
    buttonLabel: null,
  };
  const snapshot: ControllerSnapshot = { state: { step: 'unavailable' }, session: null, phoneDraft: '', redirecting: false };
  root.innerHTML = renderShell(buildRenderContext(snapshot, fallback, config, new Date()));
}

function start(root: HTMLElement): void {
  const config = readConfig(import.meta.env);
  applyTheme(document.documentElement, buildTheme(null));
  const launch = parseLaunchParams(window.location);
  const surroundings = launch ? createSurroundings(launch) : null;
  if (!launch || !surroundings) {
    renderUnavailable(root, launch, config);
    return;
  }

  let previousStep = initialState().step;
  /** Mode B: the block height is the content height, so it can shrink as well as grow. */
  const announceHeight = (): void => {
    controller.notify({ type: 'resize', height: Math.ceil(document.body.getBoundingClientRect().height) });
  };
  const render = (snapshot: ControllerSnapshot): void => {
    const now = new Date();
    const ctx = buildRenderContext(snapshot, launch, config, now);
    applyTheme(document.documentElement, buildTheme(snapshot.session?.merchant.primaryColor ?? null));
    document.documentElement.lang = ctx.locale;
    const sameStep = snapshot.state.step === previousStep;
    const typing = sameStep ? captureTyping(root) : null;
    root.innerHTML = renderShell(ctx);
    if (typing) restoreTyping(root, typing);
    applyLiveUpdates(root, snapshot, ctx.t, now);
    const firstScreen = previousStep === 'loading';
    if (!sameStep && !(firstScreen && launch.surface === 'embedded')) focusStep(root);
    previousStep = snapshot.state.step;
    // A resize observed before the parent was confirmed is dropped: every render announces the height again.
    if (launch.surface === 'embedded') announceHeight();
  };

  const controller = new CheckoutController({
    api: createCheckoutApi(config.apiBaseUrl, launch),
    host: surroundings.host,
    confirmParent: surroundings.confirmParent,
    surface: launch.surface,
    parentOrigin: launch.parentOrigin,
    observedParentOrigin: launch.surface === 'hosted' ? null : observedParentOrigin(),
    expectedIntentId: launch.intentId,
    onChange: render,
  });

  bindInteractions(root, controller, launch.surface, (url) => {
    window.location.assign(url);
  });

  const ticker = window.setInterval(() => {
    const snapshot = controller.snapshot;
    const now = new Date();
    applyLiveUpdates(root, snapshot, buildRenderContext(snapshot, launch, config, now).t, now);
    if (snapshot.session && snapshot.session.expiresAt <= now) controller.expiryReached();
  }, TICK_MS);

  const resizeObserver = launch.surface === 'embedded' ? new ResizeObserver(announceHeight) : null;
  resizeObserver?.observe(document.body);

  window.addEventListener('pagehide', () => {
    window.clearInterval(ticker);
    resizeObserver?.disconnect();
    controller.dispose();
  });

  render(controller.snapshot);
  void controller.start();
}

const root = document.getElementById('app');
if (root) start(root);
