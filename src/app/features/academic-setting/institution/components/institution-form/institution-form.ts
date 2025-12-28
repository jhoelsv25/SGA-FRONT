import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { InstitutionStore } from '../../services/store/insittution.store';

@Component({
  selector: 'sga-institution-form',
  imports: [ReactiveFormsModule, Button, Select, Input],
  templateUrl: './institution-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionForm {
  private store = inject(InstitutionStore);
  private data = inject(DIALOG_DATA);

  public errror = computed(() => this.store.error());
  public title = computed(() => this.data.title || 'Crea una institución');
  public subTitle = computed(() => this.data.subTitle || 'Complete el formulario para continuar');
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  public institutionForm: FormGroup;

  public managementTypes = [
    { value: 'publica', label: 'Pública' },
    { value: 'privada', label: 'Privada' },
    { value: 'mixta', label: 'Mixta' },
  ];

  public statuses = [
    { value: 'activa', label: 'Activa' },
    { value: 'inactiva', label: 'Inactiva' },
    { value: 'cerrada', label: 'Cerrada' },
  ];

  constructor() {
    this.institutionForm = this.fb.group({
      name: ['', [Validators.required]],
      modularCode: ['', [Validators.required]],
      managementType: ['', [Validators.required]],
      ugel: ['', [Validators.required]],
      dre: ['', [Validators.required]],
      principal: ['', [Validators.required]],
      address: [''],
      district: [''],
      province: [''],
      department: [''],
      phone: [''],
      email: ['', [Validators.email, Validators.required]],
      status: ['', [Validators.required]],
      logoUrl: [''],
      description: [''],
    });
  }

  onSubmit() {
    if (this.institutionForm.valid) {
      console.log(this.institutionForm.value);
      const values = this.institutionForm.value;
      this.store.create(values).subscribe({
        next: (res) => {
          this.ref.close(res);
        },
      });
    }
  }

  onClose() {
    this.ref.close();
  }
}
