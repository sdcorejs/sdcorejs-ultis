import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PagingLimitError,
  PagingResponseError,
  SecureRandomUnavailableError,
  ValidationError,
} from '../errors';
import { Utilities } from './utility.fns';
import type { FetchAllByPagingOptions } from './utility.fns';

describe('fetchAllByPaging bounded behavior', () => {
  it('always requests consecutive zero-based pages and ignores legacy runtime page-base hints', async () => {
    const pages: number[] = [];
    await Utilities.fetchAllByPaging(async (_size, page) => {
      pages.push(page);
      return { items: [page], total: 2 };
    }, 1, {
      // @ts-expect-error `pageBase` is not part of the strict zero-based contract.
      pageBase: 1,
    });
    expect(pages).toEqual([0, 1]);

    const legacyInitialPage: FetchAllByPagingOptions = {
      // @ts-expect-error `initialPage` is not part of the strict zero-based contract.
      initialPage: 2,
    };
    expect(legacyInitialPage).toEqual({ initialPage: 2 });
  });

  it('throws typed errors for malformed first and later pages without returning an empty array', async () => {
    await expect(Utilities.fetchAllByPaging(async () => ({ items: null as never, total: 1 })))
      .rejects.toBeInstanceOf(PagingResponseError);
    let call = 0;
    await expect(Utilities.fetchAllByPaging(async () => {
      call++;
      return call === 1 ? { items: [1], total: 2 } : { items: null as never, total: 2 };
    }, 1)).rejects.toBeInstanceOf(PagingResponseError);
  });

  it('detects empty-page no progress, changed totals, and maxPages', async () => {
    await expect(Utilities.fetchAllByPaging(async () => ({ items: [], total: 1 }), 1))
      .rejects.toThrow(/no progress/i);
    let totalCall = 0;
    await expect(Utilities.fetchAllByPaging(async () => ({ items: [++totalCall], total: totalCall === 1 ? 3 : 4 }), 1))
      .rejects.toThrow(/changed total/i);
    await expect(Utilities.fetchAllByPaging(async (_size, page) => ({ items: [page], total: 100 }), 1, { maxPages: 2 }))
      .rejects.toBeInstanceOf(PagingLimitError);
  });

  it('preserves duplicate values across pages and relies on total/maxPages for termination', async () => {
    await expect(Utilities.fetchAllByPaging(
      async () => ({ items: ['same'], total: 3 }),
      1,
    )).resolves.toEqual(['same', 'same', 'same']);

    await expect(Utilities.fetchAllByPaging(
      async () => ({ items: ['same'], total: 10 }),
      1,
      { maxPages: 2 },
    )).rejects.toBeInstanceOf(PagingLimitError);
  });

  it('rejects over-total pages', async () => {
    await expect(Utilities.fetchAllByPaging(async () => ({ items: [1, 2], total: 1 }), 2))
      .rejects.toThrow(/more items/i);
    await expect(Utilities.fetchAllByPaging(async () => ({ items: [1, 2], total: 10 }), 1))
      .rejects.toThrow(/pageSize/i);
  });

  it('supports latest-total policy and AbortSignal', async () => {
    let call = 0;
    await expect(Utilities.fetchAllByPaging(async () => {
      call++;
      return { items: [call], total: call === 1 ? 3 : 2 };
    }, 1, { totalChangePolicy: 'latest' })).resolves.toEqual([1, 2]);

    const controller = new AbortController();
    controller.abort(new Error('stop'));
    await expect(Utilities.fetchAllByPaging(async () => ({ items: [], total: 0 }), 1, { signal: controller.signal }))
      .rejects.toThrow('stop');
  });

  it('forwards AbortSignal and rejects while a page request is still pending', async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const result = Utilities.fetchAllByPaging(
      async (_size, _page, signal) => {
        receivedSignal = signal;
        return await new Promise<never>(() => undefined);
      },
      1,
      { signal: controller.signal },
    );
    expect(receivedSignal).toBe(controller.signal);
    controller.abort(new Error('in-flight stop'));
    await expect(result).rejects.toThrow('in-flight stop');
  });

  it('accumulates many pages in order without a timing threshold', async () => {
    const pageCount = 500;
    const result = await Utilities.fetchAllByPaging(
      async (_size, page) => ({ items: [page], total: pageCount }),
      1,
      { maxPages: pageCount },
    );
    expect(result).toHaveLength(pageCount);
    expect(result[0]).toBe(0);
    expect(result.at(-1)).toBe(pageCount - 1);
  });

  it('accumulates a large page without relying on spread argument limits', async () => {
    const items = Array.from({ length: 100_000 }, (_, index) => index);
    const result = await Utilities.fetchAllByPaging(async () => ({ items, total: items.length }), items.length);
    expect(result).toHaveLength(items.length);
    expect(result[0]).toBe(0);
    expect(result.at(-1)).toBe(items.length - 1);
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY])('rejects invalid page size %s', size => {
    expect(Utilities.fetchAllByPaging(async () => ({ items: [], total: 0 }), size))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an unknown total-change policy at runtime', async () => {
    const options = { totalChangePolicy: 'accept-anything' } as unknown as FetchAllByPagingOptions;
    await expect(Utilities.fetchAllByPaging(
      async (_size, page) => ({ items: [page], total: page === 0 ? 2 : 3 }),
      1,
      options,
    )).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('generateUuid secure fallbacks', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sets RFC v4 version and variant bits when only getRandomValues exists', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xaa);
        return bytes;
      },
    });
    expect(Utilities.generateUuid()).toBe('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');
  });

  it('throws instead of using Date.now or Math.random when secure randomness is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => Utilities.generateUuid()).toThrow(SecureRandomUnavailableError);
  });

  it('falls back when randomUUID throws and wraps getRandomValues failure', () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => { throw new Error('randomUUID unavailable'); },
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0);
        return bytes;
      },
    });
    expect(Utilities.generateUuid()).toBe('00000000-0000-4000-8000-000000000000');

    vi.stubGlobal('crypto', {
      randomUUID: () => { throw new Error('no'); },
      getRandomValues: () => { throw new Error('no'); },
    });
    expect(() => Utilities.generateUuid()).toThrow(SecureRandomUnavailableError);
  });

  it('produces unique standard UUIDs over a reasonable sample', () => {
    const values = new Set(Array.from({ length: 256 }, () => Utilities.generateUuid()));
    expect(values.size).toBe(256);
    for (const value of values) {
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });
});
