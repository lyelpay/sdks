import EventEmitter from 'eventemitter3';
import type { InitOptions, TransactionParams, InitOtpParams, VerifyOtpParams, IntentionParams, OPERATION_TYPE_ENDPOINTS } from './types';
export declare class LyelPay extends EventEmitter {
    private apiKey;
    private env;
    private baseUrl;
    private token;
    constructor(options: InitOptions);
    createIntention(operation: OPERATION_TYPE_ENDPOINTS, data: IntentionParams): Promise<any>;
    initOtp(params: InitOtpParams): Promise<void>;
    verifyOtp(params: VerifyOtpParams): Promise<void>;
    charge(params: TransactionParams): Promise<any>;
    getToken(): string | null;
}
