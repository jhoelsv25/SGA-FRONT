export enum SubjectAreaType {
  CORE = 'core', //BÁSICA
  ELECTIVE = 'elective', //ELECTIVA
  OPTIONAL = 'optional', //OPCIONAL
}

export enum StatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export interface SubjectArea {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly description?: string;
  readonly type: SubjectAreaType;
  readonly status: StatusType;
}
