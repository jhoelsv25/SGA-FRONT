import { DataSourceColumn } from '@core/types/data-source-types';

export const USER_COLUMN: DataSourceColumn[] = [
  { key: 'username', label: 'Usuario', sortable: true },
  { key: 'firstName', label: 'Nombre', sortable: true },
  { key: 'lastName', label: 'Apellido', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'roleName', label: 'Rol', sortable: true },
  { key: 'lastLogin', label: 'Última sesión', type: 'datetime', sortable: true },
  { key: 'isActive', label: 'Activo', type: 'boolean' },
  { key: 'createdAt', label: 'Creado', sortable: true, type: 'datetime' },
];
