import { describe, expect, it, vi } from 'vitest';
import {
  createHashRouter,
  formatHashRoute,
  parseHashRoute,
  resolveHashRoute,
  type HashChangeSource,
} from './router';

class FakeHashChanges implements HashChangeSource {
  private readonly listeners = new Set<() => void>();

  addEventListener(_type: 'hashchange', listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'hashchange', listener: () => void): void {
    this.listeners.delete(listener);
  }

  dispatch(): void {
    for (const listener of this.listeners) listener();
  }
}

describe('hash route parsing and formatting', () => {
  it('uses the configured English route ID for an empty hash', () => {
    expect(parseHashRoute('', 'start/overview')).toEqual({
      routeId: 'start/overview',
      anchor: null,
    });
  });

  it('round-trips stable route IDs and encoded symbol anchors', () => {
    const hash = formatHashRoute({
      routeId: 'api/utility-functions',
      anchor: 'fetch all/by paging',
    });

    expect(hash).toBe('#/api/utility-functions#fetch%20all%2Fby%20paging');
    expect(parseHashRoute(hash, 'start/overview')).toEqual({
      routeId: 'api/utility-functions',
      anchor: 'fetch all/by paging',
    });
  });

  it('signals an unknown route without replacing the requested route or anchor', () => {
    expect(
      resolveHashRoute('#/missing/page#requested-symbol', [
        'start/overview',
        'guides/paging',
      ], 'start/overview'),
    ).toEqual({
      kind: 'not-found',
      routeId: 'missing/page',
      anchor: 'requested-symbol',
    });
  });
});

describe('hash router lifecycle', () => {
  it('synchronizes direct entry and back/forward hash changes and restores focus', () => {
    const location = { hash: '#/guides/paging#zero-based' };
    const changes = new FakeHashChanges();
    const onRouteChange = vi.fn();
    const restoreFocus = vi.fn();
    const router = createHashRouter({
      location,
      changes,
      routeIds: ['start/overview', 'guides/paging'],
      defaultRouteId: 'start/overview',
      onRouteChange,
      restoreFocus,
    });

    const stop = router.start();
    expect(onRouteChange).toHaveBeenLastCalledWith({
      kind: 'page',
      routeId: 'guides/paging',
      anchor: 'zero-based',
    });

    location.hash = '#/start/overview';
    changes.dispatch();

    expect(onRouteChange).toHaveBeenLastCalledWith({
      kind: 'page',
      routeId: 'start/overview',
      anchor: null,
    });
    expect(restoreFocus).toHaveBeenCalledTimes(2);

    stop();
    location.hash = '#/guides/paging';
    changes.dispatch();
    expect(onRouteChange).toHaveBeenCalledTimes(2);
  });

  it('formats navigation without requiring browser globals', () => {
    const location = { hash: '' };
    const router = createHashRouter({
      location,
      changes: new FakeHashChanges(),
      routeIds: ['start/overview', 'api/errors'],
      defaultRouteId: 'start/overview',
      onRouteChange: vi.fn(),
    });

    router.navigate({ routeId: 'api/errors', anchor: 'ValidationError' });

    expect(location.hash).toBe('#/api/errors#ValidationError');
  });
});
