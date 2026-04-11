import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectionStore } from '../../services/store/section.store';
import { Section, SectionCreate } from '../../types/section-types';
import { GradeLevelSelect, YearAcademicSelect } from '@/shared/widgets/selects';

@Component({
  selector: 'sga-section-form',

  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    SelectOptionComponent,
    ZardInputDirective,
    GradeLevelSelect,
    YearAcademicSelect,
  ],
  templateUrl: './section-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionForm implements OnInit {
  private store = inject(SectionStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  form!: FormGroup;
  current: Section | null = null;

  shiftOptions = [
    { value: 'morning', label: 'Mañana' },
    { value: 'afternoon', label: 'Tarde' },
    { value: 'evening', label: 'Noche' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required]],
      capacity: [this.current?.capacity ?? null],
      shift: [this.current?.shift ?? 'morning'],
      tutor: [this.current?.tutor ?? ''],
      classroom: [this.current?.classroom ?? ''],
      availableSlots: [this.current?.availableSlots ?? 0],
      grade: [this.resolveGradeId(this.current) ?? null, [Validators.required]],
      yearAcademic: [this.resolveYearId(this.current) ?? null, [Validators.required]],
    });
  }

  private resolveGradeId(s?: Section | null): string | null {
    if (!s) return null;
    if (s.gradeId) return s.gradeId;
    if (!s.grade) return null;
    return typeof s.grade === 'string' ? s.grade : (s.grade?.id ?? null);
  }

  private resolveYearId(s?: Section | null): string | null {
    if (!s) return null;
    if (s.yearAcademicId) return s.yearAcademicId;
    if (!s.yearAcademic) return null;
    return typeof s.yearAcademic === 'string'
      ? s.yearAcademic
      : ((s.yearAcademic as { id?: string })?.id ?? null);
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const capacityVal = raw.capacity != null && raw.capacity !== '' ? Number(raw.capacity) : null;
    const availableSlotsVal =
      raw.availableSlots != null && raw.availableSlots !== '' ? Number(raw.availableSlots) : 0;

    const v: SectionCreate = {
      name: raw.name,
      grade: raw.grade,
      yearAcademic: raw.yearAcademic,
      shift: raw.shift,
      tutor: raw.tutor ?? '',
      classroom: raw.classroom ?? '',
      availableSlots: Math.max(
        0,
        Math.floor(Number.isNaN(availableSlotsVal) ? 0 : availableSlotsVal),
      ),
    };
    if (capacityVal != null && !Number.isNaN(capacityVal)) {
      const cap = Math.floor(capacityVal);
      if (cap >= 1 && cap <= 100) v.capacity = cap;
    }
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
