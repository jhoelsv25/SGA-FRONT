export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'mobile_payment'
  | 'yape'
  | 'plin';

export type Payment = {
  id: string;
  studentId: string;
  enrollmentId?: string;
  paymentGroupId?: string | null;
  studentName?: string;
  concept: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  paidAt?: string;
  status: PaymentStatus;
  reference?: string;
  internalReference?: string;
  externalReference?: string;
  receiptNumber?: string;
  payerName?: string;
  paymentMethod?: PaymentMethod;
  installmentNumber?: number;
  lateFee?: number;
  discountAmount?: number;
  observations?: string;
  evidenceUrl?: string;
  evidenceName?: string;
  rawStatus?: string;
  createdAt?: string;
};

export type PaymentCreate = {
  studentId: string;
  paymentGroupId?: string;
  concept: string;
  amount: number;
  dueDate: string;
  amountPaid?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  installmentNumber?: number;
  receiptNumber?: string;
  payerName?: string;
  lateFee?: number;
  discountAmount?: number;
  internalReference?: string;
  externalReference?: string;
  observations?: string;
  evidenceUrl?: string;
  evidenceName?: string;
  status?: PaymentStatus;
};

export type PaymentUpdate = Partial<PaymentCreate>;

export type PaymentResponse = {
  data: Payment;
  message: string;
};

export type PaymentsListResponse = {
  data: Payment[];
  message?: string;
};

export type PaymentGroupStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type PaymentGroupTargetScope = 'manual' | 'grade' | 'section';

export type PaymentGroup = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  targetScope?: PaymentGroupTargetScope;
  targetLabel?: string;
  gradeId?: string | null;
  gradeName?: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
  lateFee?: number;
  discountAmount?: number;
  internalReference?: string;
  observations?: string;
  isActive?: boolean;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentCount: number;
  studentCount: number;
  overdueCount: number;
  pendingCount: number;
  partialCount: number;
  status: PaymentGroupStatus;
  payments: Payment[];
};

export type PaymentGroupCreate = {
  targetScope?: PaymentGroupTargetScope;
  gradeId?: string;
  sectionId?: string;
  title: string;
  amount: number;
  dueDate: string;
  lateFee?: number;
  discountAmount?: number;
  internalReference?: string;
  observations?: string;
  isActive?: boolean;
};

export type PaymentGroupResponse = {
  data: PaymentGroup;
  message?: string;
};

export type PaymentGroupsListResponse = {
  data: PaymentGroup[];
  message?: string;
};
