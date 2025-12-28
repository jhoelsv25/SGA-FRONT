import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { SubjectAreaType, StatusType } from '../../types/subject-area-types';

@Component({
  selector: 'sga-subject-area-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Input, Select, Button],
  templateUrl: './subject-area-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAreaForm {
  private data = inject(DIALOG_DATA);
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  public title = computed(() => this.data?.title || 'Crear Área Curricular');
  public subTitle = computed(() => this.data?.subtitle || 'Complete el formulario para continuar');

  public form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(20)]],
    description: [''],
    type: [SubjectAreaType.CORE, Validators.required],
    status: [StatusType.ACTIVE, Validators.required],
  });

  types = [
    { value: SubjectAreaType.CORE, label: 'Troncal' },
    { value: SubjectAreaType.ELECTIVE, label: 'Electiva' },
    { value: SubjectAreaType.OPTIONAL, label: 'Opcional' },
  ];
  statuses = [
    { value: StatusType.ACTIVE, label: 'Activo' },
    { value: StatusType.INACTIVE, label: 'Inactivo' },
  ];

  onClose() {
    this.ref.close();
  }

  onSubmit() {
    if (this.form.valid) {
      this.ref.close(this.form.getRawValue());
    }
  }
}
