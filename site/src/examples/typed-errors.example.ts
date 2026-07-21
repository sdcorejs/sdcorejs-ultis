import {
  CircularReferenceError,
  DateParseError,
  EmptySubscribableError,
  EncryptionAuthenticationError,
  EncryptionFormatError,
  FilePickerCancelledError,
  FilterValidationError,
  PagingLimitError,
  PagingResponseError,
  SecureRandomUnavailableError,
  SecurityError,
  SerializationError,
  SdcoreUtilsError,
  StringUtilities,
  UnsupportedSerializationTypeError,
  UnsafeObjectKeyError,
  UnsafePropertyPathError,
  UnsafeUrlProtocolError,
  Utilities,
  ValidationError,
  WebCryptoUnavailableError,
  type SdcoreUtilsErrorOptions,
} from '@sdcorejs/utils';

const diagnosticContext: SdcoreUtilsErrorOptions = {
  cause: new Error('Redact this cause before external logging.'),
};

export function describeUtilityError(error: unknown): string | null {
  if (error instanceof UnsafeObjectKeyError) return `Rejected key: ${error.key}`;
  if (error instanceof UnsafePropertyPathError) return `Rejected path: ${error.path}`;
  if (error instanceof CircularReferenceError) return 'The input graph contains a cycle.';
  if (error instanceof UnsupportedSerializationTypeError) {
    return `Unsupported value type: ${error.valueType}`;
  }
  if (error instanceof WebCryptoUnavailableError) return 'Web Crypto is unavailable.';
  if (error instanceof SecureRandomUnavailableError) return 'Secure randomness is unavailable.';
  if (error instanceof EncryptionFormatError) return 'The encrypted token is malformed.';
  if (error instanceof EncryptionAuthenticationError) return 'The encrypted token was rejected.';
  if (error instanceof FilterValidationError) return 'The filter definition is invalid.';
  if (error instanceof DateParseError) return 'The date input is invalid.';
  if (error instanceof PagingResponseError) return 'The paging response broke its contract.';
  if (error instanceof PagingLimitError) return 'The paging safety limit was reached.';
  if (error instanceof FilePickerCancelledError) return 'File selection was cancelled.';
  if (error instanceof UnsafeUrlProtocolError) return `Rejected protocol: ${error.protocol}`;
  if (error instanceof EmptySubscribableError) return 'The source completed without a value.';
  if (error instanceof SerializationError) return 'Serialization failed.';
  if (error instanceof SecurityError) return 'A security boundary rejected the operation.';
  if (error instanceof ValidationError) return 'Input validation failed.';
  if (error instanceof SdcoreUtilsError) return 'A utility operation failed.';
  return null;
}

export async function decryptTrustedPayload(token: string, key: Uint8Array): Promise<unknown> {
  try {
    return await StringUtilities.decryptAesGcm(token, key);
  } catch (error: unknown) {
    if (error instanceof EncryptionAuthenticationError) {
      throw new Error('The payload could not be authenticated.');
    }
    if (error instanceof EncryptionFormatError) {
      throw new Error('The payload format is unsupported.');
    }
    if (error instanceof WebCryptoUnavailableError) {
      throw new Error('This runtime does not provide the required Web Crypto capability.');
    }
    throw error;
  }
}

export function generateSecureRequestId(): string {
  try {
    return Utilities.generateUuid();
  } catch (error: unknown) {
    if (error instanceof SecureRandomUnavailableError) {
      throw new Error('Secure request IDs are unavailable in this runtime.');
    }
    throw error;
  }
}

export function isPagingContractError(error: unknown): boolean {
  return error instanceof PagingResponseError || error instanceof PagingLimitError;
}

void diagnosticContext;
