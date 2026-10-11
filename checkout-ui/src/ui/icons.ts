const svg = (size: number, stroke: number, body: string): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  flask: svg(18, 2.2, '<path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>'),
  clock: (size: number): string => svg(size, 2.2, '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  alert: svg(18, 2.2, '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/>'),
  whatsapp: svg(20, 2, '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z"/>'),
  wallet: svg(30, 2, '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h.01"/>'),
  cross: svg(30, 2.4, '<path d="M7 7l10 10"/><path d="M17 7L7 17"/>'),
  ban: svg(30, 2, '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'),
  offline: svg(30, 2, '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.6a10 10 0 0 1 5.2-2.5"/><path d="M14.5 10.3A10 10 0 0 1 19 12.6"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M11 5a15 15 0 0 1 11 3.8"/><path d="M12 20h.01"/>'),
  check: svg(36, 2.6, '<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  lock: svg(14, 2.4, '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  close: svg(22, 2.2, '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
  lyelPay:
    '<svg width="36" height="24" viewBox="0 0 706 474" fill="currentColor" fill-rule="evenodd" aria-hidden="true" focusable="false"><path d="M261 103 72 430 340 430 329 410 107 409 272 124ZM238 63 2 471 364 471 353 451 37 450 249 83ZM433 2 241 335 263 335 433 42 669 450 486 451 482 446 385 278 385 275 396 256 497 430 633 429 433 83 288 335 311 334 353 262 474 471 703 471ZM433 123 598 408 597 410 509 410 398 220 388 200Z"/></svg>',
} as const;
