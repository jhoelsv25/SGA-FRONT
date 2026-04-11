export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { InstitutionSelect, PersonSelect } from '@/shared/widgets/selects';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UploadApi } from '@core/services/api/upload-api';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import { TeacherStore } from '../../services/store/teacher.store';
import {
  Teacher,
  TeacherContractType,
  TeacherCreate,
  TeacherEmploymentStatus,
  TeacherLaborRegime,
  TeacherWorkloadType,
} from '../../types/teacher-types';

@Component({
  selector: 'sga-teacher-form',

  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
    InstitutionSelect,
    PersonSelect,
  ],
  templateUrl: './teacher-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherForm implements OnInit {
  private store = inject(TeacherStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);
  private institutionApi = inject(InstitutionApi);
  private http = inject(HttpClient);
  private uploadApi = inject(UploadApi);

  form!: FormGroup;
  current: Teacher | null = null;
  readonly uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  readonly currentYear = new Date().getFullYear();
  personPhotoUrl = '';
  photoUploading = false;

  contractTypeOptions: LocalSelectOption[] = [
    { value: 'full_time' satisfies TeacherContractType, label: 'Tiempo completo' },
    { value: 'part_time' satisfies TeacherContractType, label: 'Medio tiempo' },
    { value: 'temporary' satisfies TeacherContractType, label: 'Temporal' },
    { value: 'permanent' satisfies TeacherContractType, label: 'Permanente' },
  ];
  laborRegimeOptions: LocalSelectOption[] = [
    { value: 'public' satisfies TeacherLaborRegime, label: 'Público' },
    { value: 'private' satisfies TeacherLaborRegime, label: 'Privado' },
  ];
  workloadTypeOptions: LocalSelectOption[] = [
    { value: '20_hours' satisfies TeacherWorkloadType, label: '20 horas' },
    { value: '30_hours' satisfies TeacherWorkloadType, label: '30 horas' },
    { value: '40_hours' satisfies TeacherWorkloadType, label: '40 horas' },
  ];
  employmentStatusOptions: LocalSelectOption[] = [
    { value: 'active' satisfies TeacherEmploymentStatus, label: 'Activo' },
    { value: 'inactive' satisfies TeacherEmploymentStatus, label: 'Inactivo' },
    { value: 'on_leave' satisfies TeacherEmploymentStatus, label: 'Licencia' },
  ];

  private getEntityId(value: string | { id: string } | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.id;
  }

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      teacherCode: [
        this.current?.teacherCode ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      specialization: [
        this.current?.specialization ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      professionalTitle: [
        this.current?.professionalTitle ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      university: [
        this.current?.university ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      graduationYear: [
        this.current?.graduationYear ?? this.currentYear,
        [Validators.required, Validators.min(1900), Validators.max(this.currentYear + 1)],
      ],
      professionalLicense: [
        this.current?.professionalLicense ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      contractType: [this.current?.contractType ?? 'full_time', [Validators.required]],
      laborRegime: [this.current?.laborRegime ?? 'public', [Validators.required]],
      hireDate: [
        this.current?.hireDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        [Validators.required],
      ],
      terminationDate: [this.current?.terminationDate?.slice(0, 10) ?? ''],
      workloadType: [this.current?.workloadType ?? '40_hours', [Validators.required]],
      weeklyHours: [
        this.current?.weeklyHours ?? 40,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      teachingLevel: [
        this.current?.teachingLevel ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      employmentStatus: [this.current?.employmentStatus ?? 'active', [Validators.required]],
      institution: [
        this.getEntityId(this.current?.institution),
        [Validators.required, Validators.pattern(this.uuidPattern)],
      ],
      person: [
        this.getEntityId(this.current?.person),
        [Validators.required, Validators.pattern(this.uuidPattern)],
      ],
    });

    this.personPhotoUrl =
      (typeof this.current?.person === 'string' ? '' : this.current?.person?.photoUrl) ?? '';
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue() as TeacherCreate;
    const payload: TeacherCreate = {
      ...v,
      photoUrl: this.personPhotoUrl || undefined,
      terminationDate: v.terminationDate || undefined,
    };
    const personId = String(this.form.get('person')?.value || '');
    const persistPhoto = () => {
      if (!personId || !this.personPhotoUrl) {
        this.ref.close();
        return;
      }
      this.http.patch(`persons/${personId}`, { photoUrl: this.personPhotoUrl }).subscribe({
        next: () => this.ref.close(),
        error: () => this.ref.close(),
      });
    };

    if (this.current?.id) {
      this.store.update(this.current.id, payload).subscribe({
        next: () => persistPhoto(),
      });
    } else {
      this.store.create(payload).subscribe({
        next: () => persistPhoto(),
      });
    }
  }

  close() {
    this.ref.close();
  }

  onPersonPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoUploading = true;
    this.uploadApi
      .upload(file, {
        category: 'persons',
        entityCode: this.form.get('teacherCode')?.value || this.current?.teacherCode || undefined,
        preserveName: false,
      })
      .subscribe({
        next: (res) => {
          this.personPhotoUrl = res.url;
          this.photoUploading = false;
          input.value = '';
        },
        error: () => {
          this.photoUploading = false;
          input.value = '';
        },
      });
  }
}
