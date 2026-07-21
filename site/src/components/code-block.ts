import type { Locale } from '../content/types';

export interface CodeBlockOptions {
  readonly filename?: string;
  readonly language?: string;
  readonly locale?: Locale;
}

const COPY_LABEL = {
  en: { copy: 'Copy code', copied: 'Copied', failed: 'Copy failed' },
  vi: { copy: 'Sao chép mã', copied: 'Đã sao chép', failed: 'Không thể sao chép' },
} as const;

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  return Promise.reject(new Error('Clipboard API is unavailable.'));
}

export function renderCodeBlock(code: string, options: CodeBlockOptions = {}): HTMLElement {
  const locale = options.locale ?? 'en';
  const labels = COPY_LABEL[locale];
  const frame = document.createElement('figure');
  frame.className = 'code-frame';

  const toolbar = document.createElement('figcaption');
  toolbar.className = 'code-toolbar';
  const identity = document.createElement('span');
  identity.className = 'code-identity';
  identity.textContent = options.filename ?? options.language ?? 'TypeScript';
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'code-copy';
  copy.textContent = labels.copy;
  copy.addEventListener('click', () => {
    void copyText(code).then(() => {
      copy.textContent = labels.copied;
      status.textContent = labels.copied;
      window.setTimeout(() => { copy.textContent = labels.copy; }, 1_800);
    }).catch(() => {
      copy.textContent = labels.failed;
      status.textContent = labels.failed;
      window.setTimeout(() => { copy.textContent = labels.copy; }, 1_800);
    });
  });
  toolbar.append(identity, copy, status);

  const pre = document.createElement('pre');
  pre.className = 'code-block';
  pre.tabIndex = 0;
  const codeElement = document.createElement('code');
  codeElement.textContent = code;
  pre.append(codeElement);
  frame.append(toolbar, pre);
  return frame;
}
