import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit, inject, signal, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { GradeLevelSelect, SubjectAreaSelect } from '@/shared/widgets/selects';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { CourseStore } from '../../services/store/course.store';
import { Course } from '../../types/course-types';

export type LocalSelectOption = { value: string | number | boolean; label: string; [key: string]: any };

@Component({
  selector: 'sga-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent, ZardCheckboxComponent, SubjectAreaSelect, GradeLevelSelect],
  templateUrl: './course-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseForm implements OnInit {
  private store = inject(CourseStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Course | null = null;
  saving = signal(false);

  mandatoryOptions: LocalSelectOption[] = [
    { value: true, label: 'Sí' },
    { value: false, label: 'No' }];

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
      competencies: [this.current?.competencies ?? ''],
      isMandatory: [this.current?.isMandatory ?? true, [Validators.required]],
      syllabusUrl: [this.current?.syllabusUrl ?? ''],
      subjectArea: [subjectAreaId, [Validators.required]],
      grade: [gradeId, [Validators.required]],
      active: [this.current?.active ?? true],
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue() as { 
      code: string;
      name: string;
      description: string;
      weeklyHours: number;
      totalHours: number;
      credits: number;
      competencies: string;
      isMandatory: boolean;
      syllabusUrl: string;
      subjectArea: string;
      grade: string;
     };
    const payload = {
      code: v.code,
      name: v.name,
      description: v.description,
      weeklyHours: Number(v.weeklyHours),
      totalHours: Number(v.totalHours),
      credits: Number(v.credits),
      competencies: v.competencies ?? '',
      isMandatory: v.isMandatory,
      syllabusUrl: v.syllabusUrl || undefined,
      subjectAreaId: v.subjectArea,
      gradeId: v.grade,
    };
    this.saving.set(true);
    const request = this.current?.id
      ? this.store.update(this.current.id, payload)
      : this.store.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  close(): void {
    this.ref.close();
  }
}
