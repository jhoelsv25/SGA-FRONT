export type ModuleListItem = {
  id: string;
  name: string;
  key: string;
  description?: string;
  order: number;
  path?: string;
  visibility: string;
  icon?: string;
  isActive: boolean;
  isSystem: boolean;
};

export type ModulesListParams = {
  mode?: 'offset' | 'cursor';
  page?: number;
  size?: number;
  limit?: number;
  cursor?: string;
  search?: string;
};

export type ModulesListOffsetResponse = {
  data: ModuleListItem[];
  page: number;
  size: number;
  total: number;
};

export type ModulesListCursorResponse = {
  data: ModuleListItem[];
  nextCursor?: string;
  hasNext: boolean;
  limit: number;
};
