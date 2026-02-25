import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { Checkbox } from '@shared/ui/checkbox/checkbox';
import { CourseStore } from '../../services/store/course.store';
import type { Course } from '../../types/course-types';
import { SubjectAreaApi } from '@features/academic-setting/subject-areas/services/subject-area-api';
import { GradeLevelApi } from '@features/academic-setting/grade-levels/services/api/grade-level-api';
import type { SelectOption } from '@shared/ui/select/select';

@Component({
  selector: 'sga-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input, Select, Checkbox],
  templateUrl: './course-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseForm implements OnInit {
  private store = inject(CourseStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private subjectAreaApi = inject(SubjectAreaApi);
  private gradeLevelApi = inject(GradeLevelApi);

  form!: FormGroup;
  current: Course | null = null;
  subjectAreaOptions = signal<SelectOption[]>([]);
  gradeOptions = signal<SelectOption[]>([]);

  mandatoryOptions: SelectOption[] = [
    { value: true, label: 'Sí' },
    { value: false, label: 'No' },
  ];

  ngOnInit(): void {
    this.current = this.data?.current ?? null;
    const subjectAreaId = this.current?.subjectArea?.id ?? null;
    const gradeId = this.current?.grade?.id ?? null;

    this.form = this.fb.group({
      code: [this.current?.code ?? '', [Validators.required]],
      name: [this.current?.name ?? '', [Validators.required]],
      description: [this.current?.description ?? ''],
      weeklyHours: [this.current?.weeklyHours ?? 0, [Validators.required, Validators.min(0)]],
      totalHours: [this.current?.totalHours ?? 0, [Validators.required, Validators.min(0)]],
      credits: [this.current?.credits ?? 0, [Validators.required, Validators.min(0)]],
      isMandatory: [this.current?.isMandatory ?? true, [Validators.required]],
      syllabusUrl: [this.current?.syllabusUrl ?? ''],
      subjectArea: [subjectAreaId, [Validators.required]],
      grade: [gradeId, [Validators.required]],
      active: [this.current?.active ?? true],
    });

    this.subjectAreaApi.getAll().subscribe((list) => {
      this.subjectAreaOptions.set(
        (list ?? []).map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))
      );
    });

    this.gradeLevelApi.getAll().subscribe((list) => {
      this.gradeOptions.set(
        (list ?? []).map((g) => ({ value: g.id, label: g.name }))
      );
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.value as Partial<Course> & { subjectArea: string; grade: string };
    const payload = {
      ...v,
      subjectArea: v.subjectArea,
      grade: v.grade,
    };
    if (this.current?.id) {
      this.store.update(this.current.id, payload).subscribe({
        next: () => this.ref.close(),
      });
    } else {
      this.store.create(payload).subscribe({
        next: () => this.ref.close(),
      });
    }
  }

  close(): void {
    this.ref.close();
  }
}
