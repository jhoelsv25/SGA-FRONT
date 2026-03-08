import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { StudentStore } from '../../services/store/student.store';
import { Student, StudentCreate } from '../../types/student-types';

@Component({
  selector: 'sga-student-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input],
  templateUrl: './student-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentForm implements OnInit {
  private store = inject(StudentStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Student | null = null;
  saving = signal(false);

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required, Validators.minLength(2)]],
      email: [this.current?.email ?? '', [Validators.required, Validators.email]],
      age: [this.current?.age ?? null, [Validators.required, Validators.min(1), Validators.max(120)]],
      grade: [this.current?.grade ?? '', [Validators.maxLength(20)]],
    });
  }

  getError(controlName: string): string | null {
    const c = this.form.get(controlName);
    if (!c?.invalid || !c?.touched) return null;
    if (c.errors?.['required']) return 'Campo requerido';
    if (c.errors?.['email']) return 'Email inválido';
    if (c.errors?.['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    if (c.errors?.['min']) return 'Edad mínima: 1';
    if (c.errors?.['max']) return controlName === 'age' ? 'Edad máxima: 120' : 'Valor máximo excedido';
    if (c.errors?.['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres`;
    return null;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.value as StudentCreate;
    const op = this.current?.id
      ? this.store.update(this.current.id, v)
      : this.store.create(v);
    op.subscribe({
      next: () => this.ref.close(),
      error: () => this.saving.set(false),
    });
  }

  close() {
    this.ref.close();
  }
}
