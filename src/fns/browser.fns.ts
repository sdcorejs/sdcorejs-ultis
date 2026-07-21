import { SD_LANGUAGE_STORAGE_KEY } from '../constants/common.constants';
import { FilePickerCancelledError, UnsafeUrlProtocolError, ValidationError } from '../errors';
import { detectIncognito } from './detect-incognito.fns';

const UPLOAD_MESSAGES = {
  vi: {
    'invalid-format': '[{name}] File tải lên không đúng định dạng. Vui lòng chọn lại',
    'invalid-size': '[{name}] Kích thước file không hợp lệ. Vui lòng chọn một file khác',
  },
  en: {
    'invalid-format': '[{name}] Invalid file format. Please select again',
    'invalid-size': '[{name}] Invalid file size. Please choose a different file',
  },
  ja: {
    'invalid-format': '[{name}] ファイル形式が正しくありません。もう一度選択してください',
    'invalid-size': '[{name}] ファイルサイズが正しくありません。別のファイルを選択してください',
  },
  ko: {
    'invalid-format': '[{name}] 파일 형식이 올바르지 않습니다. 다시 선택해 주세요',
    'invalid-size': '[{name}] 파일 크기가 올바르지 않습니다. 다른 파일을 선택해 주세요',
  },
  zh: {
    'invalid-format': '[{name}] 文件格式不正确，请重新选择',
    'invalid-size': '[{name}] 文件大小不符合要求，请选择其他文件',
  },
} as const;

type UploadMsgKey = keyof typeof UPLOAD_MESSAGES.vi;
type UploadLang = keyof typeof UPLOAD_MESSAGES;

/** Options for a single isolated native file-picker invocation. */
export interface UploadOptions {
  /** Allowed file extensions without a leading dot. */
  extensions?: string[];
  /** Native file-picker accept expression. Derived from `extensions` when omitted. */
  accept?: string;
  /** Maximum size of each file in MiB. Must be a positive finite number when provided. */
  maxSizeInMb?: number;
  /** Legacy filename validator. A non-empty return value rejects the file. */
  validator?: (fileName: string) => string | undefined | void;
  /** Full-file validator. A non-empty return value rejects the file. */
  fileValidator?: (file: File) => string | undefined | void;
  /** Maximum time to wait for selection/cancellation. Defaults to five minutes. */
  timeoutMs?: number;
  /** Allows selecting multiple files and changes the resolved value to `File[]`. */
  multiple?: boolean;
}

/** Protocol policy for browser download links. */
export interface DownloadOptions {
  /** Allows a `data:` URL. Disabled by default because it may carry active content. */
  allowDataUrl?: boolean;
  /**
   * Additional explicitly trusted protocols. Defaults to none. This option cannot
   * enable `data:`, `javascript:`, or `vbscript:`; use `allowDataUrl` for `data:`.
   */
  additionalProtocols?: readonly string[];
}

const getUploadLang = (): UploadLang => {
  try {
    const stored = localStorage.getItem(SD_LANGUAGE_STORAGE_KEY);
    if (stored && stored in UPLOAD_MESSAGES) return stored as UploadLang;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return 'vi';
};

let pickerSequence = 0;

function upload(option: UploadOptions & { multiple: true }): Promise<File[]>;
function upload(option?: UploadOptions & { multiple?: false | undefined }): Promise<File>;
function upload(option?: UploadOptions): Promise<File | File[]>;
function upload(option: UploadOptions = {}): Promise<File | File[]> {
  return new Promise((resolve, reject) => {
    const requestedMaxSize = option.maxSizeInMb;
    const maxSizeInBytes = requestedMaxSize === undefined
      ? undefined
      : requestedMaxSize * 1024 * 1024;
    if (
      requestedMaxSize !== undefined
      && (!Number.isFinite(requestedMaxSize) || requestedMaxSize <= 0 || !Number.isFinite(maxSizeInBytes))
    ) {
      reject(new ValidationError('maxSizeInMb must be a positive finite number'));
      return;
    }
    const requestedTimeout = option.timeoutMs ?? 300_000;
    if (!Number.isFinite(requestedTimeout) || requestedTimeout <= 0) {
      reject(new ValidationError('timeoutMs must be a positive finite number'));
      return;
    }
    if (typeof document === 'undefined' || !document.body) {
      reject(new ValidationError('The file picker requires document.body'));
      return;
    }

    const input = document.createElement('input');
    input.id = `sdcore-file-picker-${Date.now().toString(36)}-${++pickerSequence}`;
    input.type = 'file';
    input.multiple = option.multiple === true;
    input.style.display = 'none';
    const accept = option.accept ?? option.extensions?.map(extension => `.${extension.replace(/^\./, '')}`).join(',');
    if (accept) input.accept = accept;

    let settled = false;
    const timeout = setTimeout(() => fail(new FilePickerCancelledError()), requestedTimeout);

    const cleanup = (): void => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      clearTimeout(timeout);
      input.remove();
    };
    const succeed = (value: File | File[]): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const uploadError = (key: UploadMsgKey, name: string): ValidationError => {
      const lang = getUploadLang();
      return new ValidationError(UPLOAD_MESSAGES[lang][key].replace('{name}', name));
    };
    const validate = (file: File): void => {
      // Size is deliberately checked before format and custom validators.
      if (maxSizeInBytes !== undefined && file.size > maxSizeInBytes) {
        throw uploadError('invalid-size', file.name);
      }
      if (option.extensions?.length) {
        const dot = file.name.lastIndexOf('.');
        const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
        if (!extension || !option.extensions.some(item => item.replace(/^\./, '').toLowerCase() === extension)) {
          throw uploadError('invalid-format', file.name);
        }
      }
      const filenameMessage = option.validator?.(file.name);
      if (filenameMessage) throw new ValidationError(filenameMessage);
      const fileMessage = option.fileValidator?.(file);
      if (fileMessage) throw new ValidationError(fileMessage);
    };
    const selectedFiles = (): File[] => Array.from(input.files ?? []);
    function onChange(): void {
      try {
        const files = selectedFiles();
        if (files.length === 0) {
          fail(new FilePickerCancelledError());
          return;
        }
        files.forEach(validate);
        succeed(option.multiple ? files : files[0]);
      } catch (error) {
        fail(error);
      }
    }
    function onCancel(): void {
      fail(new FilePickerCancelledError());
    }
    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    document.body.appendChild(input);
    try {
      input.click();
    } catch (error) {
      fail(error);
    }
  });
}

const generateFileName = (fileName?: string | null): string => {
  if (fileName) return fileName;
  const id = `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  return `file_${id}`;
};

const clickDownloadLink = (href: string, fileName?: string, openInNewTab = false): void => {
  const link = document.createElement('a');
  try {
    link.href = href;
    link.style.visibility = 'hidden';
    if (openInNewTab) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.download = generateFileName(fileName);
    }
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
  }
};

const ACTIVE_DOWNLOAD_PROTOCOLS = new Set(['javascript:', 'vbscript:']);

const normalizeAdditionalProtocol = (value: unknown): string => {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new ValidationError('additionalProtocols must contain valid protocol names');
  }
  const protocol = (value.endsWith(':') ? value : `${value}:`).toLowerCase();
  if (!/^[a-z][a-z\d+.-]*:$/u.test(protocol)) {
    throw new ValidationError('additionalProtocols must contain valid protocol names');
  }
  return protocol;
};

const parseDownloadUrl = (value: string, options: DownloadOptions): { href: string; openInNewTab: boolean } => {
  if (!value || value !== value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new ValidationError('Malformed download URL');
  }
  let url: URL;
  try {
    url = new URL(value, window.location.href);
  } catch (cause) {
    throw new ValidationError('Malformed download URL', { cause });
  }
  const protocol = url.protocol.toLowerCase();
  const additionalProtocols = (options.additionalProtocols ?? []).map(normalizeAdditionalProtocol);
  if (ACTIVE_DOWNLOAD_PROTOCOLS.has(protocol)) throw new UnsafeUrlProtocolError(protocol);
  const allowed = protocol === 'http:' || protocol === 'https:' || protocol === 'blob:' ||
    (protocol === 'data:' && options.allowDataUrl === true) ||
    (protocol !== 'data:' && additionalProtocols.includes(protocol));
  if (!allowed) throw new UnsafeUrlProtocolError(protocol);

  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/iu.test(value);
  if (!hasExplicitScheme && url.origin !== window.location.origin) {
    throw new UnsafeUrlProtocolError(protocol);
  }
  return {
    href: url.href,
    openInNewTab: hasExplicitScheme && (protocol === 'http:' || protocol === 'https:'),
  };
};

const download = (
  fileOrPath: File | string | undefined | null,
  fileName?: string | null,
  options: DownloadOptions = {}
): void => {
  if (!fileOrPath) return;
  if (typeof File !== 'undefined' && fileOrPath instanceof File) {
    const url = URL.createObjectURL(fileOrPath);
    try {
      clickDownloadLink(url, fileName ?? fileOrPath.name);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  const parsed = parseDownloadUrl(fileOrPath as string, options);
  clickDownloadLink(parsed.href, fileName ?? undefined, parsed.openInNewTab);
};

const downloadBlob = (blob: Blob, fileName?: string): void => {
  const url = URL.createObjectURL(blob);
  try {
    clickDownloadLink(url, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

const isMobile = (): boolean => /Mobi|Android/i.test(navigator.userAgent);

export const BrowserUtilities = {
  /** Opens an isolated file picker, validates each selected file once, and always settles. */
  upload,
  /** Downloads a File, safe relative URL, or explicitly allowed absolute URL. */
  download,
  /** Downloads Blob bytes and revokes the temporary object URL after the click. */
  downloadBlob,
  /** Writes text to the Clipboard API and exposes permission failures through its Promise. */
  copyToClipboard,
  /** Returns whether the current user-agent string resembles a mobile browser. */
  isMobile,
  /**
   * Retains the bounded v1.x best-effort result for compatibility.
   * @deprecated Private-mode detection is unreliable and has no security-capable
   * replacement. Remove decision logic that depends on it; analytics uses must
   * tolerate browser-dependent false results.
   */
  detectIncognito,
};
