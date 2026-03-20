import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { SectionCourseStore } from '../../services/store/section-course.store';
import type { SectionCourse, SectionCourseCreate } from '../../types/section-course-types';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs';
import { MODALITY_OPTIONS, STATUS_OPTIONS } from '../../config/form.constants';
import { SectionApi } from '../../../sections/services/api/section-api';
import { CourseApi } from '../../../courses/services/course-api';
import { YearAcademicApi } from '../../../year-academic/services/api/year-academic-api';
import { TeacherApi } from '../../../teachers/services/api/teacher-api';
import { Section } from '../../../sections/types/section-types';
import { Course } from '../../../courses/types/course-types';
import { YearAcademic } from '../../../year-academic/types/year-academi-types';
import { Teacher } from '../../../teachers/types/teacher-types';
import { DataResponse } from '@core/types/pagination-types';


@Component({
  selector: 'sga-section-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ZardInputDirective, SelectOptionComponent, ZardButtonComponent],
  templateUrl: './section-course-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCourseForm implements OnInit {
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private store = inject(SectionCourseStore);
  private cdr = inject(ChangeDetectorRef);
  private sectionApi = inject(SectionApi);
  private courseApi = inject(CourseApi);
  private yearAcademicApi = inject(YearAcademicApi);
  private teacherApi = inject(TeacherApi);

  current: SectionCourse | null = null;
  saving = signal(false);

  modalityOptions = MODALITY_OPTIONS;
  statusOptions = STATUS_OPTIONS;
  sectionOptions = signal<SelectOption[]>([]);
  courseOptions = signal<SelectOption[]>([]);
  academicYearOptions = signal<SelectOption[]>([]);
  teacherOptions = signal<SelectOption[]>([]);
  teacherPage = 1;
  readonly teacherPageSize = 30;
  teacherHasMore = signal(true);
  teacherLoadingMore = signal(false);

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
    teacher: [null as string | null],
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
        teacher: this.current.teacher ? (typeof this.current.teacher === 'string' ? this.current.teacher : this.current.teacher?.id) : null,
      });
    }
    this.loadOptions();
    this.loadMoreTeachers();
    this.cdr.markForCheck();
  }

  private loadOptions() {
    forkJoin({
      sections: this.sectionApi.getAll({}),
      courses: this.courseApi.getAll({}),
      years: this.yearAcademicApi.getAll({}),
    }).subscribe({
      next: ({ sections, courses, years }) => {
        this.sectionOptions.set((sections.data ?? []).map((item: Section) => ({
          value: item.id,
          label: item.name ? `Sección ${item.name}` : item.id,
        })));
        this.courseOptions.set((courses.data ?? []).map((item: Course) => ({
          value: item.id,
          label: item.code ? `${item.code} · ${item.name}` : item.name,
        })));
        this.academicYearOptions.set((years.data ?? []).map((item: YearAcademic) => ({
          value: item.id,
          label: item.name,
        })));
        this.cdr.markForCheck();
      },
    });
  }

  loadMoreTeachers() {
    if (!this.teacherHasMore() || this.teacherLoadingMore()) return;
    this.teacherLoadingMore.set(true);
    this.teacherApi.getAll({ page: this.teacherPage, size: this.teacherPageSize }).subscribe({
      next: (teachers) => {
        const options = (teachers.data ?? []).map((item: Teacher) => ({
          value: item.id,
          label: this.getTeacherOptionLabel(item),
        }));
        this.teacherOptions.update((current) => [...current, ...options]);
        const loaded = this.teacherOptions().length;
        this.teacherHasMore.set(loaded < (teachers.total ?? loaded));
        this.teacherPage += 1;
        this.teacherLoadingMore.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.teacherLoadingMore.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private getTeacherOptionLabel(item: Teacher): string {
    const person = typeof item.person === 'object' ? item.person : null;
    const name = [person?.['firstName' as keyof typeof person], person?.['lastName' as keyof typeof person]]
      .filter(Boolean)
      .join(' ');
    return name
      ? `${item.teacherCode} · ${name}`
      : `${item.teacherCode} · ${item.specialization}`;
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
      teacher: string | null;
    };
    const payload: SectionCourseCreate = {
      modality: v.modality,
      maxStudents: Number(v.maxStudents),
      enrolledStudents: Number(v.enrolledStudents),
      status: v.status,
      academicYear: v.academicYear,
      section: v.section,
      course: v.course,
      ...(v.teacher && { teacher: v.teacher }),
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
