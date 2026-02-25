export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BehaviorType = 'incident' | 'achievement' | 'observation' | 'other';

export type Behavior = {
  id: string;
  studentId: string;
  studentName?: string;
  type: BehaviorType;
  severity?: BehaviorSeverity;
  date: string;
  description: string;
  recordedBy?: string;
  createdAt?: string;
};

export type BehaviorCreate = {
  studentId: string;
  type: BehaviorType;
  severity?: BehaviorSeverity;
  date: string;
  description: string;
};

export type BehaviorUpdate = Partial<BehaviorCreate>;

export type BehaviorResponse = {
  data: Behavior;
  message: string;
};

export type BehaviorsListResponse = {
  data: Behavior[];
  message?: string;
};
