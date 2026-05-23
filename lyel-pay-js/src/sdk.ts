import EventEmitter from 'eventemitter3';
import type {
  InitOptions,
  TransactionParams,
  InitOtpParams,
  VerifyOtpParams,
  IntentionParams,
  OPERATION_TYPE_ENDPOINTS,
} from './types';
import { SANDBOX_BASE_URL, PROD_BASE_URL } from './constants';

export class LyelPay extends EventEmitter {
  private apiKey: string;
  private env: 'sandbox' | 'production';
  private baseUrl: string;
  private token: string | null = null;

  constructor(options: InitOptions) {
    super();
    this.apiKey = options.apiKey;
    this.env = options.env || 'sandbox';
    this.baseUrl = this.env === 'production'
      ? PROD_BASE_URL
      : SANDBOX_BASE_URL;
  }

  async createIntention(operation: OPERATION_TYPE_ENDPOINTS, data: IntentionParams): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/intention/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Intention creation failed');
      return result;
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }

  async initOtp(params: InitOtpParams): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/otp/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'OTP init failed');
      }
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }

  async verifyOtp(params: VerifyOtpParams): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      this.token = data.token;
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }

  async charge(params: TransactionParams): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/payment/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Charge failed');
      return data;
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }

  getToken(): string | null {
    return this.token;
  }
}
