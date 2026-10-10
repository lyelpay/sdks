import './styles.css';
import { createCheckoutApi } from './api/checkout-api';
import { CheckoutController, type ControllerSnapshot } from './app/checkout-controller';
import { embeddedHost, hostedHost, type CheckoutHost } from './app/checkout-host';
import { readConfig, type CheckoutConfig } from './config/env';
import { buildTheme } from './domain/contrast';
import { parseLaunchParams, type LaunchParams } from './launch/launch-params';
import { createParentChannel } from './messaging/contract';
import { buildRenderContext } from './ui/build-context';
import { bindInteractions, focusStep } from './ui/dom-binding';
import { applyLiveUpdates } from './ui/live-updates';
import { renderShell } from './ui/shells';
import { applyTheme } from './ui/theme';
import { initialState } from './app/checkout-machine';

const TICK_MS = 1000;

function isFramed(): boolean {
  return window.self !== window.top;
}

/** Modes A and B live in the SDK iframe; the hosted page must never be framed (anti-clickjacking). */
function createHost(launch: LaunchParams): CheckoutHost | null {
  if (launch.surface === 'hosted') return isFramed() ? null : hostedHost(window.location);
  if (!isFramed() || !launch.parentOrigin) return null;
  return embeddedHost(createParentChannel(window.parent, launch.parentOrigin));
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
  root.innerHTML = renderShell(buildRenderContext(snapshot, fallback, config));
}

function start(root: HTMLElement): void {
  const config = readConfig(import.meta.env);
  applyTheme(document.documentElement, buildTheme(null));
  const launch = parseLaunchParams(window.location);
  const host = launch ? createHost(launch) : null;
  if (!launch || !host) {
    renderUnavailable(root, launch, config);
    return;
  }

  let previousStep = initialState().step;
  const render = (snapshot: ControllerSnapshot): void => {
    const ctx = buildRenderContext(snapshot, launch, config);
    applyTheme(document.documentElement, buildTheme(snapshot.session?.merchant.primaryColor ?? null));
    document.documentElement.lang = ctx.locale;
    root.innerHTML = renderShell(ctx);
    applyLiveUpdates(root, snapshot, ctx.t, new Date());
    const firstScreen = previousStep === 'loading';
    if (snapshot.state.step !== previousStep && !(firstScreen && launch.surface === 'embedded')) focusStep(root);
    previousStep = snapshot.state.step;
  };

  const controller = new CheckoutController({
    api: createCheckoutApi(config.apiBaseUrl, launch),
    host,
    surface: launch.surface,
    parentOrigin: launch.parentOrigin,
    expectedIntentId: launch.intentId,
    onChange: render,
  });

  bindInteractions(root, controller, launch.surface, (url) => {
    window.location.assign(url);
  });

  window.setInterval(() => {
    const snapshot = controller.snapshot;
    const now = new Date();
    applyLiveUpdates(root, snapshot, buildRenderContext(snapshot, launch, config).t, now);
    if (snapshot.session && snapshot.session.expiresAt <= now) controller.expiryReached();
  }, TICK_MS);

  if (launch.surface === 'embedded') {
    new ResizeObserver(() => {
      controller.notify({ type: 'resize', height: Math.ceil(document.documentElement.scrollHeight) });
    }).observe(document.body);
  }

  render(controller.snapshot);
  void controller.start();
}

const root = document.getElementById('app');
if (root) start(root);
