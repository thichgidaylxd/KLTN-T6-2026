/** Generic Spring-style paginated response wrapper */
export interface PagedData<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PageableParams {
  page?: number;
  size?: number;
  sort?: string[];
}
