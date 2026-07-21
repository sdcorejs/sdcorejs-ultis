import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderCodeBlock } from './code-block';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
  vi.restoreAllMocks();
});

describe('safe copyable code block', () => {
  it('renders source literally and copies the unchanged value with an announcement', async () => {
    const source = "const template = `<img src=x onerror='bad()'>`;\nconst url = '/a?x=1&y=2';";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const block = renderCodeBlock(source, { filename: 'safe.example.ts', locale: 'en' });
    const button = block.querySelector('button.code-copy') as HTMLButtonElement;

    expect(block.querySelector('code')?.textContent).toBe(source);
    expect(block.querySelector('img')).toBeNull();
    expect(button.type).toBe('button');
    button.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(source));
    expect(block.querySelector('[role="status"]')?.textContent).toBe('Copied');
  });

  it('localizes the keyboard-operable control', () => {
    const block = renderCodeBlock('const page = 0;', { locale: 'vi' });
    const button = block.querySelector('button') as HTMLButtonElement;

    expect(button.textContent).toBe('Sao chép mã');
    expect(button.tabIndex).toBe(0);
  });
});
