import { StringUtilities } from '@sdcorejs/utils/fns';

interface SessionPayload {
  userId: string;
  expiresAt: string;
}

const key = crypto.getRandomValues(new Uint8Array(32));
const additionalData = 'tenant:acme';
const token = await StringUtilities.encryptAesGcm<SessionPayload>(
  { userId: 'user-42', expiresAt: '2026-07-21T00:00:00Z' },
  key,
  { additionalData },
);
const restored = await StringUtilities.decryptAesGcm<SessionPayload>(
  token,
  key,
  { additionalData },
);

void restored;
