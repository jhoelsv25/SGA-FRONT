import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel, GradeLevelCreate } from '../../types/grade-level-types';
import { InstitutionApi } from '@features/academic-setting/institution/services/api/institution-api';

@Component({
  selector: 'sga-grade-level-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Select, Input],
  templateUrl: './grade-level-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeLevelForm implements OnInit {
  private store = inject(GradeLevelStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private institutionApi = inject(InstitutionApi);

  form!: FormGroup;
  current: GradeLevel | null = null;
  institutionOptions: { value: string; label: string }[] = [];

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
    this.institutionApi.getAll({}).subscribe((list) => {
      this.institutionOptions = (list ?? []).map((i: { id: string; name: string }) => ({
        value: i.id,
        label: i.name,
      }));
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as GradeLevelCreate;
    if (this.current?.id) {
      this.store.update(this.current.id, v);
    } else {
      this.store.create(v);
    }
    this.ref.close();
  }

  close() {
    this.ref.close();
  }
}
