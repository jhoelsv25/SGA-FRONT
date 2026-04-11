import { DataSourceColumn } from '@core/types/data-source-types';

export const PAYMENT_COLUMN: DataSourceColumn[] = [
  { key: 'studentName', label: 'Estudiante', sortable: true },
  { key: 'concept', label: 'Concepto', sortable: true },
  { key: 'amount', label: 'Monto', sortable: true, type: 'number' },
  { key: 'paidAmount', label: 'Pagado', type: 'number' },
  { key: 'dueDate', label: 'Vencimiento', sortable: true, type: 'date' },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'paidAt', label: 'Fecha de pago', type: 'datetime' },
];
