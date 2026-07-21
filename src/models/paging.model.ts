import { Filter } from './filter.model';
import { NestedKeyOf } from './nested-key-of.model';
import { Order } from './order.model';

/**
 * Base query request used when pagination is not required but filtering and field projection are.
 *
 * Extend with `PagingReq` when you also need pagination and sorting.
 *
 * @template T - The entity type being queried (e.g. `User`).
 *
 * @example
 * const req: QueryReq<User> = {
 *   filters: [{ field: 'status', operator: 'EQUAL', data: 'active' }],
 *   fields: ['id', 'name', 'email'],
 * };
 */
export interface QueryReq<T = any> {
  /** List of filter conditions applied to the query. */
  filters?: Filter<T>[];
  /** Sparse fieldset — only these fields will be returned in the response. */
  fields?: NestedKeyOf<T>[];
}

/**
 * Paginated query request that extends `QueryReq` with page controls and sort orders.
 *
 * @template T - The entity type being queried (e.g. `Product`).
 *
 * @example
 * const req: PagingReq<Product> = {
 *   pageSize: 20,
 *   pageNumber: 0,
 *   orders: [{ field: 'createdAt', direction: 'DESC' }],
 *   filters: [{ field: 'category', operator: 'EQUAL', data: 'electronics' }],
 * };
 */
export interface PagingReq<T = any> extends QueryReq<T> {
  /** Number of items per page. Defaults to the server-side default when omitted. */
  pageSize?: number;
  /** Optional zero-based page index. Pass `0` for the first page. */
  pageNumber?: number;
  /** Ordered list of sort criteria applied to the result set. */
  orders?: Order<T>[];
}

/**
 * Standard paginated response envelope returned by list / search endpoints.
 *
 * @template T - The entity type contained in the page (e.g. `Product`).
 *
 * @example
 * const res: PagingRes<Product> = {
 *   items: [{ id: 1, name: 'Phone' }, { id: 2, name: 'Laptop' }],
 *   total: 154,
 * };
 */
export interface PagingRes<T = any> {
  /** The current page of results. */
  items: T[];
  /** Total number of records matching the query across all pages. */
  total: number;
}
