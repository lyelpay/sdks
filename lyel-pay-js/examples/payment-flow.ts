import { LyelPay, OPERATION_TYPE_ENDPOINTS } from '../dist/index';

async function run() {
  const sdk = new LyelPay({ apiKey: 'demo-key', env: 'sandbox' });

  const intent = await sdk.createIntention(OPERATION_TYPE_ENDPOINTS.PAYMENT, {
    amount: 1000,
    from: 'merchant_x',
    to: 'user_y',
  });

  await sdk.initOtp({ userId: 'user_y' });
  await sdk.verifyOtp({ userId: 'user_y', otp: '123456' });
  const result = await sdk.charge({ intentionId: intent.id });

  console.log('Transaction terminée ✅', result);
}

run();
