import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ScheduleApi } from '../../services/api/schedule-api';
import { Schedule, ScheduleCreate } from '../../types/schedule-types';
import { TeacherApi } from '@features/teachers/services/api/teacher-api';
import { Teacher } from '@features/teachers/types/teacher-types';
import { SectionCourseApi } from '@features/section-courses/services/section-course-api';
import { SectionCourse } from '@features/section-courses/types/section-course-types';
import { Toast } from '@core/services/toast';

type PlannerDraft = {
  key: string;
  title: string;
  sectionCourseId: string;
  teacherId: string;
  teacherName: string;
  specialization: string;
  sectionName: string;
  courseName: string;
  dayOfWeek: Schedule['dayOfWeek'];
  startAt: string;
  durationMinutes: number;
  endAt: string;
  classroom: string;
};

type OccupiedSlot = {
  dayOfWeek: Schedule['dayOfWeek'];
  startAt: string;
  endAt: string;
  teacherId?: string | null;
  sectionId?: string | null;
};

const DAY_OPTIONS: SelectOption[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
];

const QUICK_STARTS = ['07:00', '07:45', '08:30', '09:15', '10:15', '11:00', '11:45', '14:00', '14:45', '15:30', '16:15', '17:00'];

@Component({
  selector: 'sga-schedule-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './schedule-planner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePlanner implements OnInit {
  private readonly ref = inject(ZardDialogRef);
  private readonly data = inject(Z_MODAL_DATA, { optional: true });
  private readonly scheduleApi = inject(ScheduleApi);
  private readonly teacherApi = inject(TeacherApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly toast = inject(Toast);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly selectedTeacherId = signal('');
  readonly teachers = signal<Teacher[]>([]);
  readonly schedules = signal<Schedule[]>([]);
  readonly sectionCourses = signal<SectionCourse[]>([]);
  readonly drafts = signal<PlannerDraft[]>([]);

  readonly teacherOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos los docentes' },
    ...this.teachers().map((teacher) => ({
      value: teacher.id,
      label: this.teacherLabel(teacher),
    })),
  ]);

  readonly pendingCourses = computed(() => {
    const scheduledSectionCourseIds = new Set(
      this.schedules()
        .filter((schedule) => schedule.blockType !== 'break')
        .map((schedule) => typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse?.id : schedule.sectionCourse)
        .filter((value): value is string => Boolean(value)),
    );

    return this.sectionCourses()
      .filter((item) => item.teacher?.id)
      .filter((item) => !scheduledSectionCourseIds.has(item.id))
      .filter((item) => !this.selectedTeacherId() || item.teacher?.id === this.selectedTeacherId());
  });

  readonly plannerSummary = computed(() => {
    const scheduleList = this.schedules();
    const classBlocks = scheduleList.filter((item) => item.blockType !== 'break').length;
    const breakBlocks = scheduleList.filter((item) => item.blockType === 'break').length;
    const activeTeachers = new Set(
      scheduleList
        .map((item) => typeof item.sectionCourse === 'object' ? item.sectionCourse?.teacher?.id : null)
        .filter((value): value is string => Boolean(value)),
    ).size;

    return [
      { label: 'Clases cargadas', value: classBlocks },
      { label: 'Recesos', value: breakBlocks },
      { label: 'Pendientes', value: this.pendingCourses().length },
      { label: 'Docentes en malla', value: activeTeachers },
    ];
  });

  ngOnInit() {
    forkJoin({
      teachers: this.teacherApi.getAll({ page: 1, size: 999 }),
      sectionCourses: this.sectionCourseApi.getAll({ size: 999 }),
      schedules: this.scheduleApi.getAll({}),
    }).subscribe({
      next: ({ teachers, sectionCourses, schedules }) => {
        this.teachers.set(teachers.data ?? []);
        this.sectionCourses.set(sectionCourses.data ?? []);
        this.schedules.set(Array.isArray(schedules) ? schedules : []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la información para planificar horarios.');
        this.loading.set(false);
      },
    });
  }

  close() {
    this.ref.close();
  }

  teacherLabel(teacher: Teacher) {
    const name = typeof teacher.person === 'object'
      ? [teacher.person?.firstName, teacher.person?.lastName].filter(Boolean).join(' ')
      : teacher.teacherCode;
    return [name || teacher.teacherCode, teacher.specialization].filter(Boolean).join(' · ');
  }

  generateDrafts() {
    const occupied = this.buildOccupiedSlots();
    const nextDrafts: PlannerDraft[] = [];

    for (const sectionCourse of this.pendingCourses()) {
      const teacherId = sectionCourse.teacher?.id;
      if (!teacherId) continue;

      const sectionId = sectionCourse.section?.id ?? '';
      const slot = this.findFirstAvailableSlot(occupied, teacherId, sectionId);
      if (!slot) continue;

      const durationMinutes = 45;
      const draft: PlannerDraft = {
        key: `${sectionCourse.id}-${slot.dayOfWeek}-${slot.startAt}`,
        title: this.toSectionCourseTitle(sectionCourse),
        sectionCourseId: sectionCourse.id,
        teacherId,
        teacherName: this.teacherNameFromSectionCourse(sectionCourse),
        specialization: sectionCourse.teacher?.specialization ?? '',
        sectionName: sectionCourse.section?.name ?? 'Sección',
        courseName: sectionCourse.course?.name ?? 'Curso',
        dayOfWeek: slot.dayOfWeek,
        startAt: slot.startAt,
        durationMinutes,
        endAt: this.addMinutes(slot.startAt, durationMinutes),
        classroom: `Aula ${sectionCourse.section?.name ?? ''}`.trim(),
      };

      occupied.push({
        dayOfWeek: draft.dayOfWeek,
        startAt: draft.startAt,
        endAt: draft.endAt,
        teacherId,
        sectionId,
      });
      nextDrafts.push(draft);
    }

    this.drafts.set(nextDrafts);
    if (!nextDrafts.length) {
      this.toast.info('No se encontraron espacios disponibles para generar propuestas.');
    }
  }

  updateDraft(index: number, patch: Partial<PlannerDraft>) {
    this.drafts.update((current) =>
      current.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        const updated = { ...item, ...patch };
        updated.endAt = this.addMinutes(updated.startAt, Number(updated.durationMinutes || 45));
        return updated;
      }),
    );
  }

  removeDraft(index: number) {
    this.drafts.update((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  saveDrafts() {
    const payloads = this.drafts().map<ScheduleCreate>((draft) => ({
      title: draft.title,
      blockType: 'class',
      dayOfWeek: draft.dayOfWeek,
      startAt: draft.startAt,
      endAt: draft.endAt,
      classroom: draft.classroom,
      sectionCourse: draft.sectionCourseId,
      description: `Propuesta administrativa · ${draft.teacherName}`,
    }));

    if (!payloads.length) {
      this.toast.info('No hay propuestas para guardar.');
      return;
    }

    this.saving.set(true);
    forkJoin(payloads.map((payload) => this.scheduleApi.create(payload))).subscribe({
      next: () => {
        this.toast.success('Propuesta de horarios guardada.');
        this.ref.close({ refreshed: true });
      },
      error: () => {
        this.toast.error('No se pudieron guardar todos los horarios propuestos.');
        this.saving.set(false);
      },
    });
  }

  private buildOccupiedSlots(): OccupiedSlot[] {
    return this.schedules().map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startAt: this.formatTime(schedule.startAt),
      endAt: this.formatTime(schedule.endAt),
      teacherId: typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse?.teacher?.id ?? null : null,
      sectionId: typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse?.section?.id ?? null : null,
    }));
  }

  private findFirstAvailableSlot(
    occupied: OccupiedSlot[],
    teacherId: string,
    sectionId: string,
  ): Pick<PlannerDraft, 'dayOfWeek' | 'startAt'> | null {
    for (const day of DAY_OPTIONS.map((item) => item.value as Schedule['dayOfWeek'])) {
      for (const startAt of QUICK_STARTS) {
        const endAt = this.addMinutes(startAt, 45);
        const hasConflict = occupied.some((slot) =>
          slot.dayOfWeek === day &&
          this.overlaps(startAt, endAt, slot.startAt, slot.endAt) &&
          (slot.teacherId === teacherId || slot.sectionId === sectionId),
        );

        if (!hasConflict) {
          return { dayOfWeek: day, startAt };
        }
      }
    }

    return null;
  }

  private overlaps(startA: string, endA: string, startB: string, endB: string) {
    const aStart = this.toMinutes(startA);
    const aEnd = this.toMinutes(endA);
    const bStart = this.toMinutes(startB);
    const bEnd = this.toMinutes(endB);
    return aStart < bEnd && bStart < aEnd;
  }

  private toMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private addMinutes(value: string, durationMinutes: number) {
    const total = this.toMinutes(value) + durationMinutes;
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private formatTime(v: string | Date): string {
    if (typeof v === 'string') return v.includes('T') ? v.slice(11, 16) : v.slice(0, 5);
    const date = new Date(v);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private teacherNameFromSectionCourse(sectionCourse: SectionCourse) {
    return [sectionCourse.teacher?.person?.firstName, sectionCourse.teacher?.person?.lastName]
      .filter(Boolean)
      .join(' ') || sectionCourse.teacher?.teacherCode || 'Docente';
  }

  private toSectionCourseTitle(sectionCourse: SectionCourse) {
    const course = sectionCourse.course?.name ?? 'Curso';
    const section = sectionCourse.section?.name ?? 'Sección';
    return `${course} - ${section}`;
  }
}
