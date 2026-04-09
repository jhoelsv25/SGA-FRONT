export type BehaviorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BehaviorType = 'positive' | 'negative';

export type Behavior = {
  id: string;
  student?: any;
  studentName?: string;
  type: BehaviorType;
  severity?: BehaviorSeverity;
  category: string;
  recordDate: string;
  description: string;
  recordedBy?: string;
  place?: string;
  witnesses?: string;
  measuresTaken?: string;
  guardianNotified?: boolean;
  notificationDate?: string;
  actionToken?: string;
  sectionCourse?: any;
  createdAt?: string;
};

export type BehaviorCreate = {
  student: string;
  type: BehaviorType;
  category: string;
  recordDate: string;
  description: string;
  severity?: BehaviorSeverity;
  actionToken?: string;
  place?: string;
  witnesses?: string;
  measuresTaken?: string;
  guardianNotified?: boolean;
  period?: string;
  teacher?: string;
  sectionCourse?: string;
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
