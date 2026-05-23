import React, { useState } from 'react';

interface LPOtpValidationFormProps {
    onOtpValidation: (otp: string) => void;
    title?: string;
    buttonTitle?: string;
}

const LPOtpValidationForm: React.FC<LPOtpValidationFormProps> = ({
    onOtpValidation,
    title = 'Code OTP',
    buttonTitle = 'Valider'
}) => {
    const [otp, setOtp] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onOtpValidation(otp);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>{title}</label>
                <input type="text" pattern="\d*" maxLength={4} value={otp} onChange={e => setOtp(e.target.value)} required />
            </div>
            <button type="submit">{buttonTitle}</button>
        </form>
    );
};

export default LPOtpValidationForm;
