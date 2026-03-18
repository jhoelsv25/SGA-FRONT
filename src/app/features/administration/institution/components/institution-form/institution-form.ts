import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardFormImports } from '@/shared/components/form';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InstitutionStore } from '../../../services/store/institution.store';
import { Institution } from '../../types/institution-types';


@Component({
  selector: 'sga-institution-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, SelectOptionComponent, ZardInputDirective, ...ZardFormImports],
  templateUrl: './institution-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionForm implements OnInit {
  private store = inject(InstitutionStore);
  private data = inject(Z_MODAL_DATA);

  public errror = computed(() => this.store.error());
  public title = computed(() => this.data?.title ?? 'Nueva institución');
  public subTitle = computed(() => this.data?.subTitle ?? 'Complete el formulario para continuar');
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  public institutionForm: FormGroup;
  private current: Institution | null = null;

  public managementTypes = [
    { value: 'publica', label: 'Pública' },
    { value: 'privada', label: 'Privada' },
    { value: 'mixta', label: 'Mixta' }];

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
      logoUrl: [''],
      description: [''],
    });
  }

  ngOnInit() {
    this.current = this.data?.current ?? null;
    if (this.current) {
      this.institutionForm.patchValue({
        name: this.current.name,
        modularCode: this.current.modularCode,
        managementType: this.current.managementType ?? '',
        ugel: this.current.ugel ?? '',
        dre: this.current.dre ?? '',
        principal: this.current.principal ?? '',
        address: this.current.address ?? '',
        district: this.current.district ?? '',
        province: this.current.province ?? '',
        department: this.current.department ?? '',
        phone: this.current.phone ?? '',
        email: this.current.email ?? '',
        logoUrl: this.current.logoUrl ?? '',
        description: this.current.description ?? '',
      });
    }
  }

  onSubmit() {
    if (!this.institutionForm.valid) return;
    const values = this.institutionForm.value;
    if (this.current?.id) {
      this.store.update(this.current.id, values).subscribe({
        next: (res) => {
          this.ref.close(res);
        },
      });
    } else {
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
