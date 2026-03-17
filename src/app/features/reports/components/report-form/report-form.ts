export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportStore } from '../../services/store/report.store';
import { Report, ReportCreate } from '../../types/report-types';


@Component({
  selector: 'sga-report-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './report-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportForm implements OnInit {
  private store = inject(ReportStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Report | null = null;

  typeOptions: LocalSelectOption[] = [
    { value: 'academic', label: 'Académico' },
    { value: 'attendance', label: 'Asistencia' },
    { value: 'payments', label: 'Pagos' },
    { value: 'behavior', label: 'Conducta' },
    { value: 'enrollment', label: 'Matrículas' },
    { value: 'custom', label: 'Personalizado' },
    { value: 'other', label: 'Otro' }];

  formatOptions: LocalSelectOption[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV' }];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      type: [this.current?.type ?? 'academic', [Validators.required]],
      format: [this.current?.format ?? 'pdf'],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as ReportCreate;
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
