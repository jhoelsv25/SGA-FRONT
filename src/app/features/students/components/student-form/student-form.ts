export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { UploadApi } from '@core/services/api/upload-api';
import { StudentStore } from '../../services/store/student.store';
import { Student, StudentCreate } from '../../types/student-types';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
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
  private uploadApi = inject(UploadApi);

  form!: FormGroup;
  current: Student | null = null;
  saving = signal(false);
  activeTab = signal<'personal' | 'user' | 'academic'>('personal');
  photoUrl = '';
  photoUploading = false;

  docTypeOptions: LocalSelectOption[] = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'C.E.' },
    { value: 'PASSPORT', label: 'Pasaporte' }];

  genderOptions: LocalSelectOption[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'O', label: 'Otro' }];

  get fullName() {
    return `${this.form?.get('firstName')?.value ?? this.current?.firstName ?? ''} ${this.form?.get('lastName')?.value ?? this.current?.lastName ?? ''}`.trim();
  }

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.photoUrl = this.current?.photoUrl ?? '';
    this.form = this.fb.group({
      firstName: [this.current?.firstName ?? '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.current?.lastName ?? '', [Validators.required, Validators.minLength(2)]],
      docType: [this.current?.docType ?? 'DNI', [Validators.required]],
      docNumber: [this.current?.docNumber ?? '', [Validators.required, Validators.minLength(8)]],
      gender: [this.current?.gender ?? 'M', [Validators.required]],
      birthDate: [this.current?.birthDate?.slice(0, 10) ?? '', [Validators.required]],
      phone: [this.current?.phone ?? ''],
      mobile: [this.current?.mobile ?? ''],
      address: [this.current?.address ?? ''],
      email: [this.current?.email ?? '', [Validators.email]],
      username: [this.current?.username ?? ''],
      password: ['', []],
      studentCode: [this.current?.studentCode ?? '', [Validators.required]],
      isActive: [this.current?.isActive ?? true],
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
    const payload: StudentCreate = {
      ...v,
      photoUrl: this.photoUrl || undefined,
    };
    const op = this.current?.id
      ? this.store.update(this.current.id, payload)
      : this.store.create(payload);
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

  get computedAge(): number | null {
    const value = this.form?.get('birthDate')?.value;
    if (!value) return null;
    const birthDate = new Date(value);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(age, 0);
  }

  photoInitials(): string {
    const name = this.fullName || this.current?.studentCode || 'ST';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoUploading = true;
    this.uploadApi.upload(file, {
      category: 'persons',
      entityCode: this.form.get('studentCode')?.value || this.current?.studentCode || undefined,
      preserveName: false,
    }).subscribe({
      next: (res) => {
        this.photoUrl = res.url;
        this.photoUploading = false;
        input.value = '';
      },
      error: () => {
        this.photoUploading = false;
        input.value = '';
      },
    });
  }

  close() {
    this.ref.close();
  }
}
