export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorStore } from '../../services/store/behavior.store';
import { Behavior, BehaviorCreate } from '../../types/behavior-types';
import { StudentSelect, SectionCourseSelect } from '@/shared/widgets/selects';
import { AuthStore } from '@auth/services/store/auth.store';
import { PeriodStore } from '@features/periods/services/store/period.store';
import type { CurrentUser } from '@auth/types/auth-type';

@Component({
  selector: 'sga-behavior-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardCheckboxComponent, ZardInputDirective, SelectOptionComponent, StudentSelect, SectionCourseSelect],
  templateUrl: './behavior-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviorForm implements OnInit {
  private store = inject(BehaviorStore);
  private authStore = inject(AuthStore);
  private periodStore = inject(PeriodStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Behavior | null = null;

  typeOptions: LocalSelectOption[] = [
    { value: 'positive', label: 'Logro / Positivo' },
    { value: 'negative', label: 'Incidencia / Negativo' }];

  severityOptions: LocalSelectOption[] = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }];

  categoryOptions: LocalSelectOption[] = [
    { value: 'Disciplina', label: 'Disciplina' },
    { value: 'Académico', label: 'Académico' },
    { value: 'Convivencia', label: 'Convivencia' },
    { value: 'Respeto', label: 'Respeto' },
    { value: 'Puntualidad', label: 'Puntualidad' },
    { value: 'Otros', label: 'Otros' }];

  readonly selectedType = computed(() => this.form?.get('type')?.value ?? 'negative');
  readonly isNegative = computed(() => this.selectedType() === 'negative');
  readonly isPositive = computed(() => this.selectedType() === 'positive');
  readonly isAcademicCategory = computed(() => this.form?.get('category')?.value === 'Académico');
  readonly formTitle = computed(() =>
    this.current ? 'Editar registro de conducta' : 'Nuevo registro de conducta'
  );
  readonly formSubtitle = computed(() =>
    this.isPositive()
      ? 'Documenta reconocimientos, avances y acciones positivas del estudiante.'
      : 'Registra incidencias, observaciones y acciones de seguimiento del caso.'
  );

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      student: [this.current?.student?.id ?? this.current?.student ?? '', [Validators.required]],
      type: [this.current?.type ?? 'negative', [Validators.required]],
      category: [this.current?.category ?? 'Disciplina', [Validators.required]],
      severity: [this.current?.severity ?? 'low'],
      recordDate: [this.current?.recordDate ?? new Date().toISOString().slice(0, 10), [Validators.required]],
      description: [this.current?.description ?? '', [Validators.required]],
      place: [this.current?.place ?? ''],
      witnesses: [this.current?.witnesses ?? ''],
      measuresTaken: [this.current?.measuresTaken ?? ''],
      guardianNotified: [this.current?.guardianNotified ?? false],
      actionToken: [this.current?.actionToken ?? 'REG-' + Math.random().toString(36).substring(7).toUpperCase()],
      sectionCourse: [this.current?.sectionCourse?.id ?? this.current?.sectionCourse ?? ''],
    });

    this.syncConditionalFields(this.form.get('type')?.value ?? 'negative');
    this.form.get('type')?.valueChanges.subscribe((type) => {
      this.syncConditionalFields(type ?? 'negative');
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as BehaviorCreate;
    
    // Auto-fill period if not present
    if (!v.period) {
      const periods = this.periodStore.periods();
      const activePeriod = periods.find((p) => p.vigencia === 1 || p.status === 'in_progress') ?? periods[0];
      if (activePeriod) v.period = activePeriod.id;
    }

    // Auto-fill teacher if not present (from current user)
    if (!v.teacher) {
      const user = this.authStore.currentUser() as CurrentUser | null;
      if (user?.teacherId) v.teacher = user.teacherId;
    }

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

  private syncConditionalFields(type: string) {
    const severityControl = this.form.get('severity');
    const witnessesControl = this.form.get('witnesses');
    const measuresControl = this.form.get('measuresTaken');
    const guardianControl = this.form.get('guardianNotified');

    if (!severityControl || !witnessesControl || !measuresControl || !guardianControl) return;

    if (type === 'positive') {
      severityControl.setValue('low', { emitEvent: false });
      witnessesControl.setValue('', { emitEvent: false });
      measuresControl.setValue('', { emitEvent: false });
      guardianControl.setValue(false, { emitEvent: false });
    }
  }
}
