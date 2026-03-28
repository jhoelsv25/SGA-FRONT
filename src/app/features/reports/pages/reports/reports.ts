import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ReportStore } from '../../services/store/report.store';
import { Report } from '../../types/report-types';
import { ReportForm } from '../../components/report-form/report-form';
import { ReportCardComponent } from '../../components/report-card/report-card';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { Router } from '@angular/router';
import { AuthStore } from '@auth/services/store/auth.store';
import { PermissionCheckStore } from '@core/stores/permission-check.store';


@Component({
  selector: 'sga-reports',
  imports: [HeaderDetail, ReportCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportsPage {
  private dialog = inject(DialogModalService);
  private store = inject(ReportStore);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private permissionStore = inject(PermissionCheckStore);

  roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');
  headerConfig = computed(() => {
    const base = this.store.headerConfig();
    const roleType = this.roleType();
    if (roleType === 'teacher') {
      return {
        ...base,
        title: 'Mis reportes',
        subtitle: 'Consulta reportes académicos, asistencia y seguimiento de tus aulas.',
      };
    }
    if (roleType === 'student') {
      return {
        ...base,
        title: 'Mis reportes',
        subtitle: 'Revisa tus reportes académicos, asistencia y avances personales.',
      };
    }
    if (roleType === 'guardian') {
      return {
        ...base,
        title: 'Reportes del hogar',
        subtitle: 'Consulta reportes académicos y de asistencia de tus estudiantes vinculados.',
      };
    }
    return base;
  });
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );
  academicCount = computed(() => this.data().filter((item) => item.type === 'academic').length);
  attendanceCount = computed(() => this.data().filter((item) => item.type === 'attendance').length);
  financialCount = computed(() => this.data().filter((item) => item.type === 'payments').length);
  downloadableCount = computed(() => this.data().filter((item) => !!item.downloadUrl).length);

  onHeaderAction(e: { action: { key: string } }) {
    if (e.action.key === 'generate') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  viewDetail(report: Report) {
    this.router.navigate(['/reports', report.id], {
      state: { report },
    });
  }

  downloadReport(report: Report) {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  }

  editReport(report: Report) {
    this.openForm(report);
  }

  deleteReport(report: Report) {
    this.store.delete(report.id);
  }

  private openForm(current?: Report | null) {
    this.dialog.open(ReportForm, {
      data: { current: current ?? null },
      width: '520px',
      maxHeight: '80vh',
    });
  }
}
