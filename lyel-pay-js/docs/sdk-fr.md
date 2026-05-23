
# 📦 SDK Lyel Pay – Documentation (FR)

## 🔰 Objectif

Ce SDK permet d'intégrer rapidement les paiements via l'API Lyel Pay, en suivant le flux métier :  
**Intention ➝ OTP ➝ Vérification ➝ Paiement**

---

## ⚙️ Installation

```bash
npm install @lyel/lyel-pay
```

---

## 🧱 Initialisation

```ts
import { LyelPay } from '@lyel/lyel-pay';

const lyel = new LyelPay({
  apiKey: 'VOTRE_API_KEY',
  env: 'sandbox', // ou 'production'
});
```

---

## 🔄 Flux de paiement typique

```ts
import {
  OPERATION_TYPE_ENDPOINTS,
  IntentionParams,
  InitOtpParams,
  VerifyOtpParams,
  TransactionParams
} from '@lyel/lyel-pay';

// 1. Créer une intention de paiement
const intention = await lyel.createIntention(OPERATION_TYPE_ENDPOINTS.PAYMENT, {
  amount: 5000,
  from: 'MARCHAND_ID',
  to: 'CLIENT_ID',
  description: 'Achat de produits',
});

// 2. Envoyer un OTP au client
await lyel.initOtp({ userId: 'CLIENT_ID' });

// 3. Vérifier l’OTP saisi par le client
await lyel.verifyOtp({ userId: 'CLIENT_ID', otp: '123456' });

// 4. Finaliser le paiement
const result = await lyel.charge({ intentionId: intention.id });

console.log('Paiement effectué ✅', result);
```

---

## 🧩 Méthodes disponibles

| Méthode | Description |
|--------|-------------|
| `createIntention(operation, data)` | Crée une intention de paiement, retrait, dépôt ou transfert |
| `initOtp(params)` | Envoie un OTP au client (SMS/email) |
| `verifyOtp(params)` | Vérifie l'OTP et génère un token |
| `charge(params)` | Déclenche la transaction de paiement |
| `getToken()` | Récupère le token actif (si OTP validé) |

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

## ⚠️ Gestion des erreurs

Le SDK utilise `EventEmitter`. Vous pouvez capter les erreurs :

```ts
lyel.on('error', (err) => {
  console.error('Erreur LyelPay SDK ❌', err);
});
```

---

## 📘 Notes

- Tous les endpoints sont sécurisés par une API key + token OTP
- Le token est stocké temporairement dans l’instance LyelPay (non persistant)
- Vous pouvez implémenter un `logout()` si nécessaire pour réinitialiser `token`
