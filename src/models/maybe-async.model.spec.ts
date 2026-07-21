import { describe, expect, it, vi } from 'vitest';
import { EmptySubscribableError } from '../errors';
import {
  normalizeAsync,
  normalizeSubscribable,
  ObserverLike,
  resolveMaybeAsync,
  SubscribableLike,
} from './maybe-async.model';

describe('resolveMaybeAsync', () => {
  it('supports plain values and custom PromiseLike values', async () => {
    const thenable = {
      then: ((resolve: (value: number) => unknown) => Promise.resolve(resolve(42))) as PromiseLike<number>['then'],
    };
    await expect(resolveMaybeAsync(1)).resolves.toBe(1);
    await expect(resolveMaybeAsync(thenable)).resolves.toBe(42);
  });

  it('always returns a promise when async-shape detection getters throw', async () => {
    const thenFailure = new Error('then getter failed');
    const subscribeFailure = new Error('subscribe getter failed');
    const throwingThen = Object.defineProperty({}, 'then', {
      get: () => { throw thenFailure; },
    });
    const throwingSubscribe = Object.defineProperty({}, 'subscribe', {
      get: () => { throw subscribeFailure; },
    });

    let thenResult!: Promise<unknown>;
    let subscribeResult!: Promise<unknown>;
    expect(() => { thenResult = resolveMaybeAsync(throwingThen as never); }).not.toThrow();
    expect(() => { subscribeResult = resolveMaybeAsync(throwingSubscribe as never); }).not.toThrow();
    await expect(thenResult).rejects.toBe(thenFailure);
    await expect(subscribeResult).rejects.toBe(subscribeFailure);
  });

  it('resolves the first structural emission and cleans up synchronous subscriptions', async () => {
    const unsubscribe = vi.fn();
    const source = {
      subscribe(observer: { next(value: number): void }) {
        observer.next(7);
        observer.next(8);
        return { unsubscribe };
      },
    } as unknown as SubscribableLike<number>;
    await expect(resolveMaybeAsync(source)).resolves.toBe(7);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('rejects when cleanup fails after a synchronous first emission', async () => {
    const cleanupFailure = new Error('cleanup failed');
    const source: SubscribableLike<number> = {
      subscribe(observerOrNext) {
        if (typeof observerOrNext !== 'function') observerOrNext?.next?.(7);
        return () => { throw cleanupFailure; };
      },
    };

    await expect(resolveMaybeAsync(source)).rejects.toBe(cleanupFailure);
  });

  it('turns asynchronous cleanup failures into deterministic rejections', async () => {
    const cleanupFailure = new Error('async cleanup failed');
    let emit!: (value: number) => void;
    const source: SubscribableLike<number> = {
      subscribe(observerOrNext) {
        emit = value => {
          if (typeof observerOrNext === 'function') observerOrNext(value);
          else observerOrNext?.next?.(value);
        };
        return { unsubscribe: () => { throw cleanupFailure; } };
      },
    };
    const result = resolveMaybeAsync(source);

    expect(() => emit(9)).not.toThrow();
    await expect(result).rejects.toBe(cleanupFailure);
  });

  it('propagates source errors and rejects empty completion', async () => {
    const errorSource = {
      subscribe(observer: { error(error: unknown): void }) {
        observer.error(new Error('source failed'));
      },
    } as unknown as SubscribableLike<number>;
    const emptySource = {
      subscribe(observer: { complete(): void }) {
        observer.complete();
      },
    } as unknown as SubscribableLike<number>;
    await expect(resolveMaybeAsync(errorSource)).rejects.toThrow('source failed');
    await expect(resolveMaybeAsync(emptySource)).rejects.toBeInstanceOf(EmptySubscribableError);
  });
});

describe('normalizeSubscribable', () => {
  it('emits plain values and supports the callback subscribe form', () => {
    const next = vi.fn();
    const complete = vi.fn();
    normalizeSubscribable(5).subscribe(next, undefined, complete);
    expect(next).toHaveBeenCalledWith(5);
    expect(complete).toHaveBeenCalledOnce();
  });

  it('assimilates custom thenables and allows unsubscription', async () => {
    let resolve!: (value: number) => void;
    const thenable = new Promise<number>(done => { resolve = done; });
    const next = vi.fn();
    const subscription = normalizeAsync(thenable).subscribe(next);
    if (subscription && typeof subscription !== 'function') subscription.unsubscribe();
    resolve(9);
    await Promise.resolve();
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
  });

  it('supports subscribe() without callbacks for plain and promised values', async () => {
    const plainSubscription = normalizeSubscribable(5).subscribe();
    const promisedSubscription = normalizeSubscribable(Promise.resolve(6)).subscribe();

    expect(plainSubscription && typeof plainSubscription !== 'function' && plainSubscription.closed).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(promisedSubscription && typeof promisedSubscription !== 'function' && promisedSubscription.closed).toBe(true);
  });

  it('host-reports promise-backed observer failures without unhandled rejections', async () => {
    const callbackFailure = new Error('observer callback failed');
    const unhandled: unknown[] = [];
    const reported = vi.fn();
    vi.stubGlobal('reportError', reported);
    const onUnhandled = (reason: unknown): void => { unhandled.push(reason); };
    process.on('unhandledRejection', onUnhandled);

    try {
      normalizeSubscribable(Promise.resolve(1)).subscribe(() => { throw callbackFailure; });
      normalizeSubscribable(Promise.resolve(2)).subscribe({
        complete: () => { throw callbackFailure; },
      });
      normalizeSubscribable(Promise.reject(new Error('source failed'))).subscribe({
        error: () => { throw callbackFailure; },
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(unhandled).toEqual([]);
      expect(reported).toHaveBeenCalledTimes(3);
    } finally {
      process.off('unhandledRejection', onUnhandled);
      vi.unstubAllGlobals();
    }
  });

  it('accepts a single structural subscribe signature for both callback forms', async () => {
    const source: SubscribableLike<number> = {
      subscribe(
        observerOrNext?: Partial<ObserverLike<number>> | ((value: number) => void),
        _error?: (error: unknown) => void,
        complete?: () => void,
      ) {
        if (typeof observerOrNext === 'function') observerOrNext(11);
        else observerOrNext?.next?.(11);
        complete?.();
      },
    };
    const callback = vi.fn();
    const observer = { next: vi.fn() };

    source.subscribe(callback);
    source.subscribe(observer);
    source.subscribe();
    expect(callback).toHaveBeenCalledWith(11);
    expect(observer.next).toHaveBeenCalledWith(11);
    await expect(resolveMaybeAsync(source)).resolves.toBe(11);
  });

  it('returns an existing structural subscribable unchanged', () => {
    const source = { subscribe: vi.fn() } as unknown as SubscribableLike<number>;
    expect(normalizeSubscribable(source)).toBe(source);
  });

  it('preserves the concrete type of an existing subscribable', () => {
    const source = {
      subscribe: vi.fn(),
      pipe: (label: string) => `piped:${label}`,
    } as SubscribableLike<number> & { pipe(label: string): string };

    const normalized = normalizeAsync(source);

    expect(normalized).toBe(source);
    expect(normalized.pipe('value')).toBe('piped:value');
  });

  it('preserves a hybrid subscribable/thenable according to the concrete overload', () => {
    const promise = Promise.resolve(42);
    const source: SubscribableLike<number> & PromiseLike<number> & { pipe(label: string): string } = {
      subscribe: vi.fn(),
      then: promise.then.bind(promise),
      pipe: (label: string) => `piped:${label}`,
    };

    const normalized = normalizeAsync(source);

    expect(normalized).toBe(source);
    expect(normalized.pipe('hybrid')).toBe('piped:hybrid');
  });
});
