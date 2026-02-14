import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { TeacherStore } from '../../services/store/teacher.store';
import { Teacher, TeacherCreate } from '../../types/teacher-types';

@Component({
  selector: 'sga-teacher-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Input],
  templateUrl: './teacher-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherForm implements OnInit {
  private store = inject(TeacherStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Teacher | null = null;

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      firstName: [this.current?.firstName ?? '', [Validators.required]],
      lastName: [this.current?.lastName ?? '', [Validators.required]],
      email: [this.current?.email ?? '', [Validators.required, Validators.email]],
      subject: [this.current?.subject ?? ''],
      hireDate: [this.current?.hireDate ?? new Date().toISOString().slice(0, 10), [Validators.required]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as TeacherCreate;
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
