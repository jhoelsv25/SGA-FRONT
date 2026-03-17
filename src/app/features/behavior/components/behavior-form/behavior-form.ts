export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorStore } from '../../services/store/behavior.store';
import { Behavior, BehaviorCreate } from '../../types/behavior-types';


@Component({
  selector: 'sga-behavior-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './behavior-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviorForm implements OnInit {
  private store = inject(BehaviorStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Behavior | null = null;

  typeOptions: LocalSelectOption[] = [
    { value: 'incident', label: 'Incidencia' },
    { value: 'achievement', label: 'Logro' },
    { value: 'observation', label: 'Observación' },
    { value: 'other', label: 'Otro' }];

  severityOptions: LocalSelectOption[] = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      studentId: [this.current?.studentId ?? '', [Validators.required]],
      type: [this.current?.type ?? 'incident', [Validators.required]],
      severity: [this.current?.severity ?? 'low'],
      date: [this.current?.date ?? new Date().toISOString().slice(0, 10), [Validators.required]],
      description: [this.current?.description ?? '', [Validators.required]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as BehaviorCreate;
    if (this.current?.id) {
      this.store.update(this.current.id, v);
      this.ref.close();
    } else {
      this.store.create(v);
      this.ref.close();
    }
  }

  close() {
    this.ref.close();
  }
}
