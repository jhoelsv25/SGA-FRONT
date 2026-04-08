import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@auth/services/store/auth.store';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { TeacherApi } from '../../services/api/teacher-api';
import type { Teacher, TeacherCredential } from '../../types/teacher-types';
import { TeacherForm } from '../../components/teacher-form/teacher-form';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import type { SectionCourse } from '@features/section-courses/types/section-course-types';
import { ScheduleApi } from '@features/schedules/services/api/schedule-api';
import type { Schedule } from '@features/schedules/types/schedule-types';
import { TeacherAttendanceApi } from '../../services/api/teacher-attendance-api';
import type { TeacherAttendance } from '../../types/teacher-attendance-types';

@Component({
  selector: 'sga-teacher-detail',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
  ],
  templateUrl: './teacher-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeacherDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly teacherApi = inject(TeacherApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly scheduleApi = inject(ScheduleApi);
  private readonly teacherAttendanceApi = inject(TeacherAttendanceApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly teacher = signal<Teacher | null>((history.state?.teacher as Teacher | undefined) ?? null);
  readonly loading = signal(true);
  readonly assignments = signal<SectionCourse[]>([]);
  readonly schedules = signal<Schedule[]>([]);
  readonly attendances = signal<TeacherAttendance[]>([]);
  readonly credential = signal<TeacherCredential | null>(null);
  readonly credentialLoading = signal(false);
  readonly roleType = computed(() => this.authStore.currentUser()?.profile?.type ?? 'user');
  readonly isPublicViewer = computed(() => ['student', 'guardian'].includes(this.roleType()));
  readonly canViewOperational = computed(() => !this.isPublicViewer());

  readonly fullName = computed(() => {
    const person = this.person();
    return [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim() || this.teacher()?.teacherCode || '';
  });

  readonly latestAttendance = computed(() => this.attendances()[0] ?? null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/teachers/list']);
      return;
    }
    this.loadTeacher(id);
  }

  goBack(): void {
    this.router.navigate(['/teachers/list']);
  }

  openEdit(): void {
    const current = this.teacher();
    if (!current) return;
    this.dialog
      .open(TeacherForm, {
        data: { current },
        width: '720px',
        maxHeight: '80vh',
      })
      .closed.subscribe(() => this.reload());
  }

  regenerateCredential(): void {
    const teacher = this.teacher();
    if (!teacher) return;

    this.credentialLoading.set(true);
    this.teacherApi.regenerateCredential(teacher.id).subscribe({
      next: (res) => {
        this.credential.set(res.data);
        this.credentialLoading.set(false);
        this.toast.success('Carnet regenerado');
      },
      error: () => {
        this.credentialLoading.set(false);
        this.toast.error('No se pudo regenerar el carnet');
      },
    });
  }

  printCredential(): void {
    window.print();
  }

  goToAssignments(): void {
    const teacher = this.teacher();
    if (!teacher) return;
    this.router.navigate(['/organization/section-courses'], {
      queryParams: { teacherId: teacher.id, teacherName: this.fullName() || teacher.teacherCode },
    });
  }

  goToSchedules(): void {
    const teacher = this.teacher();
    if (!teacher) return;
    this.router.navigate(['/organization/schedules'], {
      queryParams: { teacherId: teacher.id, teacherName: this.fullName() || teacher.teacherCode },
    });
  }

  goToAttendances(): void {
    const teacher = this.teacher();
    if (!teacher) return;
    this.router.navigate(['/teachers/attendances'], {
      queryParams: { teacherId: teacher.id, teacherName: this.fullName() || teacher.teacherCode },
    });
  }

  contractLabel(): string {
    const value = this.teacher()?.contractType;
    const map: Record<string, string> = {
      full_time: 'Tiempo completo',
      part_time: 'Medio tiempo',
      temporary: 'Temporal',
      permanent: 'Permanente',
    };
    return map[value ?? ''] ?? (value || 'Sin contrato');
  }

  statusLabel(): string {
    const value = this.teacher()?.employmentStatus;
    const map: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      on_leave: 'Licencia',
    };
    return map[value ?? ''] ?? (value || 'Sin estado');
  }

  institutionName(): string {
    const institution = this.institution();
    return institution?.name ?? 'Sin institución';
  }

  teacherEmail(): string {
    return this.person()?.email ?? 'Sin correo';
  }

  teacherPhone(): string {
    return this.person()?.mobile ?? this.person()?.phone ?? 'Sin teléfono';
  }

  documentLabel(): string {
    const person = this.person();
    if (!person?.documentNumber) return 'Sin documento';
    const typeMap: Record<string, string> = {
      dni: 'DNI',
      passport: 'Pasaporte',
      other: 'Otro documento',
    };
    const type = typeMap[person.documentType ?? ''] ?? (person.documentType || 'Documento');
    return `${type}: ${person.documentNumber}`;
  }

  laborRegimeLabel(): string {
    const value = this.teacher()?.laborRegime;
    const map: Record<string, string> = {
      public: 'Público',
      private: 'Privado',
    };
    return map[value ?? ''] ?? (value || 'Sin régimen');
  }

  workloadLabel(): string {
    const value = this.teacher()?.workloadType;
    const map: Record<string, string> = {
      '20_hours': '20 horas',
      '30_hours': '30 horas',
      '40_hours': '40 horas',
    };
    return map[value ?? ''] ?? (value || 'Sin carga');
  }

  genderLabel(): string {
    const value = this.person()?.gender;
    const map: Record<string, string> = {
      MALE: 'Masculino',
      FEMALE: 'Femenino',
      OTHER: 'Otro',
    };
    return map[value ?? ''] ?? (value || 'No especificado');
  }

  locationLabel(): string {
    const person = this.person();
    return [person?.district, person?.province, person?.department].filter(Boolean).join(' · ') || 'Sin ubicación';
  }

  teacherAddress(): string {
    return this.person()?.address ?? 'Sin dirección registrada';
  }

  nationalityLabel(): string {
    return this.person()?.nationality ?? 'No especificada';
  }

  birthDateLabel(): string {
    const value = this.person()?.birthDate;
    if (!value) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  publicProfileSummary(): string {
    const current = this.teacher();
    if (!current) return '';
    return [
      current.professionalTitle,
      current.specialization,
      current.teachingLevel ? `Nivel ${current.teachingLevel}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  assignedCoursesPreview(): string {
    const items = this.assignments()
      .slice(0, 3)
      .map((item) => this.assignmentLabel(item))
      .filter(Boolean);
    if (!items.length) return 'Aún no hay cursos visibles para este docente.';
    return items.join(' · ');
  }

  latestAttendanceLabel(): string {
    const latest = this.latestAttendance();
    if (!latest) return 'Sin registros';
    const map: Record<string, string> = {
      present: 'Presente',
      late: 'Tardanza',
      absent: 'Falta',
      excused: 'Justificado',
    };
    return map[latest.status] ?? latest.status;
  }

  credentialPreviewLines(): string[] {
    const value = this.credential()?.qrValue ?? '';
    if (!value) return [];
    const compact = value.replace(/\s+/g, '');
    const chunkSize = 18;
    const lines: string[] = [];
    for (let index = 0; index < Math.min(compact.length, 126); index += chunkSize) {
      lines.push(compact.slice(index, index + chunkSize));
    }
    return lines.slice(0, 7);
  }

  assignmentLabel(item: SectionCourse): string {
    return [item.course?.name, item.section?.name].filter(Boolean).join(' · ') || 'Asignación sin detalle';
  }

  scheduleLabel(item: Schedule): string {
    const course = item.sectionCourse && typeof item.sectionCourse === 'object' ? item.sectionCourse.course?.name : '';
    const section = item.sectionCourse && typeof item.sectionCourse === 'object' ? item.sectionCourse.section?.name : '';
    return [course, section].filter(Boolean).join(' · ') || item.title;
  }

  private reload(): void {
    const id = this.teacher()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadTeacher(id);
  }

  private loadTeacher(id: string): void {
    this.loading.set(true);
    this.teacherApi.getById(id).subscribe({
      next: (res) => {
        this.teacher.set(res.data);
        this.loadRelatedData(id);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar el docente', { description: error?.message });
        this.router.navigate(['/teachers/list']);
      },
    });
  }

  private loadRelatedData(teacherId: string): void {
    this.sectionCourseApi.getAll({ teacherId }).subscribe({
      next: (res) => {
        this.assignments.set(res.data ?? []);
      },
    });

    this.scheduleApi.getAll({ teacherId }).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : [];
        this.schedules.set(list.slice(0, 6));
      },
    });

    this.teacherAttendanceApi.getAll({ teacher: teacherId }).subscribe({
      next: (res) => {
        const list = (res.data ?? []).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.attendances.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.attendances.set([]);
        this.loading.set(false);
      },
    });

    this.credentialLoading.set(true);
    this.teacherApi.getCredential(teacherId).subscribe({
      next: (res) => {
        this.credential.set(res.data);
        this.credentialLoading.set(false);
      },
      error: () => {
        this.credential.set(null);
        this.credentialLoading.set(false);
      },
    });
  }

  person(): Teacher['person'] extends string ? never : Exclude<Teacher['person'], string> | null {
    const value = this.teacher()?.person;
    return value && typeof value === 'object' ? value : null;
  }

  institution(): { id: string; name?: string } | null {
    const value = this.teacher()?.institution;
    return value && typeof value === 'object' ? value : null;
  }
}
