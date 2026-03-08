import { DataSourceColumn } from '@core/types/data-source-types';

export const ASSESSMENT_COLUMNS: DataSourceColumn[] = [
  {
    key: 'name',
    label: 'Evaluación',
    sortable: true,
    width: '250px',
  },
  {
    key: 'period',
    label: 'Período',
    width: '150px',
    type: 'object',
    objectKey: 'name',
  },
  {
    key: 'type',
    label: 'Tipo',
    width: '120px',
  },
  {
    key: 'weightPercentage',
    label: 'Peso (%)',
    width: '100px',
    cellCssClass: 'text-center',
  },
  {
    key: 'assessmentDate',
    label: 'Fecha',
    width: '150px',
    type: 'date',
  },
  {
    key: 'status',
    label: 'Estado',
    width: '120px',
  },
];
