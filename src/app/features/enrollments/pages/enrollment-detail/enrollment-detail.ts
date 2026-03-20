import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { EnrollmentApi } from '../../services/enrollment-api';
import type { Enrollment } from '../../types/enrollment-types';
import { EnrollmentForm } from '../../components/enrollment-form/enrollment-form';

@Component({
  selector: 'sga-enrollment-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './enrollment-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EnrollmentDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly enrollment = signal<Enrollment | null>((history.state?.enrollment as Enrollment | undefined) ?? null);
  readonly loading = signal(true);

  readonly studentName = computed(() => {
    const student = this.enrollment()?.student;
    const personName = student?.person
      ? `${student.person.firstName ?? ''} ${student.person.lastName ?? ''}`.trim()
      : '';
    return personName || `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || student?.studentCode || '';
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      enrolled: 'Matriculado',
      completed: 'Completado',
      dropped: 'Retirado',
      graduated: 'Egresado',
    };
    return map[this.enrollment()?.status ?? ''] ?? (this.enrollment()?.status || 'Sin estado');
  });

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      new: 'Nuevo',
      returning: 'Reinscripción',
      transfer: 'Traslado',
    };
    return map[this.enrollment()?.enrollmentType ?? ''] ?? (this.enrollment()?.enrollmentType || 'Sin tipo');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/students/enrollments']);
      return;
    }
    this.loadEnrollment(id);
  }

  goBack(): void {
    this.router.navigate(['/students/enrollments']);
  }

  goToStudent(): void {
    const studentId = this.enrollment()?.student?.id;
    if (!studentId) return;
    this.router.navigate(['/students', studentId]);
  }

  goToAttendance(): void {
    const current = this.enrollment();
    if (!current?.student?.id) return;
    this.router.navigate(['/attendance/register'], {
      queryParams: {
        studentId: current.student.id,
        studentName: this.studentName() || current.student.studentCode,
      },
    });
  }

  goToGrades(): void {
    const current = this.enrollment();
    if (!current) return;
    this.router.navigate(['/assessments/grades'], {
      queryParams: {
        enrollmentId: current.id,
        studentName: this.studentName() || current.student.studentCode,
      },
    });
  }

  openEdit(): void {
    const current = this.enrollment();
    if (!current) return;
    this.dialog.open(EnrollmentForm, {
      data: { current },
      width: '520px',
      maxHeight: '80vh',
    }).closed.subscribe(() => this.reload());
  }

  deleteCurrent(): void {
    const current = this.enrollment();
    if (!current) return;
    this.enrollmentApi.delete(current.id).subscribe({
      next: () => {
        this.toast.success('Matrícula eliminada');
        this.router.navigate(['/students/enrollments']);
      },
      error: (error) => {
        this.toast.error('No se pudo eliminar la matrícula', { description: error?.message });
      },
    });
  }

  private reload(): void {
    const id = this.enrollment()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadEnrollment(id);
  }

  private loadEnrollment(id: string): void {
    this.loading.set(true);
    this.enrollmentApi.getById(id).subscribe({
      next: (res) => {
        this.enrollment.set(res);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar la matrícula', { description: error?.message });
        this.router.navigate(['/students/enrollments']);
      },
    });
  }
}
