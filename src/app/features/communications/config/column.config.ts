import { DataSourceColumn } from '@core/types/data-source-types';

export const COMMUNICATION_COLUMN: DataSourceColumn[] = [
  { key: 'subject', label: 'Asunto', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'recipientCount', label: 'Destinatarios', type: 'number' },
  { key: 'sentAt', label: 'Enviado', sortable: true, type: 'datetime' },
];
