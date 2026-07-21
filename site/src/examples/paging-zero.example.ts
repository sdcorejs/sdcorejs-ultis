import { fetchAllByPaging } from '@sdcorejs/utils/fns';

interface User {
  id: number;
  name: string;
}

interface Page<T> {
  items: T[];
  total: number;
}

const users = await fetchAllByPaging<User>(
  async (pageSize, pageNumber, signal): Promise<Page<User>> => {
    const response = await fetch(
      `/api/users?page=${pageNumber}&pageSize=${pageSize}`,
      { signal },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<Page<User>>;
  },
  100,
  { maxPages: 1_000, totalChangePolicy: 'error' },
);

void users;
