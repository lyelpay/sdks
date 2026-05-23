import React, { useState } from 'react';
import { Card, CardBody, Form, FormGroup, Label, Input, Button, Row } from 'reactstrap';
import logoImg from '../../assets/images/logo.png';

interface LPCheckoutFormProps {
    amount: number;
    onPaymentInitiated: (phoneNumber: string, webPassword: string) => void;
    title?: string;
    logo?: string;
    buttonTitle?: string;
}

const LPCheckoutForm: React.FC<LPCheckoutFormProps> = ({
   amount,
   onPaymentInitiated,
    title = 'Paiement checkout',
    logo = logoImg,
    buttonTitle = 'Payer'
}) => {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [webPassword, setWebPassword] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPaymentInitiated(phoneNumber, webPassword);
    };

    return (
        <Card>
            <CardBody>
                <div className="logo-container">
                    <img src={logo} alt="Lyel-Pay"/>
                </div>
                <Form onSubmit={handleSubmit} className="lp-checkout-form">
                    {/* eslint-disable-next-line react/jsx-no-undef */}
                    <Row>
                        <h3>{title}</h3>
                    </Row>
                    <FormGroup>
                        <Label>Montant: {amount.toFixed(2)} FCFA</Label>
                    </FormGroup>
                    <FormGroup style={{ paddingBottom: 15 }}>
                        <Label>Numéro de téléphone</Label>
                        <Input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                    </FormGroup>
                    <FormGroup>
                        <Label>Passcode</Label>
                        <Input type="password" value={webPassword} onChange={e => setWebPassword(e.target.value)} required />
                    </FormGroup>
                    <Button type="submit" color="primary" className="submit-button">{buttonTitle}</Button>
                </Form>
            </CardBody>
        </Card>
    );
};

export default LPCheckoutForm;
