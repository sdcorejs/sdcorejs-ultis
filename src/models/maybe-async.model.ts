import { EmptySubscribableError, ValidationError } from '../errors';

/** Minimal subscription cleanup contract compatible with common observable libraries. */
export interface SubscriptionLike {
  /** Whether the subscription has been closed, when exposed by the implementation. */
  readonly closed?: boolean;
  /** Stops future emissions and releases subscription resources. */
  unsubscribe(): void;
}

/** Observer callbacks accepted by structural subscribables. */
export interface ObserverLike<T> {
  /** Receives a value. */
  next?(value: T): void;
  /** Receives a terminal source error. */
  error?(error: unknown): void;
  /** Receives successful completion. */
  complete?(): void;
}

/** Cleanup values accepted from structural `subscribe` implementations. */
export type SubscriptionTeardownLike = SubscriptionLike | (() => void) | void;

/**
 * Dependency-free structural observable contract. RxJS Observables and other
 * libraries with compatible `subscribe` overloads can be supplied without adding
 * RxJS to this package's runtime or declarations.
 */
export interface SubscribableLike<T> {
  subscribe(
    observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void) | null,
    error?: (error: unknown) => void,
    complete?: () => void,
  ): SubscriptionTeardownLike;
}

/** A plain value, any `PromiseLike`, or a structurally compatible subscribable. */
export type MaybeAsync<T> = T | PromiseLike<T> | SubscribableLike<T>;

/** Returns whether a value exposes a callable Promise/A+ `then` method. */
export const isPromiseLike = <T = unknown>(value: unknown): value is PromiseLike<T> =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/** Returns whether a value exposes a callable structural `subscribe` method. */
export const isSubscribableLike = <T = unknown>(value: unknown): value is SubscribableLike<T> =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  typeof (value as { subscribe?: unknown }).subscribe === 'function';

const normalizeTeardown = (teardown: SubscriptionTeardownLike): (() => void) | undefined => {
  if (teardown === undefined) return undefined;
  if (typeof teardown === 'function') return teardown;
  if (typeof teardown !== 'object' || teardown === null) {
    throw new ValidationError('subscribe() returned an invalid cleanup value');
  }
  const unsubscribe = (teardown as { unsubscribe?: unknown }).unsubscribe;
  if (typeof unsubscribe !== 'function') {
    throw new ValidationError('subscribe() returned an invalid cleanup value');
  }
  return () => { unsubscribe.call(teardown); };
};

type SubscribableNotification<T> =
  | { type: 'next'; value: T }
  | { type: 'error'; error: unknown }
  | { type: 'complete' };

const resolveSubscribable = <T>(source: SubscribableLike<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let state: 'subscribing' | 'active' | 'settled' = 'subscribing';
    let pendingNotification: SubscribableNotification<T> | undefined;
    let cleanupCallback: (() => void) | undefined;
    let cleanupRun = false;

    const cleanup = (): void => {
      if (cleanupRun || cleanupCallback === undefined) return;
      cleanupRun = true;
      cleanupCallback();
    };
    const settle = (notification: SubscribableNotification<T>): void => {
      if (state === 'settled') return;
      state = 'settled';
      try {
        cleanup();
      } catch (cleanupError) {
        reject(cleanupError);
        return;
      }
      if (notification.type === 'next') resolve(notification.value);
      else if (notification.type === 'error') reject(notification.error);
      else reject(new EmptySubscribableError());
    };
    const notify = (notification: SubscribableNotification<T>): void => {
      if (state === 'settled' || pendingNotification !== undefined) return;
      if (state === 'subscribing') {
        pendingNotification = notification;
        return;
      }
      settle(notification);
    };

    try {
      const teardown = source.subscribe({
        next: value => notify({ type: 'next', value }),
        error: error => notify({ type: 'error', error }),
        complete: () => notify({ type: 'complete' }),
      });
      cleanupCallback = normalizeTeardown(teardown);
      state = 'active';
      if (pendingNotification !== undefined) settle(pendingNotification);
    } catch (error) {
      state = 'settled';
      pendingNotification = undefined;
      reject(error);
    }
  });

/**
 * Resolves the first value from a plain value, `PromiseLike`, or subscribable.
 * Promise-like detection is realm-independent. Subscribables are unsubscribed after
 * their first value, errors reject, and empty completion rejects with
 * {@link EmptySubscribableError}.
 */
export const resolveMaybeAsync = <T>(value: MaybeAsync<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (isPromiseLike<T>(value)) {
      void Promise.resolve(value).then(resolve, reject);
      return;
    }
    if (isSubscribableLike<T>(value)) {
      void resolveSubscribable(value).then(resolve, reject);
      return;
    }
    resolve(value as T);
  });

const toObserver = <T>(
  observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void) | null,
  error?: (error: unknown) => void,
  complete?: () => void,
): Partial<ObserverLike<T>> =>
  typeof observerOrNext === 'function'
    ? { next: observerOrNext, error, complete }
    : (observerOrNext ?? {});

const reportObserverError = (error: unknown): void => {
  const reporter = (globalThis as typeof globalThis & { reportError?: (reason: unknown) => void }).reportError;
  if (typeof reporter === 'function') {
    reporter(error);
    return;
  }
  queueMicrotask(() => { throw error; });
};

const invokePromiseObserver = (callback: () => void): void => {
  try {
    callback();
  } catch (error) {
    // Match observable host-reporting semantics without creating a detached,
    // unhandled rejected Promise or silently discarding consumer callback errors.
    reportObserverError(error);
  }
};

const createSubscribable = <T>(value: T | PromiseLike<T>): SubscribableLike<T> => ({
  subscribe(
    observerOrNext?: Partial<ObserverLike<T>> | ((value: T) => void) | null,
    error?: (error: unknown) => void,
    complete?: () => void,
  ): SubscriptionLike {
    const observer = toObserver(observerOrNext, error, complete);
    let closed = false;
    const subscription: SubscriptionLike = {
      get closed() { return closed; },
      unsubscribe: () => { closed = true; },
    };
    const emit = (resolved: T): void => {
      if (closed) return;
      try {
        observer.next?.(resolved);
        if (!closed) observer.complete?.();
      } finally {
        closed = true;
      }
    };
    const fail = (reason: unknown): void => {
      if (closed) return;
      closed = true;
      if (observer.error) observer.error(reason);
      else reportObserverError(reason);
    };

    if (isPromiseLike<T>(value)) {
      void Promise.resolve(value).then(
        resolved => { invokePromiseObserver(() => emit(resolved)); },
        reason => { invokePromiseObserver(() => fail(reason)); },
      );
    }
    else emit(value);
    return subscription;
  },
});

/**
 * Returns an existing subscribable unchanged, preserving its concrete type, or wraps
 * a value/Promise-like in the dependency-free structural subscribable contract.
 */
export function normalizeSubscribable<
  TSource extends { subscribe: (...args: never[]) => unknown },
>(value: TSource): TSource;
export function normalizeSubscribable<T>(value: T | PromiseLike<T>): SubscribableLike<T>;
export function normalizeSubscribable<T>(value: MaybeAsync<T>): SubscribableLike<T>;
export function normalizeSubscribable(value: unknown): unknown {
  if (isSubscribableLike(value)) return value;
  return createSubscribable(value);
}

/**
 * Compatibility alias for {@link normalizeSubscribable}. In v1.2.0 the returned
 * contract is structural rather than an RxJS `Observable`; `.subscribe(...)`
 * remains available. An input RxJS Observable is returned unchanged with its
 * concrete type, so existing Observable-only methods remain typed for that case.
 *
 * @deprecated Prefer {@link normalizeSubscribable} to make the dependency-free
 * return contract explicit. Consumers that call RxJS-only methods such as `.pipe()`
 * must normalize with RxJS in their own application; that migration can change the
 * returned type for plain values and promises.
 */
export const normalizeAsync = normalizeSubscribable;
