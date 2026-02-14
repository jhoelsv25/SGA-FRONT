import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      email: [this.current?.email ?? '', [Validators.required, Validators.email]],
      age: [this.current?.age ?? null, [Validators.required, Validators.min(1)]],
      grade: [this.current?.grade ?? ''],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as StudentCreate;
    if (this.current?.id) {
      this.store.update(this.current.id, v).subscribe({
        next: () => this.ref.close(),
      });
    } else {
      this.store.create(v).subscribe({
        next: () => this.ref.close(),
      });
    }
  }

  close() {
    this.ref.close();
  }
}
