export type LyelPayMode = 'live' | 'test';

export interface LyelPayConfig {
  secretKey: string;
  baseUrl?: string;
}

export interface PaymentIntent {
  id: string;
  amount: string;
  currency: string;
  status: PaymentIntentStatus;
  mode: 'LIVE' | 'TEST';
  sessionToken: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  expiresAt: string;
  createdAt: string;
}

export type PaymentIntentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

export interface CreatePaymentIntentParams {
  amount: string;
  currency: 'XAF' | 'XOF';
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookEvent {
  id: string;
  type: 'payment.completed' | 'payment.failed' | 'payment.expired';
  created: number;
  data: {
    paymentIntent: PaymentIntent;
  };
}

export interface LyelPayError {
  statusCode: number;
  message: string;
}
