import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { StudentApi } from '../../services/api/student-api';
import { StudentForm } from '../../components/student-form/student-form';
import type { Student } from '../../types/student-types';
import { EnrollmentApi } from '@features/enrollments/services/enrollment-api';
import type { Enrollment } from '@features/enrollments/types/enrollment-types';
import { GuardianApi } from '../../services/api/guardian-api';
import type { StudentGuardian } from '../../types/guardian-types';
import { ObservationApi } from '../../services/api/observation-api';
import type { StudentObservation } from '../../types/observation-types';

@Component({
  selector: 'sga-student-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './student-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentApi = inject(StudentApi);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly guardianApi = inject(GuardianApi);
  private readonly observationApi = inject(ObservationApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly student = signal<Student | null>((history.state?.student as Student | undefined) ?? null);
  readonly loading = signal(true);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly guardians = signal<StudentGuardian[]>([]);
  readonly observations = signal<StudentObservation[]>([]);

  readonly fullName = computed(() => {
    const current = this.student();
    if (!current) return '';
    return `${current.firstName ?? ''} ${current.lastName ?? ''}`.trim() || current.studentCode;
  });

  readonly currentEnrollment = computed(() => this.enrollments()[0] ?? null);
  readonly primaryGuardian = computed(
    () => this.guardians().find((guardian) => guardian.isPrimary) ?? this.guardians()[0] ?? null,
  );
  readonly latestObservation = computed(() => this.observations()[0] ?? null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/students/list']);
      return;
    }

    this.loadStudent(id);
  }

  goBack(): void {
    this.router.navigate(['/students/list']);
  }

  openEdit(): void {
    const current = this.student();
    if (!current) return;
    this.dialog
      .open(StudentForm, {
        data: { current },
        width: '880px',
        maxHeight: '80vh',
      })
      .closed.subscribe(() => this.reload());
  }

  goToEnrollments(): void {
    const student = this.student();
    if (!student) return;
    this.router.navigate(['/students/enrollments'], {
      queryParams: { studentId: student.id, studentName: this.fullName() || student.studentCode },
    });
  }

  goToAttendance(): void {
    const student = this.student();
    if (!student) return;
    this.router.navigate(['/attendance/register'], {
      queryParams: { studentId: student.id, studentName: this.fullName() || student.studentCode },
    });
  }

  goToGuardians(): void {
    const student = this.student();
    if (!student) return;
    this.router.navigate(['/students/guardians'], {
      queryParams: { studentId: student.id, studentName: this.fullName() || student.studentCode },
    });
  }

  goToObservations(): void {
    const student = this.student();
    if (!student) return;
    this.router.navigate(['/students/observations'], {
      queryParams: { studentId: student.id, studentName: this.fullName() || student.studentCode },
    });
  }

  statusLabel(): string {
    return this.student()?.isActive ? 'Activo' : 'Inactivo';
  }

  genderLabel(): string {
    const gender = this.student()?.gender;
    return gender === 'M' ? 'Masculino' : gender === 'F' ? 'Femenino' : 'Otro';
  }

  observationTypeLabel(type?: string): string {
    if (type === 'behavioral') return 'Conductual';
    if (type === 'academic') return 'Académica';
    if (type === 'social') return 'Social';
    return 'Sin tipo';
  }

  currentSectionName(): string {
    return this.currentEnrollment()?.section?.name || 'Sin sección asignada';
  }

  guardianName(guardian: StudentGuardian | null): string {
    if (!guardian?.guardian?.person) return 'Sin apoderado';
    return `${guardian.guardian.person.firstName ?? ''} ${guardian.guardian.person.lastName ?? ''}`.trim() || 'Sin apoderado';
  }

  private reload(): void {
    const id = this.student()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadStudent(id);
  }

  private loadStudent(id: string): void {
    this.loading.set(true);

    this.studentApi.getAll({ size: 999 }).subscribe({
      next: (res) => {
        const current = (res.data ?? []).find((student) => student.id === id) ?? this.student();
        if (!current) {
          this.loading.set(false);
          this.router.navigate(['/students/list']);
          return;
        }

        this.student.set(current);
        this.loadRelatedData(current.id);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el estudiante', { description: error?.message });
        this.router.navigate(['/students/list']);
      },
    });
  }

  private loadRelatedData(studentId: string): void {
    this.enrollmentApi.getAll({ size: 999 }).subscribe({
      next: (res) => {
        this.enrollments.set((res.data ?? []).filter((item) => item.student?.id === studentId));
      },
    });

    this.guardianApi.getStudentGuardians().subscribe({
      next: (res) => {
        this.guardians.set((res.data ?? []).filter((item) => item.student?.id === studentId));
      },
    });

    this.observationApi.getAll().subscribe({
      next: (res) => {
        const filtered = (res.data ?? [])
          .filter((item) => item.student?.id === studentId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.observations.set(filtered);
        this.loading.set(false);
      },
      error: () => {
        this.observations.set([]);
        this.loading.set(false);
      },
    });
  }
}
