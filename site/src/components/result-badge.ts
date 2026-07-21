import type { Locale } from '../content/types';

export function renderResultBadge(
  valid: boolean,
  label?: string,
  locale: Locale = 'en',
): HTMLElement {
  const span = document.createElement('span');
  span.className = valid ? 'badge-valid' : 'badge-invalid';
  const fallback = valid
    ? (locale === 'en' ? 'Valid' : 'Hợp lệ')
    : (locale === 'en' ? 'Invalid' : 'Không hợp lệ');
  span.textContent = `${valid ? '✓' : '×'} ${label ?? fallback}`;
  return span;
}
