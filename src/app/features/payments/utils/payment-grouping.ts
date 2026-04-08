import { Payment } from '../types/payment-types';

export type PaymentGroup = {
  key: string;
  title: string;
  periodLabel: string;
  paymentCount: number;
  studentCount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueCount: number;
  pendingCount: number;
  partialCount: number;
  status: 'overdue' | 'pending' | 'partial' | 'paid';
  payments: Payment[];
};

const PERIOD_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  month: 'long',
  year: 'numeric',
});

export function buildPaymentGroups(payments: Payment[]): PaymentGroup[] {
  const groups = new Map<string, Payment[]>();

  for (const payment of payments) {
    const key = getPaymentGroupKey(payment);
    const current = groups.get(key) ?? [];
    current.push(payment);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .map(([key, items]) => mapGroup(key, items))
    .sort((a, b) => {
      const severity = (status: PaymentGroup['status']) => {
        if (status === 'overdue') return 0;
        if (status === 'pending') return 1;
        if (status === 'partial') return 2;
        return 3;
      };

      const bySeverity = severity(a.status) - severity(b.status);
      if (bySeverity !== 0) return bySeverity;
      return b.totalAmount - a.totalAmount;
    });
}

export function getPaymentGroupKey(payment: Payment) {
  const date = safeDate(payment.dueDate);
  const year = date?.getFullYear() ?? 0;
  const month = date ? date.getMonth() + 1 : 0;
  const concept = normalize(payment.concept || 'sin-concepto');
  return `${year}-${String(month).padStart(2, '0')}__${concept}`;
}

function mapGroup(key: string, payments: Payment[]): PaymentGroup {
  const sample = payments[0];
  const dueDate = safeDate(sample?.dueDate);
  const uniqueStudents = new Set(payments.map((payment) => payment.studentId).filter(Boolean));
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
  const outstandingAmount = payments.reduce(
    (sum, payment) => sum + Math.max(Number(payment.amount || 0) - Number(payment.paidAmount || 0), 0),
    0,
  );
  const overdueCount = payments.filter((payment) => payment.status === 'overdue').length;
  const pendingCount = payments.filter((payment) => payment.status === 'pending').length;
  const partialCount = payments.filter((payment) => payment.status === 'partial').length;

  return {
    key,
    title: sample?.concept || 'Grupo sin concepto',
    periodLabel: dueDate ? capitalize(PERIOD_FORMATTER.format(dueDate)) : 'Sin periodo',
    paymentCount: payments.length,
    studentCount: uniqueStudents.size,
    totalAmount,
    paidAmount,
    outstandingAmount,
    overdueCount,
    pendingCount,
    partialCount,
    status: resolveGroupStatus({ overdueCount, pendingCount, partialCount }),
    payments,
  };
}

function resolveGroupStatus(input: { overdueCount: number; pendingCount: number; partialCount: number }): PaymentGroup['status'] {
  if (input.overdueCount > 0) return 'overdue';
  if (input.pendingCount > 0) return 'pending';
  if (input.partialCount > 0) return 'partial';
  return 'paid';
}

function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
