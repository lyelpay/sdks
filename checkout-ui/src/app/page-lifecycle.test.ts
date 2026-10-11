import { describe, expect, it, vi } from 'vitest';
import { watchPageLifecycle } from './page-lifecycle';

function pageEvent(type: 'pageshow' | 'pagehide', persisted: boolean): Event {
  return Object.assign(new Event(type), { persisted });
}

function watched(): { page: EventTarget; hide: () => void; restore: () => void } {
  const page = new EventTarget();
  const hide = vi.fn();
  const restore = vi.fn();
  watchPageLifecycle(page, { hide, restore });
  return { page, hide, restore };
}

describe('watchPageLifecycle', () => {
  it('reports a page restored from the back/forward cache', () => {
    const { page, restore } = watched();
    page.dispatchEvent(pageEvent('pageshow', true));
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('ignores the first, normal page show', () => {
    const { page, restore } = watched();
    page.dispatchEvent(pageEvent('pageshow', false));
    expect(restore).not.toHaveBeenCalled();
  });

  it('reports every page hide', () => {
    const { page, hide } = watched();
    page.dispatchEvent(pageEvent('pagehide', true));
    page.dispatchEvent(pageEvent('pagehide', false));
    expect(hide).toHaveBeenCalledTimes(2);
  });
});
