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
import { MODALITY_OPTIONS, STATUS_OPTIONS } from '../../config/form.constants';


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

  current: SectionCourse | null = null;
  saving = signal(false);

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
    this.cdr.markForCheck();
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
