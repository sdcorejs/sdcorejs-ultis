import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LOCALE,
  applyDocumentLanguage,
  createLocaleController,
  readStoredLocale,
  type LocaleStorage,
} from './i18n';

function storageWith(value: string | null): LocaleStorage {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  };
}

describe('locale persistence', () => {
  it('defaults a first visit to English', () => {
    expect(readStoredLocale(storageWith(null))).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('restores either supported locale', () => {
    expect(readStoredLocale(storageWith('vi'))).toBe('vi');
    expect(readStoredLocale(storageWith('en'))).toBe('en');
  });

  it('falls back to English for unsupported, corrupt, or inaccessible storage', () => {
    const inaccessible: LocaleStorage = {
      getItem: () => {
        throw new Error('storage unavailable');
      },
      setItem: vi.fn(),
    };

    expect(readStoredLocale(storageWith('fr'))).toBe('en');
    expect(readStoredLocale(storageWith('{broken'))).toBe('en');
    expect(readStoredLocale(inaccessible)).toBe('en');
  });
});

describe('locale controller', () => {
  it('applies html lang through an explicit adapter and persists a valid choice', () => {
    const storage = storageWith(null);
    const languageTarget = { lang: '' };
    const announce = vi.fn();
    const controller = createLocaleController({
      storage,
      languageTarget,
      announce,
    });

    expect(controller.locale).toBe('en');
    expect(languageTarget.lang).toBe('en');

    expect(controller.setLocale('vi')).toBe('vi');
    expect(controller.locale).toBe('vi');
    expect(storage.setItem).toHaveBeenCalledWith('sdcorejs-utils.locale', 'vi');
    expect(languageTarget.lang).toBe('vi');
    expect(announce).toHaveBeenCalledWith('vi');
  });

  it('rejects unsupported choices without changing the active locale', () => {
    const controller = createLocaleController({ storage: storageWith('vi') });

    expect(controller.setLocale('de')).toBe('vi');
    expect(controller.locale).toBe('vi');
  });

  it('updates document language without depending on Document at module load', () => {
    const target = { lang: 'en' };

    applyDocumentLanguage(target, 'vi');

    expect(target.lang).toBe('vi');
  });
});
