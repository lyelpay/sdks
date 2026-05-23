import { ReactNode } from "react";

export interface LyelPayInstance {
    apiKey: string;
    initializationDate: Date;
    amount: number;
    clientSecret: string;
}

export interface LyelPayProviderProps {
    children: ReactNode;
    lyelPayInstance: Promise<LyelPayInstance>;
}

export interface LyelPayContextData {
    lyelPay: LyelPayInstance | undefined;
}

// TODO complete
export interface LPCheckoutFormProps {
    amount: number;
    onPaymentInitiated: (phoneNumber: string, webPassword: string) => void;
    title?: string;
    logo?: string;
    buttonTitle?: string;
}

// TODO complete
export interface LPProps {
    formProps: LPCheckoutFormProps;
}

// TODO complete
export interface LPPaymentIntent {
    amount: number;
    phoneNumber: string;
    webPassword: string;
}

// TODO complete
export interface LPPaymentConfirmation {
    paymentIntentId: string;
    otp: string;
}

// TODO complete
export interface LPAuthResponse {
    id: string;
    token: string;
    phoneNumber: string;
    roles: string[];
}
