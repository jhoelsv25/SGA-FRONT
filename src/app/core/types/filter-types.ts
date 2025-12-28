export type FilterField = {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'date-range' | 'number' | 'boolean';
  placeholder?: string;
  options?: { value: unknown; label: string }[];
  multiple?: boolean; // Para select múltiple
  keyParams?: string; // nombre del parámetro en la URL/backend
  visible?: boolean | ((...args: unknown[]) => boolean);
  disabled?: boolean | ((...args: unknown[]) => boolean);
};

export type FilterParams = {
  [key: string]: unknown;
};
