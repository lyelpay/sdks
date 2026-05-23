
# 🧾 Lyel Pay SDK

> SDK JavaScript/TypeScript pour intégrer facilement les paiements via l’API Lyel Pay.

## 🌐 Bilingual / Bilingue

- [🇫🇷 Documentation française](./docs/sdk-fr.md)
- [🇬🇧 English documentation](./docs/sdk-en.md)

---

## 🚀 Quick Start

### Installation

```bash
npm install @lyel/lyel-pay
```

### Import & Setup

```ts
import { LyelPay, OPERATION_TYPE_ENDPOINTS } from '@lyel/lyel-pay';

const sdk = new LyelPay({
  apiKey: 'YOUR_API_KEY',
  env: 'sandbox', // or 'production'
});
```

### Basic Flow (Intention ➝ OTP ➝ Verify ➝ Charge)

```ts
const intention = await sdk.createIntention(OPERATION_TYPE_ENDPOINTS.PAYMENT, {
  amount: 1000,
  from: 'MERCHANT_ID',
  to: 'CLIENT_ID',
});

await sdk.initOtp({ userId: 'CLIENT_ID' });
await sdk.verifyOtp({ userId: 'CLIENT_ID', otp: '123456' });

const result = await sdk.charge({ intentionId: intention.id });
console.log('✅ Payment done:', result);
```

---

## 📚 Documentation

> Full guides are available under the `/docs` folder:
- Use [`docs/sdk-fr.md`](./docs/sdk-fr.md) for the French version
- Use [`docs/sdk-en.md`](./docs/sdk-en.md) for the English version

---

## 📦 Build

```bash
npm run build
```

## 🛡 License

MIT 
