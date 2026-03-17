export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { StudentStore } from '../../services/store/student.store';
import { Student, StudentCreate } from '../../types/student-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule, NgClass, NgIf, NgFor, NgSwitch } from '@angular/common';
import { Component, OnInit, inject, signal, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';


@Component({
  selector: 'sga-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './student-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentForm implements OnInit {
  private store = inject(StudentStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Student | null = null;
  saving = signal(false);
  activeTab = signal<'personal' | 'user' | 'academic'>('personal');

  docTypeOptions: LocalSelectOption[] = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'C.E.' },
    { value: 'PASSPORT', label: 'Pasaporte' }];

  genderOptions: LocalSelectOption[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'O', label: 'Otro' }];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      firstName: [this.current?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.current?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
      docType: [this.current?.docType ?? 'DNI', [Validators.required]],
      docNumber: [this.current?.docNumber ?? '', [Validators.required, Validators.minLength(8)]],
      gender: [this.current?.gender ?? 'M', [Validators.required]],
      birthDate: [this.current?.birthDate?.slice(0, 10) ?? '', [Validators.required]],
      phone: [this.current?.phone ?? ''],
      address: [this.current?.address ?? ''],
      email: [this.current?.email ?? '', [Validators.required, Validators.email]],
      username: [this.current?.username ?? '', [Validators.required]],
      password: ['', this.current ? [] : [Validators.required, Validators.minLength(6)]],
      studentCode: [this.current?.studentCode ?? '', [Validators.required]],
      age: [this.current?.age ?? null, [Validators.required, Validators.min(1), Validators.max(120)]],
      grade: [this.current?.grade ?? '', [Validators.required, Validators.maxLength(20)]],
    });
  }

  setTab(tab: 'personal' | 'user' | 'academic') {
    this.activeTab.set(tab);
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
    if (this.form.invalid) {
      this.highlightFirstErrorTab();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue() as StudentCreate;
    const op = this.current?.id
      ? this.store.update(this.current.id, v)
      : this.store.create(v);
    op.subscribe({
      next: () => this.ref.close(),
      error: () => this.saving.set(false),
    });
  }

  private highlightFirstErrorTab() {
    const personalFields = ['firstName', 'lastName', 'docType', 'docNumber', 'gender', 'birthDate'];
    const userFields = ['email', 'username', 'password'];
    
    if (personalFields.some(f => this.form.get(f)?.invalid)) {
      this.setTab('personal');
    } else if (userFields.some(f => this.form.get(f)?.invalid)) {
      this.setTab('user');
    } else {
      this.setTab('academic');
    }
  }

  close() {
    this.ref.close();
  }
}
