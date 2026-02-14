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
