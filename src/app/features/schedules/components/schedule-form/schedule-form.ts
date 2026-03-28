import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule, ScheduleCreate } from '../../types/schedule-types';
import { SectionCourse } from '../../../section-courses/types/section-course-types';
import { ZardFormImports } from '@/shared/components/form';
import { SectionCourseSelect } from '@/shared/widgets/selects';


@Component({
  selector: 'sga-schedule-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent, ZardInputDirective, SectionCourseSelect, ...ZardFormImports],
  templateUrl: './schedule-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleForm implements OnInit {
  private store = inject(ScheduleStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  form!: FormGroup;
  current: Schedule | null = null;
  preselectedSectionCourse: SectionCourse | null = null;
  selectedSectionCourseLabel = signal<string | null>(null);
  durationPreview = signal('');

  dayOptions = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }];
  durationOptions: SelectOption[] = [
    { value: '30', label: '30 minutos' },
    { value: '45', label: 'Bloque simple · 45 min' },
    { value: '60', label: '1 hora' },
    { value: '90', label: '1 hora 30 min' },
    { value: '135', label: 'Bloque doble · 2 h 15 min' },
    { value: '120', label: '2 horas' },
    { value: '150', label: '2 horas 30 min' },
    { value: '180', label: '3 horas' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.preselectedSectionCourse = this.data?.preselectedSectionCourse ?? null;
    const start = this.current?.startAt ? this.formatTime(this.current.startAt) : '08:00';
    const end = this.current?.endAt ? this.formatTime(this.current.endAt) : '10:00';
    const durationMinutes = this.calculateDurationMinutes(start, end);
    const sectionCourseId = this.current?.sectionCourse
      ? typeof this.current.sectionCourse === 'string'
        ? this.current.sectionCourse
        : this.current.sectionCourse?.id
      : this.preselectedSectionCourse?.id ?? null;

    this.form = this.fb.group({
      sectionCourse: [sectionCourseId ?? null, [Validators.required]],
      dayOfWeek: [this.current?.dayOfWeek ?? 'monday', [Validators.required]],
      startAt: [start, [Validators.required]],
      durationMinutes: [String(durationMinutes), [Validators.required]],
      endAt: [end, [Validators.required]],
      classroom: [this.current?.classroom ?? '', [Validators.required]],
      description: [this.current?.description ?? ''],
    });

    this.bindTimeCalculation();
    this.durationPreview.set(this.formatTimeDisplay(end));

    if (this.preselectedSectionCourse) {
      this.selectedSectionCourseLabel.set(this.toSectionCourseLabel(this.preselectedSectionCourse));
    }
  }

  onSectionCourseSelect(e: unknown) {
    const typed = e as { id: string; label: string };
    this.selectedSectionCourseLabel.set(typed?.label ?? null);
  }

  private toSectionCourseLabel(item: SectionCourse): string {
    const course = item.course?.name?.trim() || 'Curso';
    const section = item.section?.name?.trim() || 'Sección';
    const academicYear = item.academicYear?.name?.trim();
    const teacherName = item.teacher?.person
      ? [item.teacher.person.firstName, item.teacher.person.lastName].filter(Boolean).join(' ')
      : '';

    const extras = [academicYear, teacherName].filter(Boolean).join(' · ');

    return extras ? `${course} - ${section} · ${extras}` : `${course} - ${section}`;
  }

  private bindTimeCalculation() {
    const recalculateEnd = () => {
      const startAt = this.form.get('startAt')?.value;
      const durationMinutes = Number(this.form.get('durationMinutes')?.value ?? 0);
      if (!startAt || !durationMinutes) return;
      const endAt = this.addMinutes(startAt, durationMinutes);
      this.form.get('endAt')?.setValue(endAt, { emitEvent: false });
      this.durationPreview.set(this.formatTimeDisplay(endAt));
    };

    this.form.get('startAt')?.valueChanges.subscribe(recalculateEnd);
    this.form.get('durationMinutes')?.valueChanges.subscribe(recalculateEnd);
    recalculateEnd();
  }

  private calculateDurationMinutes(start: string, end: string): number {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    const diff = endMinutes - startMinutes;
    return diff > 0 ? diff : 120;
  }

  private timeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private addMinutes(start: string, minutesToAdd: number): string {
    const total = this.timeToMinutes(start) + minutesToAdd;
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private formatTimeDisplay(value: string): string {
    const [rawHours, rawMinutes] = value.split(':').map(Number);
    const hours = rawHours ?? 0;
    const minutes = rawMinutes ?? 0;
    const suffix = hours >= 12 ? 'p. m.' : 'a. m.';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  }

  private formatTime(v: string | Date): string {
    if (typeof v === 'string') {
      if (v.includes('T')) return v.slice(11, 16);
      return v.slice(0, 5);
    }
    const d = new Date(v);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const title = this.selectedSectionCourseLabel() ?? this.current?.title ?? v.sectionCourse ?? '';
    const payload: ScheduleCreate = {
      title,
      dayOfWeek: v.dayOfWeek,
      description: v.description || undefined,
      startAt: v.startAt,
      endAt: v.endAt,
      classroom: v.classroom,
      sectionCourse: v.sectionCourse,
    };
    if (this.current?.id) {
      this.store.update(this.current.id, payload);
    } else {
      this.store.create(payload);
    }
    this.ref.close();
  }

  close() {
    this.ref.close();
  }
}
