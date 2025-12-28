// types para el DataSource
export type DataSourceColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'date' | 'time' | 'datetime' | 'custom' | 'object' | 'array';
  sortFn?: (a: unknown, b: unknown) => number;
  keyParams?: string; // Nombre del parámetro en la URL/backend para ordenamiento
  width?: string;
  minWidth?: string; // Ancho mínimo de la columna
  maxWidth?: string; // Ancho máximo de la columna
  fixed?: boolean; // Si la columna debe tener un ancho fijo
  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'time'
    | 'datetime'
    | 'boolean'
    | 'custom'
    | 'object'
    | 'array';
  format?: string; // Formato: 'dd/MM/yyyy', 'HH:mm:ss', 'dd/MM/yyyy HH:mm', 'short', 'medium', 'long', 'full'
  customTemplate?: string;
  truncate?: boolean; // Si debe truncar el texto
  truncateLength?: number; // Número máximo de caracteres antes de truncar
  showTooltip?: boolean; // Mostrar tooltip con el texto completo al hacer hover
  tooltipPosition?: 'above' | 'below' | 'left' | 'right'; // Posición del tooltip
  objectKey?: string; // Para mostrar una propiedad específica de un objeto
  arrayItemKey?: string; // Para mostrar una propiedad de cada elemento en un array
  arrayDisplayKey?: string; // Clave alternativa para mostrar en el array (ej: 'name' en lugar de 'id')
  onClick?: (value: unknown, row?: unknown) => void; // Acción personalizada al hacer click en la celda
  onDblClick?: (value: unknown, row?: unknown) => void; // Acción personalizada al hacer doble click en la celda
  booleanLabels?: { true: string; false: string }; // Etiquetas personalizadas para chips booleanos
  booleanColors?: { true: string; false: string }; // Clases de color personalizadas para chips booleanos
  valueLabels?: { [key: string]: string }; // Etiquetas personalizadas para chips de valores múltiples
  valueColors?: { [key: string]: string }; // Clases de color personalizadas para chips de valores múltiples
  arrayMaxItems?: number; // Número máximo de items a mostrar en array (resto se muestra como "+N")
  editable?: boolean; // Permite editar el valor booleano con checkbox
  onToggle?: (newValue: boolean, row?: unknown) => void; // Función al cambiar el valor del checkbox
  visible?: boolean | ((row?: unknown) => boolean); // Control de visibilidad de la columna
  cssClass?: string; // Clases CSS adicionales para la columna
  cellCssClass?: string | ((value: unknown, row?: unknown) => string); // Clases CSS adicionales para las celdas (puede ser función)
};

export type DataSourceSorting = {
  column: string;
  direction: 'asc' | 'desc';
};

export type DataSourceConfig = {
  selectable?: boolean | ((permission?: unknown) => boolean); // Permitir selección de filas (puede depender de permisos)
  multiSelect?: boolean | ((permission?: unknown) => boolean); // Permitir selección múltiple (puede depender de permisos)
  sortable?: boolean | ((permission?: unknown) => boolean); // Permitir ordenamiento (puede depender de permisos)
  localSort?: boolean; // Si true, el sort se aplica localmente en la tabla
  pagination?: boolean; // Habilitar paginación
  rowDraggable?: boolean | ((permission?: unknown) => boolean); // Permitir reordenar filas con drag & drop (puede depender de permisos)
};
