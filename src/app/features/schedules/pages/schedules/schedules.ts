import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule } from '../../types/schedule-types';
import { ScheduleForm } from '../../components/schedule-form/schedule-form';
import { ScheduleCalendarComponent } from '../../components/schedule-calendar/schedule-calendar';
import { SchedulePlanner } from '../../components/schedule-planner/schedule-planner';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';
import { AuthStore } from '@auth/services/store/auth.store';


@Component({
  selector: 'sga-schedules',
  standalone: true,
  imports: [CommonModule, HeaderDetail, ScheduleCalendarComponent, FormsModule, SelectOptionComponent, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './schedules.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SchedulesPage {
  private dialog = inject(DialogModalService);
  private store = inject(ScheduleStore);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(DialogConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  searchTerm = signal('');
  sectionContextId = signal('');
  sectionContextName = signal('');
  courseContextId = signal('');
  courseContextName = signal('');
  teacherContextId = signal('');
  teacherContextName = signal('');
  sectionQuickFilterId = signal('');
  sectionQuickFilterName = signal('');
  gradeFilterId = signal('');
  teacherFilterId = signal('');
  readonly roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');
  readonly headerConfig = computed(() => {
    const base = this.store.headerConfig();
    const roleType = this.roleType();

    if (roleType === 'teacher') {
      return {
        ...base,
        title: 'Mi horario',
        subtitle: 'Consulta tus bloques, aulas y secciones asignadas durante la semana.',
      };
    }

    if (roleType === 'student') {
      return {
        ...base,
        title: 'Mi horario',
        subtitle: 'Consulta tus clases, aulas y distribución semanal.',
      };
    }

    if (roleType === 'guardian') {
      return {
        ...base,
        title: 'Horario del hogar',
        subtitle: 'Consulta el horario de clases de tus estudiantes vinculados.',
      };
    }

    return base;
  });
  readonly searchPlaceholder = computed(() => {
    const roleType = this.roleType();
    if (roleType === 'teacher') return 'Buscar por curso, sección o aula...';
    if (roleType === 'student') return 'Buscar en mi horario...';
    if (roleType === 'guardian') return 'Buscar por curso, sección o aula del hogar...';
    return 'Buscar por curso, sección o aula...';
  });
  readonly showTeacherFilter = computed(() => {
    const roleType = this.roleType();
    return roleType === 'admin' || roleType === 'superadmin' || roleType === 'director' || roleType === 'subdirector' || roleType === 'ugel';
  });
  readonly showAcademicFilters = computed(() => {
    const roleType = this.roleType();
    return roleType === 'teacher' || this.showTeacherFilter();
  });
  readonly canManagePlanning = computed(() => {
    const roleType = this.roleType();
    return roleType === 'admin' || roleType === 'superadmin' || roleType === 'director' || roleType === 'subdirector' || roleType === 'ugel';
  });
  readonly summaryCards = computed(() => {
    const list = this.filteredData();
    const classes = list.filter((item) => item.blockType !== 'break').length;
    const breaks = list.filter((item) => item.blockType === 'break').length;
    const teachers = new Set(
      list
        .map((item) => typeof item.sectionCourse === 'object' ? item.sectionCourse?.teacher?.id : null)
        .filter((value): value is string => Boolean(value)),
    ).size;
    const sections = new Set(
      list
        .map((item) => typeof item.sectionCourse === 'object' ? item.sectionCourse?.section?.id : null)
        .filter((value): value is string => Boolean(value)),
    ).size;

    return [
      { label: 'Bloques', value: list.length, tone: 'default' },
      { label: 'Clases', value: classes, tone: 'success' },
      { label: 'Recesos', value: breaks, tone: 'warning' },
      { label: 'Docentes', value: teachers || 0, tone: 'info' },
      { label: 'Secciones', value: sections || 0, tone: 'default' },
    ];
  });

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  data = computed(() => this.store.data());
  hasActiveFilters = computed(() => !!this.searchTerm().trim());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const sectionId = this.sectionQuickFilterId() || this.sectionContextId();
    const courseId = this.courseContextId();
    const teacherId = this.teacherFilterId() || this.teacherContextId();
    const gradeId = this.gradeFilterId();
    return list.filter((s) => {
      const teacherLabel =
        typeof s.sectionCourse === 'object'
          ? [s.sectionCourse?.teacher?.person?.firstName, s.sectionCourse?.teacher?.person?.lastName]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
          : '';
      const matchSearch =
        !search ||
        s.title?.toLowerCase().includes(search) ||
        s.classroom?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search) ||
        teacherLabel.includes(search) ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.course?.name?.toLowerCase().includes(search)) ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.section?.name?.toLowerCase().includes(search));
      const matchSection =
        !sectionId ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.section?.id === sectionId);
      const matchCourse =
        !courseId ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.course?.id === courseId);
      const matchTeacher =
        !teacherId ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.teacher?.id === teacherId);
      const matchGrade =
        !gradeId ||
        (typeof s.sectionCourse === 'object' && s.sectionCourse?.section?.grade?.id === gradeId);
      return matchSearch && matchSection && matchCourse && matchTeacher;
    }).filter((s) => {
      return !gradeId || (typeof s.sectionCourse === 'object' && s.sectionCourse?.section?.grade?.id === gradeId);
    });
  });

  loading = computed(() => this.store.loading());
  readonly sectionGroups = computed(() => {
    const groups = new Map<string, { id: string; gradeName: string; sectionName: string; total: number }>();

    for (const item of this.data()) {
      const sectionCourse = typeof item.sectionCourse === 'object' ? item.sectionCourse : null;
      const sectionId = sectionCourse?.section?.id;
      if (!sectionId) continue;

      const current = groups.get(sectionId);
      const gradeName = sectionCourse?.section?.grade?.name ?? 'Grado';
      const sectionName = sectionCourse?.section?.name ?? 'Sección';

      groups.set(sectionId, {
        id: sectionId,
        gradeName,
        sectionName,
        total: (current?.total ?? 0) + 1,
      });
    }

    return [...groups.values()].sort((a, b) =>
      `${a.gradeName} ${a.sectionName}`.localeCompare(`${b.gradeName} ${b.sectionName}`, 'es'),
    );
  });
  readonly gradeOptions = computed<SelectOption[]>(() => {
    const seen = new Map<string, string>();
    for (const item of this.data()) {
      const sectionCourse = typeof item.sectionCourse === 'object' ? item.sectionCourse : null;
      const grade = sectionCourse?.section?.grade;
      if (grade?.id) {
        seen.set(grade.id, grade.name ?? 'Grado');
      }
    }

    return [
      { value: '', label: 'Todos los grados' },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'))
        .map(([value, label]) => ({ value, label })),
    ];
  });
  readonly teacherOptions = computed<SelectOption[]>(() => {
    const seen = new Map<string, string>();
    for (const item of this.data()) {
      const sectionCourse = typeof item.sectionCourse === 'object' ? item.sectionCourse : null;
      const teacher = sectionCourse?.teacher;
      if (teacher?.id) {
        const name = [teacher.person?.firstName, teacher.person?.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode || 'Docente';
        seen.set(teacher.id, name);
      }
    }

    return [
      { value: '', label: 'Todos los docentes' },
      ...[...seen.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'))
        .map(([value, label]) => ({ value, label })),
    ];
  });
  readonly sectionFilterOptions = computed<SelectOption[]>(() => {
    const currentGradeId = this.gradeFilterId();
    const filtered = this.sectionGroups().filter((group) => {
      if (!currentGradeId) return true;
      const match = this.data().find((item) => {
        const sectionCourse = typeof item.sectionCourse === 'object' ? item.sectionCourse : null;
        return sectionCourse?.section?.id === group.id && sectionCourse?.section?.grade?.id === currentGradeId;
      });
      return Boolean(match);
    });

    return [
      { value: '', label: 'Todas las secciones' },
      ...filtered.map((group) => ({
        value: group.id,
        label: `${group.gradeName} · Sección ${group.sectionName}`,
      })),
    ];
  });
  readonly activeSectionGroupId = computed(() => this.sectionQuickFilterId() || this.sectionContextId());

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const sectionId = params.get('sectionId') ?? '';
      const sectionName = params.get('sectionName') ?? '';
      const courseId = params.get('courseId') ?? '';
      const courseName = params.get('courseName') ?? '';
      const teacherId = params.get('teacherId') ?? '';
      const teacherName = params.get('teacherName') ?? '';
      this.sectionContextId.set(sectionId);
      this.sectionContextName.set(sectionName);
      this.sectionQuickFilterId.set('');
      this.sectionQuickFilterName.set('');
      this.gradeFilterId.set('');
      this.teacherFilterId.set('');
      this.courseContextId.set(courseId);
      this.courseContextName.set(courseName);
      this.teacherContextId.set(teacherId);
      this.teacherContextName.set(teacherName);
      this.store.loadAll({
        ...(sectionId ? { sectionId } : {}),
        ...(courseId ? { courseId } : {}),
        ...(teacherId ? { teacherId } : {}),
      });
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  clearFilters() {
    this.searchTerm.set('');
  }

  onRefresh() {
    const sectionId = this.sectionContextId();
    const courseId = this.courseContextId();
    const teacherId = this.teacherContextId();
    this.store.loadAll({
      ...(sectionId ? { sectionId } : {}),
      ...(courseId ? { courseId } : {}),
      ...(teacherId ? { teacherId } : {}),
    });
  }

  editSchedule(schedule: Schedule) {
    this.openForm(schedule);
  }

  deleteSchedule(schedule: Schedule) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar horario',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${schedule.title}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) this.store.delete(schedule.id);
      });
  }

  clearSectionContext() {
    this.sectionQuickFilterId.set('');
    this.sectionQuickFilterName.set('');
    this.gradeFilterId.set('');
    this.teacherFilterId.set('');
    this.router.navigate(['/organization/schedules']);
  }

  selectSectionGroup(sectionId: string, label: string) {
    this.sectionQuickFilterId.set(sectionId);
    this.sectionQuickFilterName.set(label);
  }

  clearSectionQuickFilter() {
    this.sectionQuickFilterId.set('');
    this.sectionQuickFilterName.set('');
  }

  onGradeFilterChange(value: string) {
    this.gradeFilterId.set(value ?? '');
    this.sectionQuickFilterId.set('');
    this.sectionQuickFilterName.set('');
  }

  onTeacherFilterChange(value: string) {
    this.teacherFilterId.set(value ?? '');
  }

  onSectionFilterChange(value: string) {
    const next = value ?? '';
    if (!next) {
      this.clearSectionQuickFilter();
      return;
    }
    const option = this.sectionGroups().find((item) => item.id === next);
    this.selectSectionGroup(next, option ? `${option.gradeName} · Sección ${option.sectionName}` : 'Sección');
  }

  openForm(current?: Schedule | null) {
    const ref = this.dialog.open(ScheduleForm, {
      data: { current: current ?? null },
      width: '760px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  openPlanner() {
    const ref = this.dialog.open(SchedulePlanner, {
      width: '1200px',
      maxHeight: '90vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  printSchedules() {
    window.print();
  }
}
