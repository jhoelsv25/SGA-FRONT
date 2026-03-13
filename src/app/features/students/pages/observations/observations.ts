import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ObservationApi } from '../../services/api/observation-api';
import { StudentObservation } from '../../types/observation-types';
import { OBSERVATION_HEADER_CONFIG, OBSERVATION_COLUMN, OBSERVATION_ACTIONS } from '../../config/observation.config';
import { ObservationForm } from '../../components/observation-form/observation-form';
import { Toast } from '@core/services/toast';

@Component({
  selector: 'sga-observations',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './observations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ObservationsPage implements OnInit {
  private dialog = inject(DialogModalService);
  private api = inject(ObservationApi);
  private toast = inject(Toast);

  headerConfig = OBSERVATION_HEADER_CONFIG;
  columns = OBSERVATION_COLUMN;
  data = computed(() => this.rowsSignal());
  loading = computed(() => this.loadingSignal());
  pagination = computed(() => ({
    page: 1,
    size: 10,
    total: this.rowsSignal().length,
  }));
  headerActions = computed(() => OBSERVATION_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => OBSERVATION_ACTIONS.filter((a) => a.typeAction === 'row'));

  private rowsSignal = signal<Record<string, unknown>[]>([]);
  private loadingSignal = signal(false);

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadingSignal.set(true);
    this.api.getAll().subscribe({
      next: (res) => {
        const list = (res.data ?? []).map((obs) => {
          const o = obs as StudentObservation;
          const student = o.student as { firstName?: string; lastName?: string; studentCode?: string } | undefined;
          const studentName = student
            ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.studentCode || '-'
            : '-';
          const teacher = o.teacher as { teacherCode?: string } | undefined;
          return {
            id: o.id,
            observation: o,
            studentName,
            date: o.date,
            type: o.type,
            observationText: o.observation,
            teacherName: teacher?.teacherCode ?? '-',
          };
        });
        this.rowsSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.loadingSignal.set(false);
        this.toast.error('Error al cargar observaciones: ' + (err?.message ?? ''));
      },
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as { id: string; observation: StudentObservation };
    if (e.action.key === 'edit') this.openForm(row.observation);
    if (e.action.key === 'delete') this.delete(row.id);
  }

  onPageChange() {}

  private openForm(current?: StudentObservation | null) {
    const ref = this.dialog.open(ObservationForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
    });
    ref.closed.subscribe(() => this.loadAll());
  }

  private delete(id: string) {
    this.api.delete(id).subscribe({
      next: () => {
        this.rowsSignal.update((list) => list.filter((r) => (r as { id: string }).id !== id));
        this.toast.success('Observación eliminada');
      },
      error: (err) => this.toast.error('Error al eliminar: ' + (err?.message ?? '')),
    });
  }
}
