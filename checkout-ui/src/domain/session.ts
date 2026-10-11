export const INTENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELED'] as const;
export type IntentStatus = (typeof INTENT_STATUSES)[number];

export const BUTTON_LABELS = ['PAY', 'PAY_AMOUNT', 'CONFIRM_ORDER', 'DONATE'] as const;
export type ButtonLabel = (typeof BUTTON_LABELS)[number];

export type IntentMode = 'TEST' | 'LIVE';
export type Surface = 'modal' | 'embedded' | 'hosted';

export interface OtpProgress {
  channel: 'WHATSAPP' | 'TEST';
  maskedPhoneNumber: string;
  expiresAt: Date | null;
  remainingAttempts: number;
  remainingSends: number;
  resendAvailableAt: Date | null;
}

export interface Embedding {
  allowedDomains: readonly string[];
  allowLocalhost: boolean;
}

export interface CheckoutMerchant {
  name: string;
  logoPath: string | null;
  primaryColor: string | null;
  buttonLabel: ButtonLabel;
  /** Absent until the API sends it: read as shown. */
  showSecuredBadge: boolean | undefined;
}

/** What the API says the checkout displays; amount and merchant never come from the browser (S9). */
export interface CheckoutSession {
  id: string;
  status: IntentStatus;
  reference: string;
  amount: string;
  currency: string;
  description: string | null;
  mode: IntentMode;
  locale: string;
  expiresAt: Date;
  merchant: CheckoutMerchant;
  returnUrls: { success: string; cancel: string } | null;
  customerPhoneNumber: string | null;
  otp: OtpProgress | null;
  embedding: Embedding;
}
