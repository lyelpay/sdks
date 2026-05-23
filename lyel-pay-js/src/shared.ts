export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';
  
export const warn = (msg: string): void => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[LyelPay SDK] ${msg}`);
    }
};