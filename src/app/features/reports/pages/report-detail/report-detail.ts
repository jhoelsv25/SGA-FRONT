import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { AssessmentApi } from '@features/assessment-management/services/assessment-api';
import type { PeriodCompetencyGrade } from '@features/assessment-management/types/assessment-types';
import { ReportApi } from '../../services/report-api';
import { ReportSocketService } from '../../services/report-socket.service';
import type { AcademicReportParameters, Report, ReportMeta } from '../../types/report-types';
import { ReportForm } from '../../components/report-form/report-form';

@Component({
  selector: 'sga-report-detail',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
  ],
  templateUrl: './report-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportApi = inject(ReportApi);
  private readonly reportSocket = inject(ReportSocketService);
  private readonly assessmentApi = inject(AssessmentApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly report = signal<Report | null>((history.state?.report as Report | undefined) ?? null);
  readonly loading = signal(true);
  private readonly destroy$ = new Subject<void>();
  readonly academicRows = signal<PeriodCompetencyGrade[]>([]);
  readonly academicLoading = signal(false);
  readonly academicError = signal<string | null>(null);
  readonly academicParameters = computed(
    () => (this.report()?.parameters ?? {}) as AcademicReportParameters,
  );
  readonly reportMeta = computed(
    () =>
      (((this.report()?.parameters ?? {}) as Record<string, unknown>)['__meta'] ??
        {}) as ReportMeta,
  );
  readonly isAcademicReport = computed(() => this.report()?.type === 'academic');

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      academic: 'Académico',
      attendance: 'Asistencia',
      payments: 'Pagos',
      behavior: 'Conducta',
      enrollment: 'Matrículas',
      custom: 'Personalizado',
      other: 'Otro',
    };
    return map[this.report()?.type ?? ''] ?? (this.report()?.type || 'Sin tipo');
  });

  readonly formatLabel = computed(() => {
    const map: Record<string, string> = {
      pdf: 'PDF',
      xlsx: 'Excel',
      csv: 'CSV',
    };
    return map[this.report()?.format ?? ''] ?? (this.report()?.format || 'Sin formato');
  });

  studentFullName(row: PeriodCompetencyGrade): string {
    const person = row.enrollment?.student?.person;
    return [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || 'Estudiante';
  }

  ngOnInit(): void {
    this.reportSocket.connect();
    this.reportSocket.report$.pipe(takeUntil(this.destroy$)).subscribe((incoming) => {
      if (incoming.id === this.report()?.id) {
        this.report.set(incoming);
        this.loadAcademicPreview();
      }
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/reports/academic']);
      return;
    }
    this.loadReport(id);
  }

  goBack(): void {
    this.router.navigate(['/reports/academic']);
  }

  openEdit(): void {
    const current = this.report();
    if (!current) return;
    this.dialog
      .open(ReportForm, {
        data: { current },
        width: '520px',
        maxHeight: '80vh',
      })
      .closed.subscribe(() => this.reload());
  }

  downloadCurrent(): void {
    const current = this.report();
    if (!current?.downloadUrl) return;
    window.open(current.downloadUrl, '_blank');
  }

  deleteCurrent(): void {
    const current = this.report();
    if (!current) return;
    this.reportApi.delete(current.id).subscribe({
      next: () => {
        this.toast.success('Reporte eliminado');
        this.router.navigate(['/reports/academic']);
      },
      error: (error) => {
        this.toast.error('No se pudo eliminar el reporte', { description: error?.message });
      },
    });
  }

  private reload(): void {
    const id = this.report()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadReport(id);
  }

  private loadReport(id: string): void {
    this.loading.set(true);
    this.reportApi.getById(id).subscribe({
      next: (res) => {
        this.report.set(res.data);
        this.loading.set(false);
        this.loadAcademicPreview();
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el reporte', { description: error?.message });
        this.router.navigate(['/reports/academic']);
      },
    });
  }

  private loadAcademicPreview(): void {
    if (!this.isAcademicReport()) {
      this.academicRows.set([]);
      this.academicError.set(null);
      this.academicLoading.set(false);
      return;
    }

    const params = this.academicParameters();
    if (!params.sectionCourse && !params.period && !params.competency && !params.student) {
      this.academicRows.set([]);
      this.academicError.set(
        'Este reporte académico no tiene parámetros suficientes para calcular el consolidado.',
      );
      this.academicLoading.set(false);
      return;
    }

    this.academicLoading.set(true);
    this.academicError.set(null);
    this.assessmentApi
      .getConsolidatedGrades({
        sectionCourse: params.sectionCourse ?? undefined,
        period: params.period ?? undefined,
        competency: params.competency ?? undefined,
      })
      .subscribe({
        next: (response) => {
          const rows = (response.data ?? []).filter(
            (row) => !params.student || row.enrollment?.student?.id === params.student,
          );
          this.academicRows.set(rows);
          this.academicLoading.set(false);
        },
        error: (error) => {
          this.academicRows.set([]);
          this.academicLoading.set(false);
          this.academicError.set(error?.message ?? 'No se pudo cargar el consolidado académico.');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
