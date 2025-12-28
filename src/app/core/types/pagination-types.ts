export type DataResponse<T> = {
  data: T[];
  page: number;
  size: number;
  total: number;
};
export type PaginationType = {
  page: number;
  size: number;
  total: number;
};
