export type Institution = {
  id: string;
  name: string;
  modularCode: string;
  managementType?: string;
  ugel?: string;
  dre?: string;
  principal?: string;
  address: string;
  district?: string;
  province?: string;
  department?: string;
  phone?: string;
  email?: string;
  status: string;
  logoUrl?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadius?: number;
};
export type InstitutionUpdate = Partial<Institution>;

export type InstitutionCreate = Omit<Institution, 'id'>;

export type InstitutionResponse = {
  data: Institution;
  message: string;
  status: string;
};

export enum InstitutionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

export const INSTITUTION_STATUS_LABELS: Record<string, string> = {
  [InstitutionStatus.ACTIVE]: 'Activa',
  [InstitutionStatus.INACTIVE]: 'Inactiva',
  [InstitutionStatus.CLOSED]: 'Cerrada',
};
