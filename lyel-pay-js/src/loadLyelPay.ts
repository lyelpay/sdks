import { LyelPay } from './sdk';
import { InitOptions } from './types';
import { getLyelGlobal, setLyelInstance } from './global';

export const loadLyelPay = (options: InitOptions): LyelPay => {
    const global = getLyelGlobal();
  
    if (global._lyelPayInstance) {
      return global._lyelPayInstance;
    }
  
    const instance = new LyelPay(options);
    setLyelInstance(instance);
    return instance;
};