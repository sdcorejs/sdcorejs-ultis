/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Options for the bounded, best-effort private-mode heuristic.
 * @deprecated Used only by the deprecated `detectIncognito` heuristic. Private mode
 * cannot be detected reliably; remove dependent decisions instead of treating timeout
 * tuning as a reliable replacement.
 */
export interface DetectIncognitoOptions {
  /** Maximum time spent waiting for a browser heuristic. Clamped to 5 seconds. */
  timeoutMs?: number;
}

/**
 * Unreliable heuristic result retained for non-security compatibility uses.
 * @deprecated No reliable private-mode signal or replacement exists. Remove dependent
 * security, authorization, fraud, or privacy decisions; non-security analytics must
 * tolerate false results and browser changes.
 */
export interface IncognitoDetectionResult {
  /** Best-effort private-mode guess; false positives and false negatives are expected. */
  isPrivate: boolean;
  /** Browser family inferred by the heuristic, or `Unknown`. */
  browserName: string;
}

/**
 * Best-effort private browsing heuristic.
 *
 * Behavior remains a bounded best-effort compatibility heuristic in v1.2.
 * @deprecated Browser privacy modes are intentionally not reliably detectable and
 * there is no reliable replacement. Remove dependent security/authorization logic;
 * analytics uses must tolerate false positives, false negatives, and browser changes.
 */
export const detectIncognito = (options: DetectIncognitoOptions = {}): Promise<IncognitoDetectionResult> => {
  return new Promise(resolve => {
    const requestedTimeout = Number.isFinite(options.timeoutMs) ? Math.max(0, options.timeoutMs as number) : 1000;
    const timeoutMs = Math.min(requestedTimeout, 5000);
    let settled = false;
    let browserName = 'Unknown';

    const finish = (isPrivate = false): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ isPrivate, browserName });
    };
    const timer = setTimeout(() => finish(false), timeoutMs);

    try {
      const ua = navigator.userAgent ?? '';
      const vendor = navigator.vendor ?? '';
      if (/Firefox/iu.test(ua)) {
        browserName = 'Firefox';
        finish(navigator.serviceWorker === undefined);
        return;
      }
      if (/MSIE|Trident/iu.test(ua)) {
        browserName = 'Internet Explorer';
        finish(window.indexedDB === undefined);
        return;
      }
      if (/Apple/iu.test(vendor) && /Safari/iu.test(ua) && !/Chrome|Chromium/iu.test(ua)) {
        browserName = 'Safari';
        const name = `sdcore-incognito-${Math.random().toString(36).slice(2)}`;
        const request = window.indexedDB?.open(name, 1);
        if (!request) {
          finish(false);
          return;
        }
        request.onerror = () => finish(true);
        request.onblocked = () => finish(false);
        request.onsuccess = () => {
          request.result.close();
          window.indexedDB.deleteDatabase(name);
          finish(false);
        };
        request.onupgradeneeded = () => {
          try {
            request.result.createObjectStore('test').put(new Blob(), 'value');
          } catch {
            finish(true);
          }
        };
        return;
      }
      if (/Chrome|Chromium|Edg|OPR/iu.test(ua) || /Google/iu.test(vendor)) {
        browserName = (navigator as any).brave ? 'Brave' : /Edg/iu.test(ua) ? 'Edge' : /OPR/iu.test(ua) ? 'Opera' : 'Chrome';
        const temporaryStorage = (navigator as any).webkitTemporaryStorage;
        if (temporaryStorage?.queryUsageAndQuota) {
          temporaryStorage.queryUsageAndQuota(
            (_usage: number, quota: number) => finish(quota < 120 * 1024 * 1024),
            () => finish(false)
          );
          return;
        }
        finish(false);
        return;
      }
      finish(false);
    } catch {
      finish(false);
    }
  });
};
