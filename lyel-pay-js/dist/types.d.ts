export interface InitOptions {
    apiKey: string;
    env?: 'sandbox' | 'production';
}
export interface InitOtpParams {
    phoneNumber: string;
}
export interface VerifyOtpParams {
    phoneNumber: string;
    code: string;
}
export interface TransactionParams {
    amount: number;
    currency: string;
    description?: string;
    customerId: string;
}
export declare enum OPERATION_TYPE_ENDPOINTS {
    DEPOSIT = "deposit",
    WITHDRAW = "withdraw",
    PAYMENT = "payment",
    TRANSFER = "transfer"
}
export interface IntentionParams {
    amount: number;
    merchantPhoneNumber: string;
    userPhoneNumber: string;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
}
