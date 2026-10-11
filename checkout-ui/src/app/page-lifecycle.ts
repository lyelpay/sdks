export interface PageLifecycleHandlers {
  /** The page is leaving: it may be discarded or kept in the back/forward cache. */
  hide: () => void;
  /** The page came back from the back/forward cache, with its state as it was when it left. */
  restore: () => void;
}

function isRestoredFromCache(event: Event): boolean {
  return 'persisted' in event && event.persisted === true;
}

export function watchPageLifecycle(page: EventTarget, handlers: PageLifecycleHandlers): void {
  page.addEventListener('pagehide', () => {
    handlers.hide();
  });
  page.addEventListener('pageshow', (event) => {
    if (isRestoredFromCache(event)) handlers.restore();
  });
}
