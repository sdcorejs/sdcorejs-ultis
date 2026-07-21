import { FilterUtilities, type Filter, type MatchOptions } from '@sdcorejs/utils';

interface Product {
  name: string;
  price: number;
  createdAt: string;
}

const filters: Filter<Product>[] = [
  { field: 'price', operator: 'BETWEEN', data: { from: 100, to: 500 } },
  { field: 'name', operator: 'CONTAIN', data: 'phone' },
];
const options: MatchOptions<Product> = {
  fieldTypes: { price: 'number', createdAt: 'date' },
};
const validated = filters.map(filter => FilterUtilities.validateFilter(filter, options));
const product: Product = { name: 'Smartphone', price: 299, createdAt: '2026-07-20' };
const matches = validated.every(filter => FilterUtilities.evaluateFilter(product, filter, options));

// Client-side matching is a UI/query convenience, never an authorization boundary.
void matches;
