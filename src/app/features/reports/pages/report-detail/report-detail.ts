import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { ReportApi } from '../../services/report-api';
import type { Report } from '../../types/report-types';
import { ReportForm } from '../../components/report-form/report-form';

@Component({
  selector: 'sga-report-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './report-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportApi = inject(ReportApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly report = signal<Report | null>((history.state?.report as Report | undefined) ?? null);
  readonly loading = signal(true);

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

  ngOnInit(): void {
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
    this.dialog.open(ReportForm, {
      data: { current },
      width: '520px',
      maxHeight: '80vh',
    }).closed.subscribe(() => this.reload());
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
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el reporte', { description: error?.message });
        this.router.navigate(['/reports/academic']);
      },
    });
  }
}
