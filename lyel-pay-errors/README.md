# `@lyelpay/errors`

Stable **error code** constants for Lyel Pay API responses. The HTTP contract remains `{ message: string; code: string }`; the `code` field is the stable identifier for clients and **i18n on the front** (this package does not ship translated messages).

## Install

**Registry:** `npm install @lyelpay/errors`

**CI / registry:** publish `@lyelpay/errors` to your npm-compatible registry (e.g. AWS CodeArtifact), then install with the version range your release process defines.

**Monorepo (local, optional):** when working inside this monorepo, you can wire the dependency to the local path (for example):

```json
"@lyelpay/errors": "file:../packages/lyel-pay-errors"
```

After changing codes in this package, run `npm run build` here so `dist/` is up to date for consumers that resolve the built entry.

## Usage

```ts
import { ErrorCodes, type ErrorCode } from '@lyelpay/errors';

throw new ApiException('…', HttpStatus.BAD_REQUEST, ErrorCodes.E_INVALID_QR_CODE);

function isKnown(code: string): code is ErrorCode {
  return Object.values(ErrorCodes).includes(code as ErrorCode);
}
```

## Conventions

- **Values** are uppercase `snake_case`, usually prefixed with `E_` for historical API compatibility.
- **Do not change** existing string values: mobile and web clients depend on them.
- **New codes:** add entries directly in `src/error-codes.ts`, then run `npm run build`.
