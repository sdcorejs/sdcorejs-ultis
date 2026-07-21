import { afterEach, describe, expect, it } from 'vitest';
import { createFilterPlayground, createValidationPlayground } from './playground';

afterEach(() => document.body.replaceChildren());

describe('interactive documentation playgrounds', () => {
  it('validates input, exposes a live result, and resets in Vietnamese', async () => {
    const playground = createValidationPlayground('vi');
    document.body.append(playground);
    const input = playground.querySelector('input[type="text"]') as HTMLInputElement;
    const pattern = playground.querySelector('select') as HTMLSelectElement;
    const form = playground.querySelector('form') as HTMLFormElement;

    pattern.value = 'EMAIL';
    input.value = 'developer@example.com';
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    const result = playground.querySelector('.playground-result') as HTMLElement;
    const announcement = playground.querySelector('.playground-announcement[role="status"]') as HTMLElement;
    expect(result.textContent).toContain('Hợp lệ');
    expect(result.textContent).toContain('ValidationUtilities.validate');
    expect(announcement.textContent).toBe('Hợp lệ');
    expect(announcement.querySelector('code, button')).toBeNull();
    expect(result.hasAttribute('aria-live')).toBe(false);

    form.reset();
    await Promise.resolve();
    expect(result.textContent).toContain('Nhập giá trị cần kiểm tra');
    expect(announcement.textContent).toBe('Nhập giá trị cần kiểm tra.');
  });

  it('evaluates and resets the filter builder with an accessible live outcome', async () => {
    const playground = createFilterPlayground('en');
    document.body.append(playground);
    const result = playground.querySelector('.playground-result') as HTMLElement;
    const announcement = playground.querySelector('.playground-announcement[role="status"]') as HTMLElement;

    expect(result.textContent).toContain('Match');
    expect(result.textContent).toContain('FilterUtilities.match');
    expect(announcement.textContent).toBe('Match');
    expect(announcement.querySelector('code, button')).toBeNull();

    const hintCheckbox = playground.querySelector('#filter-field-hint-enabled') as HTMLInputElement;
    const hintSelect = playground.querySelector('#filter-field-hint') as HTMLSelectElement;
    expect(hintCheckbox.name).toBe('fieldHintEnabled');
    expect(hintSelect.name).toBe('fieldHint');
    expect(hintSelect.disabled).toBe(true);
    expect(hintSelect.closest('label')?.textContent).toContain('Field type hint');
    hintCheckbox.checked = true;
    hintCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    expect(hintSelect.disabled).toBe(false);

    const form = playground.querySelector('form') as HTMLFormElement;
    form.reset();
    await Promise.resolve();
    expect(result.textContent).toContain('Match');
    expect(hintSelect.disabled).toBe(true);
    expect(playground.querySelectorAll('button[type="reset"]')).toHaveLength(1);
  });
});
