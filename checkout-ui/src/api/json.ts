export type JsonRecord = Readonly<Record<string, unknown>>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class InvalidResponseError extends Error {}

export function str(record: JsonRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new InvalidResponseError(`${key} must be a string`);
  return value;
}

export function nullableStr(record: JsonRecord, key: string): string | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new InvalidResponseError(`${key} must be a string or null`);
  return value;
}

export function num(record: JsonRecord, key: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new InvalidResponseError(`${key} must be a number`);
  return value;
}

export function bool(record: JsonRecord, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function date(record: JsonRecord, key: string): Date {
  const parsed = new Date(str(record, key));
  if (Number.isNaN(parsed.getTime())) throw new InvalidResponseError(`${key} must be a date`);
  return parsed;
}

export function nullableDate(record: JsonRecord, key: string): Date | null {
  return nullableStr(record, key) === null ? null : date(record, key);
}

export function rec(record: JsonRecord, key: string): JsonRecord {
  const value = record[key];
  if (!isRecord(value)) throw new InvalidResponseError(`${key} must be an object`);
  return value;
}

export function oneOf<T extends string>(record: JsonRecord, key: string, allowed: readonly T[]): T {
  const value = str(record, key);
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) throw new InvalidResponseError(`${key} has an unknown value`);
  return match;
}
