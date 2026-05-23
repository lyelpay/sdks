const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.lyel.co';

interface ApiOptions {
  pk: string;
  sessionToken: string;
}

interface OtpResponse {
  message: string;
}

interface StatusResponse {
  status: string;
  reference?: string;
}

interface ConfirmResponse {
  status: string;
  reference: string;
}

async function post<T>(path: string, opts: ApiOptions, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.pk}`,
      'x-session-token': opts.sessionToken,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

async function get<T>(path: string, opts: ApiOptions): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${opts.pk}`,
      'x-session-token': opts.sessionToken,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export function requestOtp(opts: ApiOptions, phoneNumber: string): Promise<OtpResponse> {
  return post('/gateway/v1/payment-intents/request-otp', opts, { phoneNumber });
}

export function confirmPayment(opts: ApiOptions, otp: string): Promise<ConfirmResponse> {
  return post('/gateway/v1/payment-intents/confirm', opts, { otp });
}

export function getStatus(opts: ApiOptions): Promise<StatusResponse> {
  return get('/gateway/v1/payment-intents/status', opts);
}
