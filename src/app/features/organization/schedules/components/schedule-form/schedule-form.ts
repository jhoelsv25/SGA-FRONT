import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule, ScheduleCreate } from '../../types/schedule-types';

@Component({
  selector: 'sga-schedule-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Select, Input],
  templateUrl: './schedule-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleForm implements OnInit {
  private store = inject(ScheduleStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  form!: FormGroup;
  current: Schedule | null = null;
  sectionCourseOptions: { value: string; label: string }[] = [];

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
      title: [this.current?.title ?? '', [Validators.required]],
      dayOfWeek: [this.current?.dayOfWeek ?? 'monday', [Validators.required]],
      description: [this.current?.description ?? ''],
      startAt: [start, [Validators.required]],
      endAt: [end, [Validators.required]],
      classroom: [this.current?.classroom ?? '', [Validators.required]],
      sectionCourse: [sectionCourseId ?? null, [Validators.required]],
    });

    this.http.get<{ id: string }[]>(`section-course`).subscribe({
      next: (list) => {
        this.sectionCourseOptions = (list ?? []).map((item) => ({
          value: item.id,
          label: String(item.id).slice(0, 8) + '...',
        }));
      },
    });
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
    const payload: ScheduleCreate = {
      title: v.title,
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
