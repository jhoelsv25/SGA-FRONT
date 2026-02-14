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

/** Paginación por offset (páginas). Ideal para listas con total conocido. */
export type OffsetPagination = {
  page: number;
  size: number;
  total: number;
};

/** Paginación por cursor. Ideal para listas muy grandes sin COUNT. */
export type CursorPagination = {
  nextCursor: string | null | undefined;
  hasNext: boolean;
  limit: number;
  loadedCount: number;
};

export type PaginationUnion = OffsetPagination | CursorPagination;

/** Parámetros genéricos para APIs (filtros, paginación, orden) */
export type ApiParams = Record<string, string | number | boolean | undefined>;

/** Respuesta de API para create/update (retorna entidad) */
export type ApiEntityResponse<T> = { data: T };

export function isCursorPagination(p: PaginationUnion): p is CursorPagination {
  return 'nextCursor' in p && 'hasNext' in p;
}
