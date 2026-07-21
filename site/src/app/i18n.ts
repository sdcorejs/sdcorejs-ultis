import { LOCALES, type Locale } from '../content/types';

export { LOCALES };
export type { Locale };

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'sdcorejs-utils.locale';

export interface LocaleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LanguageTarget {
  lang: string;
}

export interface LocaleControllerOptions {
  readonly storage?: LocaleStorage | null;
  readonly storageKey?: string;
  readonly languageTarget?: LanguageTarget | null;
  readonly announce?: (locale: Locale) => void;
}

export interface LocaleController {
  readonly locale: Locale;
  readonly setLocale: (candidate: unknown) => Locale;
}

export function isLocale(candidate: unknown): candidate is Locale {
  return typeof candidate === 'string' && (LOCALES as readonly string[]).includes(candidate);
}

export function readStoredLocale(
  storage?: LocaleStorage | null,
  storageKey = LOCALE_STORAGE_KEY,
): Locale {
  if (!storage) return DEFAULT_LOCALE;

  try {
    const candidate = storage.getItem(storageKey);
    return isLocale(candidate) ? candidate : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(
  storage: LocaleStorage | null | undefined,
  locale: Locale,
  storageKey = LOCALE_STORAGE_KEY,
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(storageKey, locale);
    return true;
  } catch {
    return false;
  }
}

export function applyDocumentLanguage(target: LanguageTarget | null | undefined, locale: Locale): void {
  if (target) target.lang = locale;
}

export function createLocaleController(options: LocaleControllerOptions = {}): LocaleController {
  const storageKey = options.storageKey ?? LOCALE_STORAGE_KEY;
  let activeLocale = readStoredLocale(options.storage, storageKey);
  applyDocumentLanguage(options.languageTarget, activeLocale);

  return {
    get locale(): Locale {
      return activeLocale;
    },
    setLocale(candidate: unknown): Locale {
      if (!isLocale(candidate) || candidate === activeLocale) return activeLocale;

      activeLocale = candidate;
      persistLocale(options.storage, activeLocale, storageKey);
      applyDocumentLanguage(options.languageTarget, activeLocale);
      options.announce?.(activeLocale);
      return activeLocale;
    },
  };
}
