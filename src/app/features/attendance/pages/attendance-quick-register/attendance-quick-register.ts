import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { ZardInputDirective } from '@/shared/components/input';
import { SectionCourseSelect } from '@/shared/widgets/selects';
import { Toast } from '@core/services/toast';
import { AttendanceApi } from '../../../attendances/services/attendance-api';
import { AttendanceStatus } from '../../../attendances/types/attendance-types';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import { TeacherAttendanceStatus } from '@features/teachers/types/teacher-attendance-types';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import { SectionCourse } from '@features/section-courses/types/section-course-types';
import { EnrollmentApi } from '@features/enrollments/services/enrollment-api';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

type QuickMode = 'general' | 'student' | 'teacher';
import { GeolocationService } from '@core/services/geolocation.service';
import { InstitutionStore } from '@features/admin-services/store/institution.store';
import { OnDestroy } from '@angular/core';

type QuickStudentCatalog = {
  enrollmentId: string;
  code: string;
  name: string;
};

type QuickTeacherCatalog = {
  teacherId: string;
  code: string;
  name: string;
  specialization?: string;
};

type QuickEntry = {
  id: string;
  code: string;
  name: string;
  status: AttendanceStatus | TeacherAttendanceStatus;
  checkInTime: string;
  scope: QuickMode;
  enrollmentId?: string;
  teacherId?: string;
  meta?: string;
};

type LastRegisteredEntry = QuickEntry & {
  registeredAt: string;
};

@Component({
  selector: 'sga-attendance-quick-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderDetail, ZardInputDirective, SectionCourseSelect],
  templateUrl: './attendance-quick-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceQuickRegisterPage implements OnInit, OnDestroy {
  private readonly attendanceApi = inject(AttendanceApi);
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly toast = inject(Toast);
  private readonly route = inject(ActivatedRoute);
  private readonly geoService = inject(GeolocationService);
  private readonly institutionStore = inject(InstitutionStore);

  private pendingAutoCode: string | null = null;

  readonly mode = signal<QuickMode>('student');
  readonly date = signal(this.toLocalDate(new Date()));
  readonly sectionCourseId = signal('');
  readonly scanCode = signal('');
  readonly studentCatalog = signal<QuickStudentCatalog[]>([]);
  readonly teacherCatalog = signal<QuickTeacherCatalog[]>([]);
  readonly entries = signal<QuickEntry[]>([]);
  readonly search = signal('');
  readonly saving = signal(false);
  readonly lastRegistered = signal<LastRegisteredEntry | null>(null);

  readonly headerConfig = computed<HeaderConfig>(() => ({
    title: 'Registro rápido',
    subtitle:
      this.mode() === 'student'
        ? 'Escanea o escribe el código del alumno y arma el lote del curso.'
        : this.mode() === 'teacher'
          ? 'Escanea o escribe el código del docente y arma el lote del personal.'
          : 'Escanea código o código de barras y el sistema intentará resolver si pertenece a un alumno o docente.',
    icon: 'fa-qrcode',
    showFilters: true,
    showActions: true,
  }));

  readonly headerActions = computed<ActionConfig[]>(() => [
    {
      key: 'save',
      label:
        this.mode() === 'student'
          ? 'Guardar estudiantes'
          : this.mode() === 'teacher'
            ? 'Guardar docentes'
            : 'Guardar lote general',
      icon: 'fa-solid fa-save',
      color: 'primary',
      typeAction: 'header',
      disabled:
        !this.entries().length ||
        this.saving() ||
        ((this.mode() === 'student' || this.hasStudentEntries()) && !this.sectionCourseId()),
      visible: this.mode() !== 'general',
    },
    {
      key: 'clear',
      label: 'Vaciar lote',
      icon: 'fa-solid fa-trash',
      color: 'secondary',
      typeAction: 'header',
      disabled: !this.entries().length,
      visible: this.mode() !== 'general',
    },
  ]);

  readonly filteredEntries = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.entries();
    return this.entries().filter(
      (entry) => entry.name.toLowerCase().includes(term) || entry.code.toLowerCase().includes(term),
    );
  });

  readonly presentCount = computed(() => this.entries().filter((entry) => entry.status === 'present').length);
  readonly lateCount = computed(() => this.entries().filter((entry) => entry.status === 'late').length);
  readonly absentCount = computed(() => this.entries().filter((entry) => entry.status === 'absent').length);
  readonly excusedCount = computed(() => this.entries().filter((entry) => entry.status === 'excused').length);

  readonly selectedSectionLabel = computed(() => {
    const sectionCourse = this.studentCatalogSectionCourse();
    if (!sectionCourse) return 'Sin curso seleccionado';
    return sectionCourse.course?.name && sectionCourse.section?.name
      ? `${sectionCourse.course.name} - ${sectionCourse.section.name}`
      : sectionCourse.id;
  });
  readonly studentCatalogSectionCourse = signal<SectionCourse | null>(null);

  constructor() {
    effect(() => {
      if (this.mode() === 'teacher') {
        this.sectionCourseId.set('');
        this.studentCatalog.set([]);
      }
      this.entries.set([]);
      this.scanCode.set('');
    });
  }

  ngOnInit(): void {
    this.loadSectionCourses();
    this.loadTeachers();
    this.route.queryParamMap.subscribe((params) => {
      const mode = this.normalizeMode(params.get('mode'));
      const date = params.get('date')?.slice(0, 10) ?? '';
      const sectionCourseId = params.get('sectionCourseId') ?? '';
      const code = params.get('code') ?? '';

      if (mode) {
        this.mode.set(mode);
      }
      if (date) {
        this.date.set(date);
      }

      if ((mode ?? this.mode()) === 'student' && sectionCourseId) {
        this.onSectionCourseChange(sectionCourseId, code || undefined);
        return;
      }

      if (code) {
        this.pendingAutoCode = code;
        this.tryAutoSubmit();
      }
    });

    this.institutionStore.loadMain();
    this.geoService.startWatching();
  }

  ngOnDestroy(): void {
    this.geoService.stopWatching();
  }

  onHeaderAction(event: { action: ActionConfig }) {
    if (event.action.key === 'save') {
      this.saveEntries();
      return;
    }
    if (event.action.key === 'clear') {
      this.entries.set([]);
      this.toast.info('Lote limpiado');
    }
  }

  loadSectionCourses() {
    return;
  }

  loadTeachers() {
    this.teacherAttendanceApi.getTeachers().subscribe({
      next: (res) => {
        this.teacherCatalog.set(
          (res.data ?? []).map((teacher) => ({
            teacherId: teacher.id,
            code: teacher.teacherCode,
            name: [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || teacher.teacherCode,
            specialization: teacher.specialization,
          })),
        );
        this.tryAutoSubmit();
      },
    });
  }

  onModeChange(mode: QuickMode) {
    this.mode.set(mode);
  }

  onSectionCourseChange(value: unknown, autoCode?: string) {
    const sectionCourseId = String(value ?? '');
    this.sectionCourseId.set(sectionCourseId);
    this.entries.set([]);
    if (!sectionCourseId) {
      this.studentCatalog.set([]);
      this.studentCatalogSectionCourse.set(null);
      return;
    }

    this.sectionCourseApi.getById(sectionCourseId).subscribe({
      next: (sectionCourse) => this.studentCatalogSectionCourse.set(sectionCourse),
      error: () => this.studentCatalogSectionCourse.set(null),
    });

    this.enrollmentApi.getAll({ sectionCourse: sectionCourseId, size: 999 }).subscribe({
      next: (res) => {
        this.studentCatalog.set(
          (res.data ?? []).map((enrollment) => ({
            enrollmentId: enrollment.id,
            code: enrollment.student.studentCode,
            name:
              `${enrollment.student.person?.firstName ?? enrollment.student.firstName ?? ''} ${enrollment.student.person?.lastName ?? enrollment.student.lastName ?? ''}`.trim() ||
              enrollment.student.studentCode,
          })),
        );
        if (autoCode) {
          this.pendingAutoCode = autoCode;
        }
        this.tryAutoSubmit();
      },
      error: () => {
        this.studentCatalog.set([]);
        this.toast.error('No se pudo cargar el padrón del curso');
      },
    });
  }

  submitCode(rawValue?: string) {
    const rawInput = String(rawValue ?? this.scanCode()).trim();
    if (!rawInput) return;

    const payload = this.parseQuickPayload(rawInput);
    if (payload.mode) {
      this.mode.set(payload.mode);
    }
    if (payload.date) {
      this.date.set(payload.date);
    }

    const resolvedMode = payload.mode ?? this.mode();
    const resolvedCode = (payload.code ?? rawInput).trim();
    const nextSectionCourseId = payload.sectionCourseId ?? this.sectionCourseId();

    if (resolvedMode === 'student' && payload.sectionCourseId && payload.sectionCourseId !== this.sectionCourseId()) {
      this.scanCode.set(resolvedCode);
      this.onSectionCourseChange(payload.sectionCourseId, resolvedCode);
      return;
    }

    if (resolvedMode === 'student') {
      if (!nextSectionCourseId) {
        this.toast.warning('Selecciona un curso antes de escanear alumnos');
        return;
      }
      const match = this.studentCatalog().find((student) => student.code.toLowerCase() === resolvedCode.toLowerCase());
      if (!match) {
        this.toast.error('No se encontró un estudiante con ese código en el curso seleccionado');
        return;
      }
      this.pushEntry({
        id: `student-${match.enrollmentId}`,
        code: match.code,
        name: match.name,
        status: 'present',
        checkInTime: this.currentTime(),
        scope: 'student',
        enrollmentId: match.enrollmentId,
      });
      this.scanCode.set('');
      return;
    }

    if (resolvedMode === 'general') {
      const teacherMatch = this.teacherCatalog().find((teacher) => teacher.code.toLowerCase() === resolvedCode.toLowerCase());
      if (teacherMatch) {
        this.registerGeneralEntry({
          id: `teacher-${teacherMatch.teacherId}`,
          code: teacherMatch.code,
          name: teacherMatch.name,
          status: 'present',
          checkInTime: this.currentTime(),
          scope: 'teacher',
          teacherId: teacherMatch.teacherId,
          meta: teacherMatch.specialization || 'Docente detectado por código o barcode',
        });
        this.scanCode.set('');
        return;
      }

      if (!nextSectionCourseId) {
        this.toast.warning('Para asistencia general de alumnos, selecciona un curso antes de escanear.');
        return;
      }

      const studentMatch = this.studentCatalog().find((student) => student.code.toLowerCase() === resolvedCode.toLowerCase());
      if (!studentMatch) {
        this.toast.error('No se encontró coincidencia con docente o alumno para ese código o barcode.');
        return;
      }

      this.registerGeneralEntry({
        id: `student-${studentMatch.enrollmentId}`,
        code: studentMatch.code,
        name: studentMatch.name,
        status: 'present',
        checkInTime: this.currentTime(),
        scope: 'student',
        enrollmentId: studentMatch.enrollmentId,
        meta: `Alumno detectado en ${this.selectedSectionLabel()}`,
      });
      this.scanCode.set('');
      return;
    }

    const match = this.teacherCatalog().find((teacher) => teacher.code.toLowerCase() === resolvedCode.toLowerCase());
    if (!match) {
      this.toast.error('No se encontró un docente con ese código');
      return;
    }
    this.pushEntry({
      id: `teacher-${match.teacherId}`,
      code: match.code,
      name: match.name,
      status: 'present',
      checkInTime: this.currentTime(),
      scope: 'teacher',
      teacherId: match.teacherId,
      meta: match.specialization,
    });
    this.scanCode.set('');
  }

  private tryAutoSubmit() {
    if (!this.pendingAutoCode) return;

    if (this.mode() === 'student') {
      if (!this.sectionCourseId() || !this.studentCatalog().length) return;
    } else if (!this.teacherCatalog().length) {
      return;
    }

    const nextCode = this.pendingAutoCode;
    this.pendingAutoCode = null;
    this.submitCode(nextCode);
  }

  private parseQuickPayload(rawInput: string): {
    mode?: QuickMode;
    code?: string;
    date?: string;
    sectionCourseId?: string;
  } {
    const raw = rawInput.trim();
    if (!raw) return {};

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw) as {
          type?: string;
          teacherCode?: string;
        };
        if (parsed.type === 'teacher_credential' && parsed.teacherCode) {
          return { mode: 'teacher', code: parsed.teacherCode };
        }
      } catch {
        return {};
      }
    }

    const maybeUrl = this.resolveQuickUrl(raw);
    if (!maybeUrl) return {};

    return {
      mode: this.normalizeMode(maybeUrl.searchParams.get('mode')),
      code: maybeUrl.searchParams.get('code') ?? undefined,
      date: maybeUrl.searchParams.get('date')?.slice(0, 10) ?? undefined,
      sectionCourseId: maybeUrl.searchParams.get('sectionCourseId') ?? undefined,
    };
  }

  private resolveQuickUrl(raw: string): URL | null {
    try {
      if (/^https?:\/\//i.test(raw)) {
        return new URL(raw);
      }
      if (raw.startsWith('/attendance/quick-register')) {
        return new URL(raw, window.location.origin);
      }
      if (raw.startsWith('?')) {
        return new URL(`/attendance/quick-register${raw}`, window.location.origin);
      }
      if (raw.includes('mode=') && raw.includes('code=')) {
        return new URL(`/attendance/quick-register?${raw.replace(/^\?/, '')}`, window.location.origin);
      }
      return null;
    } catch {
      return null;
    }
  }

  private normalizeMode(value: string | null): QuickMode | undefined {
    return value === 'teacher' || value === 'student' || value === 'general' ? value : undefined;
  }

  private toLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private pushEntry(entry: QuickEntry) {
    this.entries.update((current) => {
      const existingIndex = current.findIndex((item) => item.id === entry.id);
      if (existingIndex === -1) {
        return [entry, ...current];
      }

      const next = [...current];
      next[existingIndex] = { ...next[existingIndex], checkInTime: this.currentTime() };
      return next;
    });
    this.toast.success(`${entry.name} agregado al lote`);
  }

  private registerGeneralEntry(entry: QuickEntry) {
    if (this.saving()) return;

    this.saving.set(true);
    const inst = this.institutionStore.institution();
    const pos = this.geoService.currentPosition();
    let isWithinGeofence = true;

    if (inst && pos && inst.latitude !== undefined && inst.longitude !== undefined && inst.geofenceRadius !== undefined) {
      const distance = this.geoService.calculateDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        Number(inst.latitude),
        Number(inst.longitude),
      );
      isWithinGeofence = distance <= inst.geofenceRadius;
    }

    if (entry.scope === 'student') {
      this.attendanceApi
        .saveBulk({
          sectionCourseId: this.sectionCourseId(),
          date: this.date(),
          sessionType: 'lecture',
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          isWithinGeofence,
          attendances: [
            {
              enrollmentId: entry.enrollmentId!,
              status: entry.status as AttendanceStatus,
              checkInTime: entry.checkInTime,
            },
          ],
        })
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.scanCode.set('');
            this.lastRegistered.set({
              ...entry,
              registeredAt: this.currentTime(),
            });
            this.toast.success(res.message || `${entry.name} registrado correctamente`);
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('No se pudo registrar la asistencia del alumno');
          },
        });
      return;
    }

    this.teacherAttendanceApi
      .registerBulk({
        date: this.date(),
        latitude: pos?.coords.latitude,
        longitude: pos?.coords.longitude,
        isWithinGeofence,
        attendances: [
          {
            teacherCode: entry.code,
            status: entry.status as TeacherAttendanceStatus,
            checkInTime: entry.checkInTime,
          },
        ],
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.scanCode.set('');
          this.lastRegistered.set({
            ...entry,
            registeredAt: this.currentTime(),
          });
          this.toast.success(res.message || `${entry.name} registrado correctamente`);
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No se pudo registrar la asistencia del docente');
        },
      });
  }

  updateEntryStatus(entryId: string, status: AttendanceStatus | TeacherAttendanceStatus) {
    this.entries.update((current) =>
      current.map((entry) => (entry.id === entryId ? { ...entry, status } : entry)),
    );
  }

  removeEntry(entryId: string) {
    this.entries.update((current) => current.filter((entry) => entry.id !== entryId));
  }

  saveEntries() {
    if (!this.entries().length) return;

    this.saving.set(true);
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

    if (this.mode() === 'student') {
      this.attendanceApi
        .saveBulk({
          sectionCourseId: this.sectionCourseId(),
          date: this.date(),
          sessionType: 'lecture',
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          isWithinGeofence,
          attendances: this.entries().map((entry) => ({
            enrollmentId: entry.enrollmentId!,
            status: entry.status as AttendanceStatus,
            checkInTime: entry.checkInTime,
          })),
        })
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.entries.set([]);
            this.toast.success(res.message || 'Asistencias guardadas');
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('No se pudo guardar el lote de estudiantes');
          },
        });
      return;
    }

    if (this.mode() === 'teacher') {
      this.teacherAttendanceApi
        .registerBulk({
          date: this.date(),
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          isWithinGeofence,
          attendances: this.entries().map((entry) => ({
            teacherCode: entry.code,
            status: entry.status as TeacherAttendanceStatus,
            checkInTime: entry.checkInTime,
          })),
        })
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.entries.set([]);
            this.toast.success(res.message || 'Asistencias guardadas');
          },
          error: () => {
            this.saving.set(false);
            this.toast.error('No se pudo guardar el lote de docentes');
          },
        });
      return;
    }

    const studentEntries = this.entries().filter((entry) => entry.scope === 'student');
    const teacherEntries = this.entries().filter((entry) => entry.scope === 'teacher');
    const requests = [];

    if (studentEntries.length) {
      requests.push(
        this.attendanceApi.saveBulk({
          sectionCourseId: this.sectionCourseId(),
          date: this.date(),
          sessionType: 'lecture',
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          isWithinGeofence,
          attendances: studentEntries.map((entry) => ({
            enrollmentId: entry.enrollmentId!,
            status: entry.status as AttendanceStatus,
            checkInTime: entry.checkInTime,
          })),
        }),
      );
    }

    if (teacherEntries.length) {
      requests.push(
        this.teacherAttendanceApi.registerBulk({
          date: this.date(),
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          isWithinGeofence,
          attendances: teacherEntries.map((entry) => ({
            teacherCode: entry.code,
            status: entry.status as TeacherAttendanceStatus,
            checkInTime: entry.checkInTime,
          })),
        }),
      );
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.saving.set(false);
        this.entries.set([]);
        this.toast.success('Asistencia general guardada correctamente');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudo guardar el lote general');
      },
    });
  }

  hasStudentEntries() {
    return this.entries().some((entry) => entry.scope === 'student');
  }

  currentTime() {
    return new Date().toTimeString().slice(0, 8);
  }

  statusLabel(status: AttendanceStatus | TeacherAttendanceStatus) {
    if (status === 'present') return 'Presente';
    if (status === 'late') return 'Tardanza';
    if (status === 'absent') return 'Falta';
    return 'Justificado';
  }

  statusBadgeClass(status: AttendanceStatus | TeacherAttendanceStatus) {
    if (status === 'present') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15';
    if (status === 'late') return 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    if (status === 'absent') return 'bg-rose-500/10 text-rose-600 border-rose-500/15';
    return 'bg-sky-500/10 text-sky-600 border-sky-500/15';
  }

  statusButtonClass(currentStatus: AttendanceStatus | TeacherAttendanceStatus, targetStatus: AttendanceStatus | TeacherAttendanceStatus) {
    if (currentStatus === targetStatus) {
      if (targetStatus === 'present') return 'bg-emerald-500 text-white border-emerald-500';
      if (targetStatus === 'late') return 'bg-amber-500 text-white border-amber-500';
      if (targetStatus === 'absent') return 'bg-rose-500 text-white border-rose-500';
      return 'bg-sky-500 text-white border-sky-500';
    }
    return 'bg-base-100 text-base-content/55 border-base-300 hover:border-primary/20 hover:text-primary';
  }
}
