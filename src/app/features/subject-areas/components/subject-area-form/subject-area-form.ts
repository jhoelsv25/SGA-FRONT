import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { SubjectArea, SubjectAreaType, StatusType } from '../../types/subject-area-types';
import { SubjectAreaStore } from '../../services/store/subject-area.store';


@Component({
  selector: 'sga-subject-area-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ZardInputDirective, SelectOptionComponent, ZardButtonComponent],
  templateUrl: './subject-area-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAreaForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private store = inject(SubjectAreaStore);

  saving = signal(false);
  current: SubjectArea | null = null;

  public title = computed(() => (this.current ? 'Editar Área Curricular' : 'Crear Área Curricular'));
  public subTitle = computed(() => 'Complete el formulario para continuar');

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
    { value: SubjectAreaType.OPTIONAL, label: 'Opcional' }];
  statuses = [
    { value: StatusType.ACTIVE, label: 'Activo' },
    { value: StatusType.INACTIVE, label: 'Inactivo' },
    { value: StatusType.PENDING, label: 'Pendiente' },
    { value: StatusType.SUSPENDED, label: 'Suspendido' }];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    if (this.current) {
      this.form.patchValue({
        name: this.current.name,
        code: this.current.code,
        description: this.current.description ?? '',
        type: this.current.type,
        status: this.current.status,
      });
    }
  }

  onClose() {
    this.ref.close();
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const payload: Partial<SubjectArea> = {
      name: raw.name,
      code: raw.code,
      description: raw.description || undefined,
      type: raw.type,
      status: raw.status,
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
