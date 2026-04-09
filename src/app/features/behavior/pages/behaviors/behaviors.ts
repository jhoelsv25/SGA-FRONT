import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorStore } from '../../services/store/behavior.store';
import { Behavior } from '../../types/behavior-types';
import { BehaviorForm } from '../../components/behavior-form/behavior-form';
import { UiFiltersService } from '@core/services/ui-filters.service';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ZardInputDirective } from '@/shared/components/input';
import { BehaviorCardComponent } from '../../components/behavior-card/behavior-card';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { Router } from '@angular/router';
import { AuthStore } from '@auth/services/store/auth.store';


@Component({
  selector: 'sga-behaviors',
  imports: [
    CommonModule,
    HeaderDetail,
    SelectOptionComponent,
    ZardInputDirective,
    BehaviorCardComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  templateUrl: './behaviors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BehaviorsPage {
  private dialog = inject(DialogModalService);
  private store = inject(BehaviorStore);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  public readonly filters = inject(UiFiltersService);

  roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');
  headerConfig = computed(() => {
    const base = this.store.headerConfig();
    const roleType = this.roleType();
    if (roleType === 'teacher') {
      return {
        ...base,
        title: 'Conducta de mis estudiantes',
        subtitle: 'Seguimiento de incidencias, logros y observaciones en tus aulas.',
      };
    }
    if (roleType === 'student') {
      return {
        ...base,
        title: 'Mi conducta',
        subtitle: 'Consulta observaciones, reconocimientos e incidencias asociadas a tu seguimiento.',
      };
    }
    if (roleType === 'guardian') {
      return {
        ...base,
        title: 'Conducta del hogar',
        subtitle: 'Revisa el seguimiento conductual de tus estudiantes vinculados.',
      };
    }
    return base;
  });
  data = computed(() => {
    const search = this.filters.behaviorSearch().toLowerCase();
    const type = this.filters.behaviorType();
    const severity = this.filters.behaviorSeverity();

    return this.store.data().filter((row) => {
      const matchesSearch =
        !search ||
        row.description?.toLowerCase().includes(search) ||
        row.studentName?.toLowerCase().includes(search) ||
        row.recordedBy?.toLowerCase().includes(search);
      const matchesType = !type || row.type === type;
      const matchesSeverity = !severity || row.severity === severity;
      return matchesSearch && matchesType && matchesSeverity;
    });
  });
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  hasActiveFilters = computed(() => this.activeFiltersCount() > 0);
  activeFiltersCount = computed(() =>
    [this.filters.behaviorSearch(), this.filters.behaviorType(), this.filters.behaviorSeverity()].filter(Boolean)
      .length
  );
  incidentCount = computed(() => this.data().filter((item) => item.type === 'negative').length);
  achievementCount = computed(() => this.data().filter((item) => item.type === 'positive').length);
  criticalCount = computed(() => this.data().filter((item) => item.severity === 'critical' || item.severity === 'high').length);
  observedCount = computed(() => this.data().filter((item) => item.type === 'negative' && item.severity === 'low').length);

  typeOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos' },
    { value: 'negative', label: 'Incidencia' },
    { value: 'positive', label: 'Logro' }]);

  severityOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todas' },
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }]);

  onSearch(value: string): void {
    this.filters.setBehaviorSearch(value);
  }

  onTypeChange(value: unknown): void {
    this.filters.setBehaviorType(String(value ?? ''));
  }

  onSeverityChange(value: unknown): void {
    this.filters.setBehaviorSeverity(String(value ?? ''));
  }

  onHeaderAction(e: { action: { key: string } }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  viewDetail(behavior: Behavior): void {
    this.router.navigate(['/behavior', behavior.id], {
      state: { behavior },
    });
  }

  editBehavior(behavior: Behavior): void {
    this.openForm(behavior);
  }

  deleteBehavior(behavior: Behavior): void {
    this.store.delete(behavior.id);
  }

  onRefresh(): void {
    this.store.loadAll();
  }

  clearFilters(): void {
    this.filters.clearBehaviorFilters();
  }

  openCreate(): void {
    this.openForm();
  }

  private openForm(current?: Behavior | null) {
    this.dialog.open(BehaviorForm, {
      data: { current: current ?? null },
      width: '520px',
      maxHeight: '80vh',
    });
  }
}
