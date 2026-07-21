import {
  resolveMaybeAsync,
  type MaybeAsync,
  type SubscribableLike,
} from '@sdcorejs/utils/models';

const source: SubscribableLike<number> = {
  subscribe(observer) {
    if (typeof observer === 'function') observer(42);
    else observer?.next?.(42);
    return { unsubscribe() { /* release source resources */ } };
  },
};

async function firstValue<T>(input: MaybeAsync<T>): Promise<T> {
  return resolveMaybeAsync(input);
}

const fromValue = await firstValue(1);
const fromPromise = await firstValue(Promise.resolve(2));
const fromSubscribable = await firstValue(source);

// RxJS Observable<T> satisfies this structural contract when the app already uses RxJS.
void [fromValue, fromPromise, fromSubscribable];
