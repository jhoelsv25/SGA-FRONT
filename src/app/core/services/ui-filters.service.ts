import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiFiltersService {
  // Attendance
  readonly attendanceRegisterSectionCourseId = signal('');
  readonly attendanceRegisterDate = signal('');
  readonly attendanceReportsSearch = signal('');

  // Behavior
  readonly behaviorSearch = signal('');
  readonly behaviorType = signal('');
  readonly behaviorSeverity = signal('');

  // Payments
  readonly paymentSearch = signal('');
  readonly paymentStatus = signal('');

  setAttendanceRegisterSectionCourseId(value: string): void {
    this.attendanceRegisterSectionCourseId.set(value ?? '');
  }

  setAttendanceRegisterDate(value: string): void {
    this.attendanceRegisterDate.set(value ?? '');
  }

  setAttendanceReportsSearch(value: string): void {
    this.attendanceReportsSearch.set((value ?? '').trim());
  }

  setBehaviorSearch(value: string): void {
    this.behaviorSearch.set((value ?? '').trim());
  }

  setBehaviorType(value: string): void {
    this.behaviorType.set(value ?? '');
  }

  setBehaviorSeverity(value: string): void {
    this.behaviorSeverity.set(value ?? '');
  }

  setPaymentSearch(value: string): void {
    this.paymentSearch.set((value ?? '').trim());
  }

  setPaymentStatus(value: string): void {
    this.paymentStatus.set(value ?? '');
  }

  clearAttendanceRegisterFilters(): void {
    this.attendanceRegisterSectionCourseId.set('');
    this.attendanceRegisterDate.set('');
  }

  clearAttendanceReportsFilters(): void {
    this.attendanceReportsSearch.set('');
  }

  clearBehaviorFilters(): void {
    this.behaviorSearch.set('');
    this.behaviorType.set('');
    this.behaviorSeverity.set('');
  }

  clearPaymentFilters(): void {
    this.paymentSearch.set('');
    this.paymentStatus.set('');
  }
}
