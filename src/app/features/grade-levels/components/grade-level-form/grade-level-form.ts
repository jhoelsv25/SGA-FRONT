import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel, GradeLevelCreate } from '../../types/grade-level-types';
import { InstitutionSelect } from '@/shared/widgets/selects';

@Component({
  selector: 'sga-grade-level-form',

  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    SelectOptionComponent,
    ZardInputDirective,
    InstitutionSelect,
  ],
  templateUrl: './grade-level-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLevelForm implements OnInit {
  private store = inject(GradeLevelStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  form!: FormGroup;
  current: GradeLevel | null = null;
  saving = signal(false);

  levelOptions = [
    { value: 'primary', label: 'Primaria' },
    { value: 'secondary', label: 'Secundaria' },
    { value: 'higher', label: 'Superior' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    const instId = this.current?.institution
      ? typeof this.current.institution === 'string'
        ? this.current.institution
        : this.current.institution?.id
      : null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      level: [this.current?.level ?? 'primary', [Validators.required]],
      gradeNumber: [this.current?.gradeNumber ?? 1, [Validators.required, Validators.min(1)]],
      description: [this.current?.description ?? ''],
      maxCapacity: [this.current?.maxCapacity ?? 30, [Validators.required, Validators.min(1)]],
      institution: [instId ?? null, [Validators.required]],
    });
  }

  submit() {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    const payload: GradeLevelCreate = {
      name: raw.name,
      level: raw.level,
      gradeNumber: Math.floor(Number(raw.gradeNumber)),
      maxCapacity: Math.floor(Number(raw.maxCapacity)),
      description: raw.description || undefined,
      institution: raw.institution,
    };
    this.saving.set(true);
    const request = this.current?.id
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

  close() {
    this.ref.close();
  }
}
