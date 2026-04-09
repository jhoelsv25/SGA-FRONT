import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AttendanceApi } from '../../../attendances/services/attendance-api';
import { AttendanceStore } from '../../../attendances/services/store/attendance.store';
import { AttendanceStatus } from '../../../attendances/types/attendance-types';
import { AttendanceImportDialog } from '../../components/attendance-import-dialog/attendance-import-dialog';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import type { SectionCourse } from '@features/section-courses/types/section-course-types';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { UiFiltersService } from '@core/services/ui-filters.service';
import { ActionConfig } from '@core/types/action-types';
import { HeaderConfig } from '@core/types/header-types';
import { SectionCourseSelect } from '@/shared/widgets/selects';
import { GeolocationService } from '@core/services/geolocation.service';
import { InstitutionStore } from '@features/admin-services/store/institution.store';

type StudentRow = {
  id: string;
  name: string;
  studentCode: string;
  status: AttendanceStatus;
  checkInTime?: string;
  observations?: string;
};

@Component({
  selector: 'sga-attendance-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderDetail, ZardInputDirective, ZardDatePickerComponent, SectionCourseSelect],
  templateUrl: './attendance-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceRegisterPage implements OnInit, OnDestroy {
  private readonly dialog = inject(DialogModalService);
  public readonly store = inject(AttendanceStore);
  private readonly attendanceApi = inject(AttendanceApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly toast = inject(Toast);
  private readonly filters = inject(UiFiltersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly geoService = inject(GeolocationService);
  private readonly institutionStore = inject(InstitutionStore);

  public selectedSectionCourse = signal('');
  public attendanceDate = signal('');
  public studentContextId = signal('');
  public studentContextName = signal('');
  public allowedSectionIds = signal<string[]>([]);
  public allowedSectionCourseIds = signal<string[]>([]);
  public sectionCourseOptions = signal<Array<{ value: string; label: string }>>([]);
  public students = signal<StudentRow[]>([]);
  public search = signal('');

  readonly selectedSectionLabel = computed(() => {
    const current = this.sectionCourseOptions().find(
      (option) => String(option.value ?? '') === this.selectedSectionCourse(),
    );
    return current?.label ?? 'Sin curso seleccionado';
  });
  readonly attendanceDateValue = computed(() => {
    const value = this.attendanceDate();
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  });

  readonly filteredStudents = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.students();
    return this.students().filter((student) =>
      student.name.toLowerCase().includes(term) || student.studentCode.toLowerCase().includes(term),
    );
  });

  readonly canSave = computed(() => Boolean(this.selectedSectionCourse()) && this.students().length > 0);
  readonly hasActiveFilters = computed(() =>
    Boolean(this.selectedSectionCourse() || this.filters.attendanceRegisterDate() || this.studentContextId()),
  );

  readonly presentCount = computed(() => this.students().filter((row) => row.status === 'present').length);
  readonly lateCount = computed(() => this.students().filter((row) => row.status === 'late').length);
  readonly absentCount = computed(() => this.students().filter((row) => row.status === 'absent').length);
  readonly excusedCount = computed(() => this.students().filter((row) => row.status === 'excused').length);

  readonly headerConfig = computed<HeaderConfig>(() => ({
    title: 'Registro de Asistencia',
    subtitle: this.studentContextId()
      ? `Asistencia focalizada para ${this.studentContextName() || 'estudiante seleccionado'}`
      : 'Marca asistencia por curso, fecha y estado en una sola vista.',
    icon: 'fa-clipboard-check',
    showFilters: true,
    showActions: true,
  }));

  readonly headerActions = computed<ActionConfig[]>(() => [
    {
      key: 'save',
      label: 'Guardar asistencia',
      icon: 'fa-solid fa-save',
      color: 'primary',
      typeAction: 'header',
      permissions: ['attendance:register'],
      disabled: !this.canSave() || this.store.loading(),
    },
    {
      key: 'import',
      label: 'Importar Excel',
      icon: 'fa-solid fa-file-excel',
      color: 'secondary',
      typeAction: 'header',
      permissions: ['attendance:import'],
      disabled: !this.selectedSectionCourse(),
    },
    {
      key: 'quick',
      label: 'Control de accesos',
      icon: 'fa-solid fa-qrcode',
      color: 'secondary',
      typeAction: 'header',
      permissions: ['attendance:quick-register'],
    },
  ]);

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    const initialDate = this.filters.attendanceRegisterDate() || today;
    this.attendanceDate.set(initialDate);
    this.filters.setAttendanceRegisterDate(initialDate);

    this.route.queryParamMap.subscribe((params) => {
      this.studentContextId.set(params.get('studentId') ?? '');
      this.studentContextName.set(params.get('studentName') ?? '');
      this.loadSectionCourses();
    });

    this.institutionStore.loadMain();
    this.geoService.startWatching();
  }

  ngOnDestroy(): void {
    this.geoService.stopWatching();
  }

  onHeaderAction(event: { action: ActionConfig }) {
    if (event.action.key === 'save') {
      this.saveAttendances();
      return;
    }

    if (event.action.key === 'import') {
      this.openImportWizard();
      return;
    }

    if (event.action.key === 'quick') {
      this.router.navigate(['/access-control']);
    }
  }

  private loadSectionCourses() {
    this.sectionCourseApi.getAll().subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        if (!this.studentContextId()) {
          this.allowedSectionIds.set([]);
          this.applySectionCourseOptions(list);
          return;
        }

        this.enrollmentApi.getAll({ size: 999 }).subscribe({
          next: (enrollmentRes) => {
            const allowedSectionIds = enrollmentRes.data
              .filter((enrollment) => enrollment.student?.id === this.studentContextId())
              .map((enrollment) => enrollment.section?.id)
              .filter((id): id is string => Boolean(id));

            this.allowedSectionIds.set(allowedSectionIds);
            const filteredSectionCourses = list.filter(
              (sectionCourse) =>
                !allowedSectionIds.length || allowedSectionIds.includes(sectionCourse.section?.id ?? ''),
            );
            this.applySectionCourseOptions(filteredSectionCourses);
          },
          error: () => {
            this.allowedSectionIds.set([]);
            this.applySectionCourseOptions(list);
          },
        });
      },
    });
  }

  private applySectionCourseOptions(list: SectionCourse[]) {
    this.allowedSectionCourseIds.set(list.map((sectionCourse) => sectionCourse.id));
    this.sectionCourseOptions.set(
      list.map((sectionCourse) => ({
        value: sectionCourse.id,
        label:
          sectionCourse.course?.name && sectionCourse.section?.name
            ? `${sectionCourse.course.name} - ${sectionCourse.section.name}`
            : sectionCourse.id.slice(0, 8),
      })),
    );

    const options = this.sectionCourseOptions();
    const saved = this.filters.attendanceRegisterSectionCourseId();
    const fallback = options[0]?.value?.toString() ?? '';
    const nextSection = saved && options.some((option) => option.value?.toString() === saved) ? saved : fallback;

    if (nextSection) {
      this.onSectionCourseChange(nextSection);
    } else {
      this.selectedSectionCourse.set('');
      this.students.set([]);
    }
  }

  onSectionCourseChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedSectionCourse.set(id);
    this.filters.setAttendanceRegisterSectionCourseId(id);
    if (id) {
      this.loadStudents(id);
    } else {
      this.students.set([]);
    }
  }

  onDateChange(): void {
    this.filters.setAttendanceRegisterDate(this.attendanceDate());
    const id = this.selectedSectionCourse();
    if (id) this.loadStudents(id);
  }

  onDatePicked(value: Date | string | null): void {
    if (!value) return;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return;
    this.attendanceDate.set(date.toISOString().slice(0, 10));
    this.onDateChange();
  }

  refreshData(): void {
    const id = this.selectedSectionCourse();
    if (id) {
      this.loadStudents(id);
    } else {
      this.loadSectionCourses();
    }
  }

  private loadStudents(sectionCourseId: string): void {
    this.enrollmentApi.getAll({ sectionCourse: sectionCourseId }).subscribe({
      next: (enrollmentRes) => {
        const rows: StudentRow[] = enrollmentRes.data
          .filter((enrollment) => !this.studentContextId() || enrollment.student?.id === this.studentContextId())
          .map((enrollment) => ({
            id: enrollment.id,
            studentCode: enrollment.student.studentCode,
            name:
              `${enrollment.student.person?.firstName || ''} ${enrollment.student.person?.lastName || ''}`.trim() ||
              enrollment.student.studentCode,
            status: 'present' as AttendanceStatus,
          }));

        this.students.set(rows);

        this.attendanceApi.getBySectionCourse(sectionCourseId, this.attendanceDate()).subscribe({
          next: (attendanceRes) => {
            if (attendanceRes.data.length > 0) {
              this.students.update((prev) =>
                prev.map((student) => {
                  const attendance = attendanceRes.data.find((row) => row.enrollmentId === student.id);
                  return attendance ? { ...student, status: attendance.status } : student;
                }),
              );
            }
          },
        });
      },
      error: () => this.toast.error('Error al cargar la lista de estudiantes'),
    });
  }

  updateStatus(studentId: string, status: AttendanceStatus): void {
    this.students.update((prev) => prev.map((student) => (student.id === studentId ? { ...student, status } : student)));
  }

  saveAttendances() {
    if (!this.selectedSectionCourse()) return;

    const inst = this.institutionStore.institution();
    const pos = this.geoService.currentPosition();
    let isWithinGeofence = true;
    
    if (inst && pos && inst.latitude !== undefined && inst.longitude !== undefined && inst.geofenceRadius !== undefined) {
      const distance = this.geoService.calculateDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        Number(inst.latitude),
        Number(inst.longitude)
      );
      isWithinGeofence = distance <= inst.geofenceRadius;
    }

    const request = {
      sectionCourseId: this.selectedSectionCourse(),
      date: this.attendanceDate(),
      sessionType: 'lecture',
      latitude: pos?.coords.latitude,
      longitude: pos?.coords.longitude,
      isWithinGeofence,
      attendances: this.students().map((student) => ({
        enrollmentId: student.id,
        status: student.status,
        checkInTime: student.checkInTime || new Date().toTimeString().slice(0, 8),
        observations: student.observations,
      })),
    };

    this.store.saveBulk(request).subscribe();
  }

  openImportWizard(): void {
    if (!this.selectedSectionCourse()) {
      this.toast.warning('Seleccione un curso antes de importar');
      return;
    }

    this.dialog.open(AttendanceImportDialog, {
      data: {
        onImport: (mappedData: { studentCode: string; status: AttendanceStatus; checkInTime?: string; observations?: string }[]) => {
          this.students.update((prev) => {
            const nextState = [...prev];
            mappedData.forEach((item) => {
              const index = nextState.findIndex((student) => student.studentCode === item.studentCode);
              if (index !== -1) {
                nextState[index] = { 
                  ...nextState[index], 
                  status: item.status,
                  checkInTime: item.checkInTime,
                  observations: item.observations
                };
              }
            });
            return nextState;
          });
          this.toast.success('Asistencias cargadas desde el archivo');
        },
      },
      width: '920px',
      maxHeight: '85vh',
    });
  }

  clearFilters(): void {
    this.filters.clearAttendanceRegisterFilters();
    const today = new Date().toISOString().split('T')[0];
    this.attendanceDate.set(today);
    this.selectedSectionCourse.set('');
    this.students.set([]);
    this.search.set('');
    this.filters.setAttendanceRegisterDate(today);
  }

  clearStudentContext(): void {
    this.router.navigate(['/attendance/register'], {
      queryParams: {
        studentId: null,
        studentName: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  studentInitials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusLabel(status: AttendanceStatus) {
    if (status === 'present') return 'Presente';
    if (status === 'late') return 'Tardanza';
    if (status === 'absent') return 'Falta';
    return 'Justificado';
  }

  statusBadgeClass(status: AttendanceStatus) {
    if (status === 'present') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15';
    if (status === 'late') return 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    if (status === 'absent') return 'bg-rose-500/10 text-rose-600 border-rose-500/15';
    return 'bg-sky-500/10 text-sky-600 border-sky-500/15';
  }

  statusButtonClass(currentStatus: AttendanceStatus, targetStatus: AttendanceStatus) {
    if (currentStatus === targetStatus) {
      if (targetStatus === 'present') return 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/15';
      if (targetStatus === 'late') return 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/15';
      if (targetStatus === 'absent') return 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/15';
      return 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/15';
    }

    if (targetStatus === 'present') return 'bg-base-100 text-base-content/55 border-base-300 hover:border-emerald-500 hover:text-emerald-600';
    if (targetStatus === 'late') return 'bg-base-100 text-base-content/55 border-base-300 hover:border-amber-500 hover:text-amber-600';
    if (targetStatus === 'absent') return 'bg-base-100 text-base-content/55 border-base-300 hover:border-rose-500 hover:text-rose-600';
    return 'bg-base-100 text-base-content/55 border-base-300 hover:border-sky-500 hover:text-sky-600';
  }
}
