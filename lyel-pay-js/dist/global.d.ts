import type { LyelPay } from './sdk';
declare global {
    interface Window {
        __LYEL__PAY__?: {
            _lyelPayInstance?: LyelPay;
        };
    }
}
export declare const getLyelGlobal: () => {
    _lyelPayInstance?: LyelPay;
};
export declare const setLyelInstance: (instance: LyelPay) => void;
