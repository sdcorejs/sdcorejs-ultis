import {
  canonicalStringify,
  hash32,
  sha256Canonical,
  StringUtilities,
} from '@sdcorejs/utils/fns';

const value = {
  roles: new Set(['admin', 'editor']),
  limits: new Map([['daily', 500]]),
  updatedAt: new Date('2026-07-20T10:00:00Z'),
};

const canonical = canonicalStringify(value);
const cacheBucket = hash32(value); // Fast and non-cryptographic.
const integrityDigest = await sha256Canonical(value); // Lowercase SHA-256 hex.
const textDigest = await StringUtilities.sha256(canonical);

void [canonical, cacheBucket, integrityDigest, textDigest];
