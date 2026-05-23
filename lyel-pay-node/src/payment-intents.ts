import { LyelPayConfig, PaymentIntent, CreatePaymentIntentParams } from './types';

export class PaymentIntents {
  private readonly config: LyelPayConfig;
  private readonly baseUrl: string;

  constructor(config: LyelPayConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl ?? 'https://api.lyelpay.com';
  }

  async create(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    return this.request<PaymentIntent>('POST', '/gateway/v1/payment-intents', params);
  }

  async retrieve(sessionToken: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>('GET', '/gateway/v1/payment-intents/status', undefined, sessionToken);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    sessionToken?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.secretKey}`,
    };

    if (sessionToken) headers['x-session-token'] = sessionToken;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      const error = new Error((err as { message?: string }).message ?? `HTTP ${res.status}`) as Error & { statusCode: number };
      error.statusCode = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }
}
