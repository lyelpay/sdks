
# 📦 Lyel Pay SDK

## 🔰 Purpose

This SDK allows you to easily integrate payments using the Lyel Pay API by following the official transaction flow:  
**Intention ➝ OTP ➝ Verification ➝ Payment**

---

## ⚙️ Installation

```bash
npm install @lyel/lyel-pay
```

---

## 🧱 Initialization

```ts
import { LyelPay } from '@lyel/lyel-pay';

const lyel = new LyelPay({
  apiKey: 'YOUR_API_KEY',
  env: 'sandbox', // or 'production'
});
```

---

## 🔄 Typical Payment Flow

```ts
import {
  OPERATION_TYPE_ENDPOINTS,
  IntentionParams,
  InitOtpParams,
  VerifyOtpParams,
  TransactionParams
} from '@lyel/lyel-pay';

// 1. Create a payment intention
const intention = await lyel.createIntention(OPERATION_TYPE_ENDPOINTS.PAYMENT, {
  amount: 5000,
  from: 'MERCHANT_ID',
  to: 'CLIENT_ID',
  description: 'Product purchase',
});

// 2. Send OTP to client
await lyel.initOtp({ userId: 'CLIENT_ID' });

// 3. Verify OTP entered by the client
await lyel.verifyOtp({ userId: 'CLIENT_ID', otp: '123456' });

// 4. Execute the payment
const result = await lyel.charge({ intentionId: intention.id });

console.log('Payment successful ✅', result);
```

---

## 🧩 Available Methods

| Method | Description |
|--------|-------------|
| `createIntention(operation, data)` | Creates an operation intention (payment, withdraw, deposit, transfer) |
| `initOtp(params)` | Sends an OTP to the user (SMS/email) |
| `verifyOtp(params)` | Verifies OTP and returns a token |
| `charge(params)` | Executes the payment transaction |
| `getToken()` | Returns the current OTP token (if verified) |

---

## 🛠️ Types & Enum

```ts
enum OPERATION_TYPE_ENDPOINTS {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  PAYMENT = 'payment',
  TRANSFER = 'transfer',
}

interface IntentionParams {
  amount: number;
  from: string;
  to: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface InitOtpParams {
  userId: string;
  channel?: 'sms' | 'email';
}

interface VerifyOtpParams {
  userId: string;
  otp: string;
}

interface TransactionParams {
  intentionId: string;
  confirmationMethod?: string;
  metadata?: Record<string, any>;
}
```

---

## ⚠️ Error Handling

The SDK uses `EventEmitter`. You can listen to errors like so:

```ts
lyel.on('error', (err) => {
  console.error('LyelPay SDK Error ❌', err);
});
```

---

## 📘 Notes

- All endpoints are protected by an API key and OTP-based token
- The token is temporarily stored in the LyelPay instance (not persistent)
- You can implement a custom `logout()` if needed to clear the token
