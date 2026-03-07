import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { SectionCourseSelect } from '@shared/components/selects';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule, ScheduleCreate } from '../../types/schedule-types';

@Component({
  selector: 'sga-schedule-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Select, Input, SectionCourseSelect],
  templateUrl: './schedule-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleForm implements OnInit {
  private store = inject(ScheduleStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Schedule | null = null;
  selectedSectionCourseLabel = signal<string | null>(null);

  dayOptions = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    const start = this.current?.startAt ? this.formatTime(this.current.startAt) : '08:00';
    const end = this.current?.endAt ? this.formatTime(this.current.endAt) : '10:00';
    const sectionCourseId = this.current?.sectionCourse
      ? typeof this.current.sectionCourse === 'string'
        ? this.current.sectionCourse
        : this.current.sectionCourse?.id
      : null;

    this.form = this.fb.group({
      sectionCourse: [sectionCourseId ?? null, [Validators.required]],
      dayOfWeek: [this.current?.dayOfWeek ?? 'monday', [Validators.required]],
      startAt: [start, [Validators.required]],
      endAt: [end, [Validators.required]],
      classroom: [this.current?.classroom ?? '', [Validators.required]],
      description: [this.current?.description ?? ''],
    });

  }

  onSectionCourseSelect(e: { id: string; label: string }) {
    this.selectedSectionCourseLabel.set(e.label);
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
