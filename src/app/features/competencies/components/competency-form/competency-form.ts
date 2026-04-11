import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  input,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { CompetencyStore } from '../../services/store/competency.store';
import type { Competency } from '../../types/competency-types';
import { Observable } from 'rxjs';
import { CourseSelect } from '@/shared/widgets/selects';

@Component({
  selector: 'sga-competency-form',

  imports: [
    ReactiveFormsModule,
    CommonModule,
    ZardInputDirective,
    ZardButtonComponent,
    CourseSelect,
  ],
  templateUrl: './competency-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetencyForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private store = inject(CompetencyStore);

  current: Competency | null = null;
  saving = signal(false);

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
