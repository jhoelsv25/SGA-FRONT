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
import { CourseApi } from '@features/academic-setting/courses/services/course-api';

@Component({
  selector: 'sga-competency-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Input, Select, Button],
  templateUrl: './competency-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyForm implements OnInit {
  private data = inject(DIALOG_DATA);
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private courseApi = inject(CourseApi);

  public title = computed(() => this.data?.title || 'Crear Competencia');
  public subTitle = computed(() => this.data?.subtitle || 'Complete el formulario para continuar');

  public form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.required],
    expectedAchievement: ['', Validators.required],
    course: [null, Validators.required],
    active: [true, Validators.required],
  });

  courses = signal<{ value: string; label: string }[]>([]);
  statuses = [
    { value: true, label: 'Activo' },
    { value: false, label: 'Inactivo' },
  ];

  ngOnInit() {
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
    if (this.form.valid) {
      // Emitir el valor del formulario como Competency
      // Adaptar según integración real
      this.ref.close(this.form.getRawValue());
    }
  }
}
