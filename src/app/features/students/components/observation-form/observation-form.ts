export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { ObservationApi } from '../../services/api/observation-api';
import { StudentApi } from '../../services/api/student-api';
import { TeacherApi } from '@/features/teachers/services/api/teacher-api';
import { StudentObservation } from '../../types/observation-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';


@Component({
  selector: 'sga-observation-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent, ZardInputDirective],
  templateUrl: './observation-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private api = inject(ObservationApi);
  private studentApi = inject(StudentApi);
  private teacherApi = inject(TeacherApi);

  form = this.fb.group({
    student: [null as string | null, [Validators.required]],
    teacher: [null as string | null, [Validators.required]],
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    type: ['behavioral' as 'behavioral' | 'academic' | 'social', [Validators.required]],
    observation: ['', [Validators.required]],
    followUp: [''],
    referral: [''],
    isConfidential: [false],
  });

  current: StudentObservation | null = null;
  studentOptions: LocalSelectOption[] = [];
  teacherOptions: LocalSelectOption[] = [];
  studentPage = 1;
  readonly studentPageSize = 30;
  studentHasMore = true;
  studentLoadingMore = false;
  teacherPage = 1;
  readonly teacherPageSize = 30;
  teacherHasMore = true;
  teacherLoadingMore = false;

  typeOptions: LocalSelectOption[] = [
    { value: 'behavioral', label: 'Conducta' },
    { value: 'academic', label: 'Académico' },
    { value: 'social', label: 'Social' }];

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    if (this.current) {
      const o = this.current;
      this.form.patchValue({
        student: (o.student as {  id?: string  })?.id ?? null,
        teacher: (o.teacher as {  id?: string  })?.id ?? null,
        date: o.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        type: o.type,
        observation: o.observation,
        followUp: o.followUp ?? '',
        referral: o.referral ?? '',
        isConfidential: o.isConfidential ?? false,
      });
    }

    this.loadStudents();
    this.loadTeachers();
  }

  loadStudents(): void {
    if (!this.studentHasMore || this.studentLoadingMore) return;
    this.studentLoadingMore = true;
    this.studentApi.getAll({ page: this.studentPage, size: this.studentPageSize }).subscribe({
      next: (res) => {
        const newOptions = (res.data ?? []).map((s) => {
          const p = (s as { person?: { firstName?: string; lastName?: string } }).person;
          const label =
            (s as { name?: string }).name ??
            (p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : null) ??
            (s as { studentCode?: string }).studentCode ??
            s.id;
          return { value: s.id, label: label || s.id };
        });
        this.studentOptions = [...this.studentOptions, ...newOptions];
        const loaded = this.studentOptions.length;
        const total = res.total ?? loaded;
        this.studentHasMore = loaded < total;
        this.studentPage += 1;
        this.studentLoadingMore = false;
      },
      error: () => {
        this.studentLoadingMore = false;
      },
    });
  }

  loadTeachers(): void {
    if (!this.teacherHasMore || this.teacherLoadingMore) return;
    this.teacherLoadingMore = true;
    this.teacherApi.getAll({ page: this.teacherPage, size: this.teacherPageSize }).subscribe({
      next: (res) => {
        const newOptions = (res.data ?? []).map((teacher) => {
          const person = typeof teacher.person === 'string' ? null : teacher.person;
          const label =
            `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim() ||
            person?.email ||
            teacher.teacherCode ||
            teacher.id;
          return { value: teacher.id, label };
        });
        this.teacherOptions = [...this.teacherOptions, ...newOptions];
        const loaded = this.teacherOptions.length;
        const total = res.total ?? loaded;
        this.teacherHasMore = loaded < total;
        this.teacherPage += 1;
        this.teacherLoadingMore = false;
      },
      error: () => {
        this.teacherLoadingMore = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload = {
      student: v.student!,
      teacher: v.teacher!,
      date: v.date!,
      type: v.type!,
      observation: v.observation!,
      followUp: v.followUp ?? '',
      referral: v.referral ?? '',
      isConfidential: v.isConfidential ?? false,
    };
    if (this.current?.id) {
      this.api.update(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    } else {
      this.api.create(payload).subscribe({
        next: () => this.ref.close(),
        error: (err) => console.error(err),
      });
    }
  }

  close(): void {
    this.ref.close();
  }
}
