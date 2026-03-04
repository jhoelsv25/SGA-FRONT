import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CourseApi } from '@features/academic-setup/courses/services/course-api';
import { CompetencyStore } from '../../services/store/competency.store';
import type { Competency } from '../../types/competency-types';
import { Observable } from 'rxjs';

@Component({
  selector: 'sga-competency-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Input, Select, Button],
  templateUrl: './competency-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyForm implements OnInit {
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private courseApi = inject(CourseApi);
  private store = inject(CompetencyStore);

  current: Competency | null = null;
  saving = signal(false);
  courses = signal<{ value: string; label: string }[]>([]);

  title = computed(() => (this.current ? 'Editar competencia' : 'Crear competencia'));
  subTitle = computed(() => 'Complete el formulario para continuar');

  form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    expectedAchievement: [''],
    course: [null as string | null, Validators.required],
  });

  ngOnInit() {
    this.current = this.data?.current ?? null;
    if (this.current) {
      this.form.patchValue({
        code: this.current.code,
        name: this.current.name,
        description: this.current.description ?? '',
        expectedAchievement: this.current.expectedAchievement ?? '',
        course: this.current.course?.id ?? null,
      });
    }
    this.courseApi.getAll({}).subscribe({
      next: (res) => {
        const list = (res.data ?? []) as { id: string; name?: string }[];
        this.courses.set(list.map((c) => ({ value: c.id, label: c.name ?? c.id })));
      },
    });
  }

  onClose() {
    this.ref.close();
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue() as {
      code: string;
      name: string;
      description: string;
      expectedAchievement: string;
      course: string;
    };
    const payload = {
      code: v.code,
      name: v.name,
      description: v.description || undefined,
      expectedAchievement: v.expectedAchievement || undefined,
      course: v.course,
    };
    this.saving.set(true);
    const request: Observable<unknown> = this.current?.id
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
}
