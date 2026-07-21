import { fetchAllByPaging } from '@sdcorejs/utils/fns';

interface Row {
  id: string;
}

const rows = await fetchAllByPaging<Row>(
  async (pageSize, pageNumber, signal) => {
    // The helper remains zero-based. Translate only for this one-based transport.
    const transportPage = pageNumber + 1;
    const response = await fetch(
      `/legacy/rows?page=${transportPage}&pageSize=${pageSize}`,
      { signal },
    );
    return response.json() as Promise<{ items: Row[]; total: number }>;
  },
  50,
);

void rows;
