import { LyelPayApiError, LyelPayUnexpectedResponseError } from './errors';
import { isRecord } from './guards';
import { LyelPayConfig } from './types';

const DEFAULT_BASE_URL = 'https://api.lyelpay.com';

export type HttpMethod = 'GET' | 'POST';

export type ResponseGuard<T> = (value: unknown) => value is T;

/**
 * Sends authenticated JSON requests to the gateway API. Non-2xx answers become LyelPayApiError;
 * a 2xx answer that is not JSON or fails `isExpected` becomes LyelPayUnexpectedResponseError.
 */
export class HttpClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(config: LyelPayConfig) {
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async request<T>(method: HttpMethod, path: string, isExpected: ResponseGuard<T>, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) throw await toApiError(res);

    const payload = await readJson(res);
    if (!isExpected(payload)) {
      throw new LyelPayUnexpectedResponseError(res.status, `Unexpected response from ${method} ${path}`);
    }
    return payload;
  }
}

/** `undefined` when the body is not JSON: it never matches a guard nor an error shape. */
async function readJson(res: Response): Promise<unknown> {
  return res.json().then(
    (parsed: unknown) => parsed,
    () => undefined,
  );
}

async function toApiError(res: Response): Promise<LyelPayApiError> {
  const body = await readJson(res);
  return new LyelPayApiError({
    statusCode: res.status,
    message: readMessage(body) ?? `HTTP ${String(res.status)}`,
    code: readCode(body),
    retryAfterSeconds: readRetryAfter(res.headers.get('Retry-After')),
  });
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
