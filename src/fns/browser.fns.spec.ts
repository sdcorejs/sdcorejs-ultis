// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { BrowserUtilities } from './browser.fns';
import { FilePickerCancelledError, UnsafeUrlProtocolError, ValidationError } from '../errors';

// ─── helpers ─────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

// ─── helper: stub navigator.userAgent in jsdom ───────────────────────────────

// jsdom's navigator.userAgent lives on the prototype as a configurable getter,
// but vi.stubGlobal cannot override it because jsdom locks the window.navigator
// property itself. The reliable approach is to shadow it directly on the
// navigator instance — jsdom allows that — and clean up with `delete` afterwards.

function stubUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
    writable: false,
  });
}

function restoreUserAgent() {
  // Delete the own property so the prototype getter takes over again.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (navigator as any).userAgent;
}

// ─── isMobile ────────────────────────────────────────────────────────────────

describe('BrowserUtilities.isMobile', () => {
  afterEach(() => {
    restoreUserAgent();
  });

  it('returns true for an iPhone user-agent (contains "Mobile")', () => {
    // Real iOS Safari UA includes "Mobile" which matches the /Mobi/ branch of the regex.
    stubUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns true for an Android user-agent', () => {
    stubUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36');
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns true for a generic "Mobi" user-agent', () => {
    stubUserAgent('SomeBrowser/1.0 Mobi/Safari');
    expect(BrowserUtilities.isMobile()).toBe(true);
  });

  it('returns false for a standard desktop Chrome user-agent', () => {
    stubUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );
    expect(BrowserUtilities.isMobile()).toBe(false);
  });

  it('returns false for a macOS Safari user-agent', () => {
    stubUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15'
    );
    expect(BrowserUtilities.isMobile()).toBe(false);
  });
});

// ─── detectIncognito ─────────────────────────────────────────────────────────

describe('BrowserUtilities.detectIncognito', () => {
  it('is a function exposed on BrowserUtilities', () => {
    expect(typeof BrowserUtilities.detectIncognito).toBe('function');
  });

  it('returns a Promise', () => {
    // detectIncognito uses browser-specific APIs that may reject in jsdom;
    // we only verify the return type without awaiting the resolution.
    const result = BrowserUtilities.detectIncognito();
    expect(result).toBeInstanceOf(Promise);
    // Prevent unhandled rejection from propagating in test output
    result.catch(() => {/* intentionally ignored */});
  });
});

// ─── copyToClipboard ─────────────────────────────────────────────────────────

describe('BrowserUtilities.copyToClipboard', () => {
  it('calls navigator.clipboard.writeText with the given text', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    BrowserUtilities.copyToClipboard('hello world');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('hello world');
  });

  it('calls writeText with an empty string', () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    BrowserUtilities.copyToClipboard('');

    expect(writeText).toHaveBeenCalledWith('');
  });

  it('returns an awaitable Promise and propagates clipboard errors', async () => {
    const failure = new Error('permission denied');
    const writeText = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(BrowserUtilities.copyToClipboard('secret')).rejects.toBe(failure);
  });
});

// ─── download (smoke tests) ──────────────────────────────────────────────────

describe('BrowserUtilities.download', () => {
  it('does not throw when called with null', () => {
    expect(() => BrowserUtilities.download(null)).not.toThrow();
  });

  it('does not throw when called with undefined', () => {
    expect(() => BrowserUtilities.download(undefined)).not.toThrow();
  });

  it('creates and clicks an <a> element when given a URL string', () => {
    // Spy on document.createElement to intercept the <a> tag the function creates
    const mockClick = vi.fn();
    const mockA = {
      href: '',
      download: '',
      target: '',
      style: { visibility: '' },
      click: mockClick,
      remove: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockA as unknown as HTMLElement);

    // appendchild / removeChild should not throw
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA as unknown as Node);

    BrowserUtilities.download('/api/export?format=csv', 'data.csv');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('sets target="_blank" for http:// URLs', () => {
    const mockA = {
      href: '',
      download: '',
      target: '',
      style: { visibility: '' },
      click: vi.fn(),
      remove: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockA as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA as unknown as Node);

    BrowserUtilities.download('https://example.com/report.pdf');

    expect(mockA.target).toBe('_blank');
    expect((mockA as any).rel).toBe('noopener noreferrer');
  });
});

function setFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: {
      length: files.length,
      item: (index: number) => files[index] ?? null,
      [Symbol.iterator]: function* () { yield* files; },
    },
  });
}

describe('BrowserUtilities.upload hardening', () => {
  beforeEach(() => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_VALUE])(
    'rejects invalid maxSizeInMb %s before opening a picker or invoking validators',
    async (maxSizeInMb) => {
      const validator = vi.fn(() => undefined);
      const fileValidator = vi.fn(() => undefined);

      await expect(BrowserUtilities.upload({ maxSizeInMb, validator, fileValidator }))
        .rejects.toBeInstanceOf(ValidationError);
      expect(document.querySelectorAll('input[type=file]')).toHaveLength(0);
      expect(HTMLInputElement.prototype.click).not.toHaveBeenCalled();
      expect(validator).not.toHaveBeenCalled();
      expect(fileValidator).not.toHaveBeenCalled();
    },
  );

  it('uses unique inputs for concurrent pickers and settles each independently', async () => {
    const firstPromise = BrowserUtilities.upload();
    const secondPromise = BrowserUtilities.upload({ multiple: true });
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type=file]'));
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);

    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    setFiles(inputs[0], [file]);
    inputs[0].dispatchEvent(new Event('change'));
    inputs[1].dispatchEvent(new Event('cancel'));

    await expect(firstPromise).resolves.toBe(file);
    await expect(secondPromise).rejects.toBeInstanceOf(FilePickerCancelledError);
    expect(document.querySelectorAll('input[type=file]')).toHaveLength(0);
  });

  it('sets accept and validates size before invoking each custom validator once', async () => {
    const filenameValidator = vi.fn(() => undefined);
    const fileValidator = vi.fn(() => undefined);
    const selected = BrowserUtilities.upload({
      accept: 'image/*,.pdf',
      extensions: ['txt'],
      maxSizeInMb: 0.000001,
      validator: filenameValidator,
      fileValidator,
    });
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    expect(input.accept).toBe('image/*,.pdf');
    setFiles(input, [new File(['too large'], 'bad.exe')]);
    input.dispatchEvent(new Event('change'));

    await expect(selected).rejects.toBeInstanceOf(ValidationError);
    expect(filenameValidator).not.toHaveBeenCalled();
    expect(fileValidator).not.toHaveBeenCalled();
    expect(input.isConnected).toBe(false);
  });

  it('runs the legacy filename validator and full File validator exactly once', async () => {
    const filenameValidator = vi.fn(() => undefined);
    const fileValidator = vi.fn(() => undefined);
    const selected = BrowserUtilities.upload({ extensions: ['txt'], validator: filenameValidator, fileValidator });
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    const file = new File(['ok'], 'report.TXT');
    setFiles(input, [file]);
    input.dispatchEvent(new Event('change'));

    await expect(selected).resolves.toBe(file);
    expect(filenameValidator).toHaveBeenCalledOnce();
    expect(filenameValidator).toHaveBeenCalledWith('report.TXT');
    expect(fileValidator).toHaveBeenCalledOnce();
    expect(fileValidator).toHaveBeenCalledWith(file);
  });

  it('rejects an empty change and cleans up', async () => {
    const selected = BrowserUtilities.upload();
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    setFiles(input, []);
    input.dispatchEvent(new Event('change'));
    await expect(selected).rejects.toBeInstanceOf(FilePickerCancelledError);
    expect(input.isConnected).toBe(false);
  });

  it('settles and cleans up after the configured timeout', async () => {
    vi.useFakeTimers();
    const selected = BrowserUtilities.upload({ timeoutMs: 25 });
    const rejection = expect(selected).rejects.toBeInstanceOf(FilePickerCancelledError);
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    await vi.advanceTimersByTimeAsync(25);
    await rejection;
    expect(input.isConnected).toBe(false);
  });
});

describe('BrowserUtilities URL and blob hardening', () => {
  const anchorHarness = () => {
    const originalCreate = document.createElement.bind(document);
    const anchor = originalCreate('a');
    vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    vi.spyOn(document, 'createElement').mockImplementation(tag => tag === 'a' ? anchor : originalCreate(tag));
    return anchor;
  };

  it('downloads same-origin relative paths and secures absolute http links', () => {
    const relative = anchorHarness();
    BrowserUtilities.download('/api/export', 'report.csv');
    expect(relative.download).toBe('report.csv');
    expect(relative.target).toBe('');
    vi.restoreAllMocks();

    const remote = anchorHarness();
    BrowserUtilities.download('https://example.com/report');
    expect(remote.target).toBe('_blank');
    expect(remote.rel).toBe('noopener noreferrer');
  });

  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'vbscript:msgbox(1)'])(
    'rejects unsafe protocol %s',
    value => expect(() => BrowserUtilities.download(value)).toThrow(UnsafeUrlProtocolError)
  );

  it.each(['javascript', 'javascript:', 'vbscript', 'vbscript:'])(
    'never allows active protocol %s through additionalProtocols',
    protocol => expect(() => BrowserUtilities.download(
      `${protocol.replace(/:$/u, '')}:alert(1)`,
      undefined,
      { additionalProtocols: [protocol] },
    )).toThrow(UnsafeUrlProtocolError),
  );

  it('requires explicit opt-in for data URLs and rejects malformed input', () => {
    expect(() => BrowserUtilities.download('data:text/plain,hello')).toThrow(UnsafeUrlProtocolError);
    expect(() => BrowserUtilities.download(
      'data:text/plain,hello',
      'hello.txt',
      { additionalProtocols: ['data'] },
    )).toThrow(UnsafeUrlProtocolError);
    const anchor = anchorHarness();
    expect(() => BrowserUtilities.download('data:text/plain,hello', 'hello.txt', { allowDataUrl: true })).not.toThrow();
    expect(anchor.download).toBe('hello.txt');
    expect(() => BrowserUtilities.download(' https://example.com')).toThrow(ValidationError);
  });

  it('honors a File filename override and always revokes its object URL', () => {
    const anchor = anchorHarness();
    const createObjectURL = vi.fn(() => 'blob:https://localhost/id');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    BrowserUtilities.download(new File(['x'], 'original.txt'), 'override.txt');
    expect(anchor.download).toBe('override.txt');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:https://localhost/id');
  });

  it('propagates blob click failures while revoking and cleaning up', () => {
    const anchor = anchorHarness();
    const failure = new Error('click failed');
    vi.mocked(anchor.click).mockImplementation(() => { throw failure; });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:https://localhost/blob'),
      revokeObjectURL,
    });

    expect(() => BrowserUtilities.downloadBlob(new Blob(['x']), 'x.txt')).toThrow(failure);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(anchor.isConnected).toBe(false);
  });
});

describe('BrowserUtilities.detectIncognito bounded settlement', () => {
  it('resolves a safe best-effort result when a browser heuristic never calls back', async () => {
    vi.useFakeTimers();
    stubUserAgent('Mozilla/5.0 Chrome/120.0');
    Object.defineProperty(navigator, 'vendor', { configurable: true, value: 'Google Inc.' });
    Object.defineProperty(navigator, 'webkitTemporaryStorage', {
      configurable: true,
      value: { queryUsageAndQuota: vi.fn() },
    });

    const result = BrowserUtilities.detectIncognito({ timeoutMs: 25 });
    await vi.advanceTimersByTimeAsync(25);
    await expect(result).resolves.toEqual({ isPrivate: false, browserName: 'Chrome' });
    delete (navigator as any).vendor;
    delete (navigator as any).webkitTemporaryStorage;
    restoreUserAgent();
  });
});
