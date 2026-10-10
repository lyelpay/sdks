export const EXPIRY_WARNING_MS = 2 * 60 * 1000;

export function isExpiryWarning(expiresAt: Date, now: Date): boolean {
  const left = expiresAt.getTime() - now.getTime();
  return left > 0 && left <= EXPIRY_WARNING_MS;
}

export function secondsUntil(date: Date | null, now: Date): number {
  return date ? Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 1000)) : 0;
}
