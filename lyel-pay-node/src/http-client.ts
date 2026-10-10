import { LyelPayApiError } from './errors';
import { LyelPayConfig } from './types';

const DEFAULT_BASE_URL = 'https://api.lyelpay.com';

export type HttpMethod = 'GET' | 'POST';

/** Sends authenticated JSON requests to the gateway API and turns non-2xx answers into LyelPayApiError. */
export class HttpClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config: LyelPayConfig) {
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async request<T>(method: HttpMethod, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) throw await toApiError(res);

    const payload: unknown = await res.json();
    // Trust boundary: the shape is the lyel-pay-api OpenAPI contract this SDK version is pinned to.
    return payload as T;
  }
}

async function toApiError(res: Response): Promise<LyelPayApiError> {
  const body = await res.json().then(
    (parsed: unknown) => parsed,
    () => null,
  );
  return new LyelPayApiError({
    statusCode: res.status,
    message: readMessage(body) ?? `HTTP ${String(res.status)}`,
    code: readCode(body),
    retryAfterSeconds: readRetryAfter(res.headers.get('Retry-After')),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** API errors carry a string message; request validation errors carry a list of them. */
function readMessage(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const { message } = body;
  if (typeof message === 'string' && message.length > 0) return message;
  if (Array.isArray(message)) {
    const parts = message.filter((part): part is string => typeof part === 'string');
    return parts.length > 0 ? parts.join('; ') : null;
  }
  return null;
}

function readCode(body: unknown): string | null {
  if (!isRecord(body)) return null;
  return typeof body.code === 'string' ? body.code : null;
}

function readRetryAfter(header: string | null): number | null {
  if (header === null) return null;
  const seconds = Number(header);
  return Number.isInteger(seconds) && seconds >= 0 ? seconds : null;
}
