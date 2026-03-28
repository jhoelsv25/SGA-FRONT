import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { CompetencyStore } from '../../services/store/competency.store';
import type { Competency } from '../../types/competency-types';
import { CompetencyForm } from '../../components/competency-form/competency-form';
import { CommonModule } from '@angular/common';
import { CompetencyCardComponent } from '../../components/competency-card/competency-card';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';


@Component({
  selector: 'sga-competencies',
  standalone: true,
  imports: [CommonModule, HeaderDetail, CompetencyCardComponent, ZardEmptyComponent, ZardSkeletonComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './competencies.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompetenciesPage implements OnInit {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  private store = inject(CompetencyStore);
  private permissionStore = inject(PermissionCheckStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  courseContextId = signal('');
  courseContextName = signal('');
  readonly canManageCompetencies = computed(() =>
    this.permissionStore.hasAny('competency:create', 'competency:update', 'competency:delete'),
  );
  headerConfig = computed(() => this.store.headerConfig());

  data = computed(() => this.store.data());

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const courseId = this.courseContextId();
    return list.filter(
      (c) =>
        (!search ||
          c.name.toLowerCase().includes(search) ||
          (c.code?.toLowerCase().includes(search) ?? false)) &&
        (!courseId || c.course?.id === courseId),
    );
  });
  hasActiveFilters = computed(() => !!this.searchTerm().trim());
  groupedData = computed(() => {
    const grouped = new Map<string, Competency[]>();
    for (const item of this.filteredData()) {
      const courseName = item.course?.name?.trim() || 'Sin curso asignado';
      const list = grouped.get(courseName) ?? [];
      list.push(item);
      grouped.set(courseName, list);
    }

    return Array.from(grouped.entries())
      .map(([courseName, items]) => ({
        key: courseName,
        label: courseName,
        description: courseName === 'Sin curso asignado' ? 'Competencias pendientes de vincular a un curso' : 'Competencias asociadas a este curso',
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const courseId = params.get('courseId') ?? '';
      const courseName = params.get('courseName') ?? '';
      this.courseContextId.set(courseId);
      this.courseContextName.set(courseName);
      this.store.loadAll(courseId ? { courseId } : {});
    });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  clearFilters() {
    this.searchTerm.set('');
  }

  loading = computed(() => this.store.loading());

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    const courseId = this.courseContextId();
    this.store.loadAll(courseId ? { courseId } : {});
  }

  editCompetency(competency: Competency) {
    this.openForm(competency);
  }

  deleteCompetency(competency: Competency) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar competencia',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${competency.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(competency.id).subscribe({
            next: () => this.onRefresh(),
          });
        }
      });
  }

  createFromEmpty() {
    if (!this.canManageCompetencies()) return;
    this.openForm();
  }

  clearCourseContext() {
    this.router.navigate(['/academic-setup/competencies']);
  }

  openForm(current?: Competency | null) {
    if (!this.canManageCompetencies() && !current) return;
    const ref = this.dialog.open(CompetencyForm, {
      data: { current: current ?? null },
      width: '560px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
