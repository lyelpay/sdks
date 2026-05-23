import type { LyelPay } from './sdk';

declare global {
  interface Window {
    __LYEL__PAY__?: {
      _lyelPayInstance?: LyelPay;
    };
  }
}

export const getLyelGlobal = () => {
  if (typeof window === 'undefined') return {};
  window.__LYEL__PAY__ = window.__LYEL__PAY__ || {};
  return window.__LYEL__PAY__;
};

export const setLyelInstance = (instance: LyelPay) => {
  const global = getLyelGlobal();
  global._lyelPayInstance = instance;
};
