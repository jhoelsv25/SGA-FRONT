import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { SectionStore } from '../../services/store/section.store';
import type { Section } from '../../types/section-types';
import { SectionForm } from '../../components/section-form/section-form';
import { CommonModule } from '@angular/common';
import { SectionCardComponent } from '../../components/section-card/section-card';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';

const SHIFT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noche' },
];

@Component({
  selector: 'sga-sections',

  imports: [
    CommonModule,
    HeaderDetail,
    SectionCardComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    SelectOptionComponent,
    FormsModule,
    ZardInputDirective,
    ZardButtonComponent,
    ...ZardFormImports,
  ],
  templateUrl: './sections.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionsPage implements OnInit {
  private dialog = inject(DialogModalService);
  private store = inject(SectionStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(DialogConfirmService);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly shiftOptions = SHIFT_OPTIONS;
  searchTerm = signal('');
  filterShift = signal('');
  gradeContextId = signal('');
  gradeContextName = signal('');
  readonly canManageSections = computed(() =>
    this.permissionStore.hasAny('section:create', 'section:update', 'section:delete'),
  );
  readonly headerConfig = computed(() => this.store.headerConfig());

  headerActions = computed(() =>
    this.permissionStore.filterActions(
      this.store.actions().filter((a) => a.typeAction === 'header'),
    ),
  );

  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const shift = this.filterShift();
    const gradeId = this.gradeContextId();
    return list.filter((section) => {
      const matchSearch =
        !search ||
        section.name?.toLowerCase().includes(search) ||
        section.tutor?.toLowerCase().includes(search) ||
        section.classroom?.toLowerCase().includes(search);
      const matchShift = !shift || section.shift === shift;
      const sectionGradeId =
        typeof section.grade === 'object' ? section.grade?.id : section.gradeId;
      const matchGrade = !gradeId || sectionGradeId === gradeId;
      return matchSearch && matchShift && matchGrade;
    });
  });
  readonly filterCount = computed(() => (this.filterShift() ? 1 : 0));
  readonly hasActiveFilters = computed(() => !!this.searchTerm().trim() || !!this.filterShift());
  readonly groupedData = computed(() => {
    const groups = {
      morning: [] as Section[],
      afternoon: [] as Section[],
      evening: [] as Section[],
      unknown: [] as Section[],
    };

    for (const item of this.filteredData()) {
      if (item.shift === 'morning' || item.shift === 'afternoon' || item.shift === 'evening') {
        groups[item.shift].push(item);
      } else {
        groups.unknown.push(item);
      }
    }

    return [
      {
        key: 'morning',
        label: 'Turno mañana',
        description: 'Secciones activas durante la jornada de la mañana',
        items: groups.morning.sort((a, b) => a.name.localeCompare(b.name)),
      },
      {
        key: 'afternoon',
        label: 'Turno tarde',
        description: 'Secciones organizadas para la jornada de la tarde',
        items: groups.afternoon.sort((a, b) => a.name.localeCompare(b.name)),
      },
      {
        key: 'evening',
        label: 'Turno noche',
        description: 'Secciones programadas para la noche',
        items: groups.evening.sort((a, b) => a.name.localeCompare(b.name)),
      },
      {
        key: 'unknown',
        label: 'Sin turno definido',
        description: 'Secciones que todavía no tienen un turno claro asignado',
        items: groups.unknown.sort((a, b) => a.name.localeCompare(b.name)),
      },
    ].filter((group) => group.items.length > 0);
  });

  loading = computed(() => this.store.loading());

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.gradeContextId.set(params['gradeId'] ?? '');
      this.gradeContextName.set(params['gradeName'] ?? '');
      this.store.loadAll(params);
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterShift(value: unknown) {
    this.filterShift.set(value != null ? String(value) : '');
  }

  clearFilters() {
    this.searchTerm.set('');
    this.filterShift.set('');
  }

  onRefresh() {
    this.store.loadAll(this.route.snapshot.queryParams);
  }

  editSection(section: Section) {
    this.openForm(section);
  }

  goToSectionCourses(section: Section) {
    this.router.navigate(['/organization/section-courses'], {
      queryParams: { sectionId: section.id, sectionName: section.name },
    });
  }

  goToSchedules(section: Section) {
    this.router.navigate(['/organization/schedules'], {
      queryParams: { sectionId: section.id, sectionName: section.name },
    });
  }

  clearGradeContext() {
    this.router.navigate(['/organization/sections']);
  }

  deleteSection(section: Section) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar sección',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar la sección "${section.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(section.id);
        }
      });
  }

  createFromEmpty() {
    if (!this.canManageSections()) return;
    this.openForm();
  }

  openForm(current?: Section | null) {
    if (!this.canManageSections() && !current) return;
    const ref = this.dialog.open(SectionForm, {
      data: { current: current ?? null },
      width: '600px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
