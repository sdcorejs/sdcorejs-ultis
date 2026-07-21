import { ArrayUtilities } from '@sdcorejs/utils/fns';

interface Node {
  id: number;
  name: string;
  children?: Node[];
}

const records: Node[] = [
  { id: 1, name: 'Root', children: [{ id: 2, name: 'Vietnam' }] },
  { id: 3, name: 'Other' },
];
const matches = ArrayUtilities.search(records, 'viet nam', 'name', 'children');
const merged = ArrayUtilities.union('id', records, [{ id: 1, name: 'Duplicate' }]);
const firstPage = ArrayUtilities.paging(merged, 20); // page 0
const secondPage = ArrayUtilities.paging(merged, 20, 1);

void [matches, firstPage, secondPage];
