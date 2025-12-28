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
};
export type InstitutionUpdate = Partial<Institution>;

export type InstitutionCreate = Omit<Institution, 'id'>;

export type InstitutionResponse = {
  data: Institution;
  message: string;
  status: string;
};
