import React, { useState } from 'react';
import { useLyelPay } from '../../context/LyelPayContext';
import LPCheckoutForm from './LPCheckoutForm';
import LPOtpValidationForm from './LPOtpValidationForm';
import config from '../../config';
import {LPAuthResponse} from "../../types";

const LyelPayElements: React.FC = () => {
    const { baseUrl } = config;
    const [step, setStep] = useState(1);
    const [paymentIntent, setPaymentIntent] = useState<{
        id: string;
        amount: number;
        status: string;
    }>({
        id: '',
        amount: 0,
        status: ''
    });
    const [auth, setAuth] = useState<LPAuthResponse>({
        id: '',
        token: '',
        phoneNumber: '',
        roles: []
    });
    const lyelPayContext = useLyelPay();

    if (!lyelPayContext) {
        return <div>Loading...</div>;
    }

    const { lyelPay } = lyelPayContext;

    if (!lyelPay) {
        return <div>Loading...</div>;
    }

    const { apiKey, amount } = lyelPay;



    const handlePaymentIntent = async (phoneNumber: string, password: string) => {
        const authResponse = await fetch(`${baseUrl}/auth/web`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                phoneNumber,
                password
            })
        });
        const authData = await authResponse.json();
        setAuth(authData);

        const response = await fetch(`${baseUrl}/payment/intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
                phoneNumber,
                password,
                amount
            })
        })
        const data = await response.json();
        setPaymentIntent(data);
        setStep(2);
    };

    const handleOtpValidation = async (otp: string) => {
        await fetch(`${baseUrl}/payment/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                otp
            })
        });
    };

    return (
        <div>
            {step === 1 ? (
                <LPCheckoutForm amount={1000} onPaymentInitiated={handlePaymentIntent} />
            ) : (
                <LPOtpValidationForm onOtpValidation={handleOtpValidation} />
            )}
        </div>
    );
};

export default LyelPayElements;
