import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { GuardianApi } from '../../services/api/guardian-api';
import { StudentGuardian } from '../../types/guardian-types';
import { GUARDIAN_HEADER_CONFIG, GUARDIAN_COLUMN, GUARDIAN_ACTIONS } from '../../config/guardian.config';
import { StudentGuardianForm } from '../../components/student-guardian-form/student-guardian-form';
import { Toast } from '@core/services/toast';

@Component({
  selector: 'sga-guardians',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './guardians.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GuardiansPage implements OnInit {
  private dialog = inject(Dialog);
  private api = inject(GuardianApi);
  private toast = inject(Toast);

  headerConfig = GUARDIAN_HEADER_CONFIG;
  columns = GUARDIAN_COLUMN;
  private rowsSignal = signal<Record<string, unknown>[]>([]);
  private loadingSignal = signal(false);
  data = computed(() => this.rowsSignal());
  loading = computed(() => this.loadingSignal());
  pagination = computed(() => ({
    page: 1,
    size: 10,
    total: this.rowsSignal().length,
  }));
  headerActions = computed(() => GUARDIAN_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => GUARDIAN_ACTIONS.filter((a) => a.typeAction === 'row'));

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadingSignal.set(true);
    this.api.getStudentGuardians().subscribe({
      next: (res) => {
        const list = (res.data ?? []).map((sg) => {
          const g = sg as StudentGuardian;
          const studentName = g.student
            ? `${(g.student as { firstName?: string }).firstName ?? ''} ${(g.student as { lastName?: string }).lastName ?? ''}`.trim() ||
              (g.student as { studentCode?: string }).studentCode ||
              '-'
            : '-';
          const guardian = g.guardian as { person?: { firstName?: string; lastName?: string }; relationship?: string } | undefined;
          const guardianName = guardian?.person
            ? `${guardian.person.firstName ?? ''} ${guardian.person.lastName ?? ''}`.trim() || '-'
            : '-';
          return {
            id: g.id,
            studentGuardian: g,
            studentName,
            guardianName,
            relationship: guardian?.relationship ?? '-',
            isPrimary: g.isPrimary,
            emergencyContact: g.emergencyContact,
          };
        });
        this.rowsSignal.set(list);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.loadingSignal.set(false);
        this.toast.error('Error al cargar apoderados: ' + (err?.message ?? ''));
      },
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as { id: string; studentGuardian: StudentGuardian };
    if (e.action.key === 'edit') this.openForm(row.studentGuardian);
    if (e.action.key === 'delete') this.delete(row.id);
  }

  onPageChange() {}

  private openForm(current?: StudentGuardian | null) {
    const ref = this.dialog.open(StudentGuardianForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
    ref.closed.subscribe(() => this.loadAll());
  }

  private delete(id: string) {
    this.api.deleteStudentGuardian(id).subscribe({
      next: () => {
        this.rowsSignal.update((list) => list.filter((r) => (r as { id: string }).id !== id));
        this.toast.success('Vínculo eliminado');
      },
      error: (err) => this.toast.error('Error al eliminar: ' + (err?.message ?? '')),
    });
  }
}
