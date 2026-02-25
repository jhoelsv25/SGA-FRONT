export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type Payment = {
  id: string;
  studentId: string;
  studentName?: string;
  concept: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  paidAt?: string;
  status: PaymentStatus;
  reference?: string;
  createdAt?: string;
};

export type PaymentCreate = {
  studentId: string;
  concept: string;
  amount: number;
  dueDate: string;
  reference?: string;
};

export type PaymentUpdate = Partial<Omit<PaymentCreate, 'studentId'>> & { status?: PaymentStatus };

export type PaymentResponse = {
  data: Payment;
  message: string;
};

export type PaymentsListResponse = {
  data: Payment[];
  message?: string;
};
