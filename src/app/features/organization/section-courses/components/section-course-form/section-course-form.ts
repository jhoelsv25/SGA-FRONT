import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { SectionCourseStore } from '../../services/store/section-course.store';
import type { SectionCourse, SectionCourseCreate } from '../../types/section-course-types';
import { SectionApi } from '@features/organization/sections/services/api/section-api';
import { CourseApi } from '@features/academic-setup/courses/services/course-api';
import { YearAcademicApi } from '@features/academic-setup/year-academic/services/api/year-academic-api';
import type { SelectOption } from '@shared/ui/select/select';
import { Observable } from 'rxjs';

const MODALITY_OPTIONS: SelectOption[] = [
  { value: 'online', label: 'En línea' },
  { value: 'offline', label: 'Presencial' },
  { value: 'hybrid', label: 'Híbrido' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'suspended', label: 'Suspendido' },
];

@Component({
  selector: 'sga-section-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, Input, Select, Button],
  templateUrl: './section-course-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCourseForm implements OnInit {
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);
  private store = inject(SectionCourseStore);
  private sectionApi = inject(SectionApi);
  private courseApi = inject(CourseApi);
  private yearApi = inject(YearAcademicApi);

  current: SectionCourse | null = null;
  saving = signal(false);
  sectionOptions = signal<SelectOption[]>([]);
  courseOptions = signal<SelectOption[]>([]);
  yearOptions = signal<SelectOption[]>([]);

  modalityOptions = MODALITY_OPTIONS;
  statusOptions = STATUS_OPTIONS;

  title = computed(() => (this.current ? 'Editar asignación' : 'Asignar curso a sección'));
  subTitle = computed(() => 'Complete el formulario para continuar');

  form: FormGroup = this.fb.group({
    modality: ['online', Validators.required],
    maxStudents: [30, [Validators.required, Validators.min(1)]],
    enrolledStudents: [0, [Validators.required, Validators.min(0)]],
    status: ['active', Validators.required],
    academicYear: [null as string | null, Validators.required],
    section: [null as string | null, Validators.required],
    course: [null as string | null, Validators.required],
  });

  ngOnInit() {
    this.current = this.data?.current ?? null;
    if (this.current) {
      this.form.patchValue({
        modality: this.current.modality ?? 'online',
        maxStudents: this.current.maxStudents ?? 30,
        enrolledStudents: this.current.enrolledStudents ?? 0,
        status: this.current.status ?? 'active',
        academicYear: this.current.academicYear?.id ?? null,
        section: this.current.section?.id ?? null,
        course: this.current.course?.id ?? null,
      });
    }
    this.sectionApi.getAll().subscribe((res) => {
      const list = (res.data ?? []) as { id: string; name?: string }[];
      this.sectionOptions.set(list.map((s) => ({ value: s.id, label: s.name ?? s.id })));
    });
    this.courseApi.getAll({}).subscribe((res) => {
      const list = (res.data ?? []) as { id: string; name?: string }[];
      this.courseOptions.set(list.map((c) => ({ value: c.id, label: c.name ?? c.id })));
    });
    this.yearApi.getAll({}).subscribe((res) => {
      const list = (res.data ?? []) as { id: string; name?: string; year?: number }[];
      this.yearOptions.set(list.map((y) => ({ value: y.id, label: y.name ?? String(y.year ?? y.id) })));
    });
  }

  onClose() {
    this.ref.close();
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue() as {
      modality: string;
      maxStudents: number;
      enrolledStudents: number;
      status: string;
      academicYear: string;
      section: string;
      course: string;
    };
    const payload: SectionCourseCreate = {
      modality: v.modality,
      maxStudents: Number(v.maxStudents),
      enrolledStudents: Number(v.enrolledStudents),
      status: v.status,
      academicYear: v.academicYear,
      section: v.section,
      course: v.course,
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
