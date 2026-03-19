import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { SubjectAreaStore } from '../../services/store/subject-area.store';
import { SubjectArea } from '../../types/subject-area-types';
import { SubjectAreaForm } from '../../components/subject-area-form/subject-area-form';
import { CommonModule } from '@angular/common';
import { SubjectAreaCardComponent } from '../../components/subject-area-card/subject-area-card';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'core', label: 'Troncal' },
  { value: 'elective', label: 'Electiva' },
  { value: 'optional', label: 'Opcional' }];


@Component({
  selector: 'sga-subject-areas',
  standalone: true,
  imports: [CommonModule, HeaderDetail, SubjectAreaCardComponent, ZardEmptyComponent, ZardSkeletonComponent, SelectOptionComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './subject-areas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SubjectAreasPage {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  private store = inject(SubjectAreaStore);
  private permissionStore = inject(PermissionCheckStore);
  private router = inject(Router);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly typeOptions = TYPE_OPTIONS;
  searchTerm = signal('');
  filterType = signal<string>('');
  readonly canManageSubjectAreas = computed(() => this.permissionStore.has('manage_subject_area'));
  headerConfig = computed(() => this.store.headerConfig());

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    return list.filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search) ||
        (a.code?.toLowerCase().includes(search) ?? false);
      const matchType = !type || a.type === type;
      return matchSearch && matchType;
    });
  });

  filterCount = computed(() => (this.filterType() ? 1 : 0));
  hasActiveFilters = computed(() => !!this.searchTerm().trim() || !!this.filterType());
  groupedData = computed(() => {
    const groups = {
      core: [] as SubjectArea[],
      elective: [] as SubjectArea[],
      optional: [] as SubjectArea[],
    };

    for (const item of this.filteredData()) {
      if (item.type && item.type in groups) {
        groups[item.type as keyof typeof groups].push(item);
      }
    }

    return [
      { key: 'core', label: 'Troncales', description: 'Áreas base y obligatorias del plan curricular', items: groups.core.sort((a, b) => a.name.localeCompare(b.name)) },
      { key: 'elective', label: 'Electivas', description: 'Áreas opcionales orientadas a profundización', items: groups.elective.sort((a, b) => a.name.localeCompare(b.name)) },
      { key: 'optional', label: 'Opcionales', description: 'Áreas complementarias o flexibles', items: groups.optional.sort((a, b) => a.name.localeCompare(b.name)) },
    ].filter(group => group.items.length > 0);
  });

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterType(value: unknown) {
    this.filterType.set(value != null ? String(value) : '');
  }

  clearFilters() {
    this.searchTerm.set('');
    this.filterType.set('');
  }

  loading = computed(() => this.store.loading());

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.load({});
  }

  editSubjectArea(area: SubjectArea) {
    this.openForm(area);
  }

  goToCourses(area: SubjectArea) {
    this.router.navigate(['/academic-setup/courses'], {
      queryParams: { subjectAreaId: area.id, subjectAreaName: area.name },
    });
  }

  deleteSubjectArea(area: SubjectArea) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar área curricular',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${area.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(area.id);
        }
      });
  }

  createFromEmpty() {
    if (!this.canManageSubjectAreas()) return;
    this.openForm();
  }

  openForm(current?: SubjectArea | null) {
    if (!this.canManageSubjectAreas() && !current) return;
    const ref = this.dialog.open(SubjectAreaForm, {
      data: { current: current ?? null },
      width: '520px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
