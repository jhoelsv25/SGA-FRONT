export type GuardianRelationship = 'parent' | 'guardian' | 'other';

export interface Guardian {
  id: string;
  occupation: string;
  workplace: string;
  workplaceAddress?: string;
  workplacePhone?: string;
  educationLevel: string;
  monthlyIncome: number;
  livesWithStudent: boolean;
  isPrimaryGuardian: boolean;
  relationship: GuardianRelationship;
  person?: { id: string; firstName?: string; lastName?: string; email?: string };
}

export interface StudentGuardian {
  id: string;
  isPrimary: boolean;
  pickupAuthorization: boolean;
  receivesNotifications?: string;
  emergencyContact: boolean;
  student?: { id: string; firstName?: string; lastName?: string; studentCode?: string };
  guardian?: Guardian;
}

export interface CreateGuardianDto {
  occupation: string;
  workplace: string;
  workplaceAddress?: string;
  workplacePhone?: string;
  educationLevel: string;
  monthlyIncome: number;
  livesWithStudent: boolean;
  isPrimaryGuardian: boolean;
  relationship: GuardianRelationship;
  person: string;
}

export interface CreateStudentGuardianDto {
  isPrimary: boolean;
  pickupAuthorization: boolean;
  receivesNotifications?: string;
  emergencyContact: boolean;
  student: string;
  guardian: string;
}

export type GuardianUpdateDto = Partial<CreateGuardianDto>;
export type StudentGuardianUpdateDto = Partial<CreateStudentGuardianDto>;
