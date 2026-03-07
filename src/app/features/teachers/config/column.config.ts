import { DataSourceColumn } from '@core/types/data-source-types';

export const TEACHER_COLUMN: DataSourceColumn[] = [
  { key: 'teacherCode', label: 'Código', sortable: true },
  { key: 'specialization', label: 'Especialidad', sortable: true },
  { key: 'professionalTitle', label: 'Título profesional' },
  { key: 'contractType', label: 'Contrato' },
  { key: 'laborRegime', label: 'Régimen' },
  { key: 'hireDate', label: 'F. contratación', type: 'date' },
  { key: 'weeklyHours', label: 'Horas/semana', type: 'number' },
  { key: 'employmentStatus', label: 'Estado' },
];
