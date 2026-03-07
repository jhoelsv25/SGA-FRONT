import type { SelectOption } from '@shared/ui/select/select';

export const MODALITY_OPTIONS: SelectOption[] = [
  { value: 'online', label: 'En línea' },
  { value: 'offline', label: 'Presencial' },
  { value: 'hybrid', label: 'Híbrido' },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'suspended', label: 'Suspendido' },
];

export const MODALITY_LABELS: Record<string, string> = {
  online: 'En línea',
  offline: 'Presencial',
  hybrid: 'Híbrido',
};
