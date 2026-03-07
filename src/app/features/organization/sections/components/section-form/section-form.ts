import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { SectionStore } from '../../services/store/section.store';
import { Section, SectionCreate } from '../../types/section-types';
import { YearAcademicApi } from '@features/academic-setup/year-academic/services/api/year-academic-api';
import { GradeLevelApi } from '@features/academic-setup/grade-levels/services/api/grade-level-api';

@Component({
  selector: 'sga-section-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, Select, Input],
  templateUrl: './section-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionForm implements OnInit {
  private store = inject(SectionStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private yearApi = inject(YearAcademicApi);
  private gradeLevelApi = inject(GradeLevelApi);

  form!: FormGroup;
  current: Section | null = null;
  yearOptions: { value: string; label: string }[] = [];
  gradeOptions: { value: string; label: string }[] = [];

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

    this.yearApi.getAll({}).subscribe((res) => {
      this.yearOptions = (res.data ?? []).map((y: { id: string; name?: string; year?: number }) => ({
        value: y.id,
        label: y.name ?? String(y.year ?? y.id),
      }));
    });
    this.gradeLevelApi.getAll().subscribe({
      next: (list) => {
        this.gradeOptions = (list ?? []).map((g) => ({
          value: g.id,
          label: g.name ?? `${g.gradeNumber}° ${this.getLevelLabel(g.level)}`,
        }));
      },
    });
  }

  private getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      primary: 'Primaria',
      secondary: 'Secundaria',
      higher: 'Superior',
    };
    return labels[level] || level;
  }

  private resolveGradeId(s?: Section | null): string | null {
    if (!s?.grade) return null;
    return typeof s.grade === 'string' ? s.grade : s.grade?.id ?? null;
  }

  private resolveYearId(s?: Section | null): string | null {
    if (!s?.yearAcademic) return null;
    return typeof s.yearAcademic === 'string' ? s.yearAcademic : (s.yearAcademic as { id?: string })?.id ?? null;
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const capacityVal = raw.capacity != null && raw.capacity !== '' ? Number(raw.capacity) : null;
    const availableSlotsVal = raw.availableSlots != null && raw.availableSlots !== '' ? Number(raw.availableSlots) : 0;

    const v: SectionCreate = {
      name: raw.name,
      grade: raw.grade,
      yearAcademic: raw.yearAcademic,
      shift: raw.shift,
      tutor: raw.tutor ?? '',
      classroom: raw.classroom ?? '',
      availableSlots: Math.max(0, Math.floor(Number.isNaN(availableSlotsVal) ? 0 : availableSlotsVal)),
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
