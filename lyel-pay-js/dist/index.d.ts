import EventEmitter from 'eventemitter3';

interface InitOptions {
    apiKey: string;
    env?: 'sandbox' | 'production';
}
interface InitOtpParams {
    phoneNumber: string;
}
interface VerifyOtpParams {
    phoneNumber: string;
    code: string;
}
interface TransactionParams {
    amount: number;
    currency: string;
    description?: string;
    customerId: string;
}
declare enum OPERATION_TYPE_ENDPOINTS {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    PAYMENT = "payment",
    TRANSFER = "transfer"
}
interface IntentionParams {
    amount: number;
    merchantPhoneNumber: string;
    userPhoneNumber: string;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
}

declare class LyelPay extends EventEmitter {
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

declare const loadLyelPay: (options: InitOptions) => LyelPay;

export { OPERATION_TYPE_ENDPOINTS, loadLyelPay };
export type { InitOptions, InitOtpParams, IntentionParams, TransactionParams, VerifyOtpParams };
