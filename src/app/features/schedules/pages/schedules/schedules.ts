import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule } from '../../types/schedule-types';
import { ScheduleForm } from '../../components/schedule-form/schedule-form';
import { ScheduleCalendarComponent } from '../../components/schedule-calendar/schedule-calendar';
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
  imports: [CommonModule, HeaderDetail, ScheduleCalendarComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
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

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  data = computed(() => this.store.data());
  hasActiveFilters = computed(() => !!this.searchTerm().trim());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const sectionId = this.sectionContextId();
    const courseId = this.courseContextId();
    const teacherId = this.teacherContextId();
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
      return matchSearch && matchSection && matchCourse && matchTeacher;
    });
  });

  loading = computed(() => this.store.loading());

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
    this.router.navigate(['/organization/schedules']);
  }

  openForm(current?: Schedule | null) {
    const ref = this.dialog.open(ScheduleForm, {
      data: { current: current ?? null },
      width: '760px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
