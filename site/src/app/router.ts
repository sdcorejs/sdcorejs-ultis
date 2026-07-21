export interface HashRouteLocation {
  readonly routeId: string;
  readonly anchor: string | null;
}

export type ResolvedHashRoute = HashRouteLocation & {
  readonly kind: 'page' | 'not-found';
};

export interface HashLocationAdapter {
  hash: string;
}

export interface HashChangeSource {
  addEventListener(type: 'hashchange', listener: () => void): void;
  removeEventListener(type: 'hashchange', listener: () => void): void;
}

export interface HashRouterOptions {
  readonly location: HashLocationAdapter;
  readonly changes: HashChangeSource;
  readonly routeIds: Iterable<string>;
  readonly defaultRouteId: string;
  readonly onRouteChange: (route: ResolvedHashRoute) => void;
  readonly restoreFocus?: (route: ResolvedHashRoute) => void;
}

export interface HashRouter {
  readonly current: () => ResolvedHashRoute;
  readonly navigate: (target: HashRouteLocation) => void;
  readonly sync: () => ResolvedHashRoute;
  readonly start: () => () => void;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeRouteId(value: string): string {
  return value
    .split('/')
    .filter(Boolean)
    .map(safeDecode)
    .join('/');
}

function encodeRouteId(routeId: string): string {
  return routeId
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function parseHashRoute(hash: string, defaultRouteId: string): HashRouteLocation {
  const withoutMarker = hash.startsWith('#') ? hash.slice(1) : hash;
  const separator = withoutMarker.indexOf('#');
  const rawRoute = separator >= 0 ? withoutMarker.slice(0, separator) : withoutMarker;
  const rawAnchor = separator >= 0 ? withoutMarker.slice(separator + 1) : '';
  const routeId = decodeRouteId(rawRoute.replace(/^\/+|\/+$/g, '')) || defaultRouteId;

  return {
    routeId,
    anchor: rawAnchor ? safeDecode(rawAnchor) : null,
  };
}

export function formatHashRoute(target: HashRouteLocation): string {
  const routeId = encodeRouteId(target.routeId);
  if (!routeId) throw new Error('A hash route requires a non-empty routeId.');

  const anchor = target.anchor ? `#${encodeURIComponent(target.anchor)}` : '';
  return `#/${routeId}${anchor}`;
}

export function resolveHashRoute(
  hash: string,
  routeIds: Iterable<string>,
  defaultRouteId: string,
): ResolvedHashRoute {
  const parsed = parseHashRoute(hash, defaultRouteId);
  const knownRoutes = routeIds instanceof Set ? routeIds : new Set(routeIds);

  return {
    kind: knownRoutes.has(parsed.routeId) ? 'page' : 'not-found',
    ...parsed,
  };
}

export function createHashRouter(options: HashRouterOptions): HashRouter {
  const routeIds = new Set(options.routeIds);
  let started = false;

  const current = (): ResolvedHashRoute => resolveHashRoute(
    options.location.hash,
    routeIds,
    options.defaultRouteId,
  );

  const sync = (): ResolvedHashRoute => {
    const route = current();
    options.onRouteChange(route);
    options.restoreFocus?.(route);
    return route;
  };

  const onHashChange = (): void => {
    sync();
  };

  return {
    current,
    navigate(target): void {
      options.location.hash = formatHashRoute(target);
    },
    sync,
    start(): () => void {
      if (!started) {
        started = true;
        options.changes.addEventListener('hashchange', onHashChange);
        sync();
      }

      return () => {
        if (!started) return;
        started = false;
        options.changes.removeEventListener('hashchange', onHashChange);
      };
    },
  };
}
