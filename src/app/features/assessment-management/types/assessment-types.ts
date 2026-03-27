export interface Assessment {
  id: string;
  name: string;
  description: string;
  assessmentDate: string;
  weightPercentage: number;
  maxScore: number;
  type: 'formative' | 'summative' | 'diagnostic';
  status: 'pending' | 'completed' | 'reviewed';
  period: { id: string; name: string };
  sectionCourse: { id: string; course: { name: string } };
  competency?: { id: string; code: string; name: string };
}

export interface PeriodCompetencyGrade {
  id: string;
  numericScore: number;
  literalScore: string | null;
  totalWeight: number;
  assessmentsCount: number;
  enrollment: {
    id: string;
    student?: {
      id: string;
      studentCode?: string;
      person?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
  academicYear?: {
    id: string;
    name?: string;
  };
  period?: {
    id: string;
    name?: string;
    periodNumber?: number;
  };
  competency?: {
    id: string;
    code?: string;
    name?: string;
  };
  sectionCourse?: {
    id: string;
    course?: {
      name?: string;
    };
  };
}

export interface AssessmentScore {
  id?: string;
  score: number;
  observation: string;
  registerAt: string;
  enrollmentId: string;
  assessmentId: string;
  studentName?: string;
}

export interface BulkScoreRequest {
  assessmentId: string;
  scores: Partial<AssessmentScore>[];
}

export interface AssessmentUpsertPayload {
  name: string;
  description?: string;
  assessmentDate: string;
  weightPercentage: number;
  maxScore: number;
  type: 'formative' | 'summative' | 'diagnostic';
  status: 'pending' | 'completed' | 'reviewed';
  period: string;
  sectionCourse: string;
  competency?: string;
}
