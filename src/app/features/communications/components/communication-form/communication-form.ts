export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { SectionSelect } from '@/shared/widgets/selects';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication, CommunicationCreate } from '../../types/communication-types';
import { SectionApi } from '@features/sections/services/api/section-api';
import { Section } from '@features/sections/types/section-types';

@Component({
  selector: 'sga-communication-form',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
    SectionSelect,
  ],
  templateUrl: './communication-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationForm implements OnInit {
  private store = inject(CommunicationStore);
  private sectionApi = inject(SectionApi);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Communication | null = null;
  sectionOptions: LocalSelectOption[] = [];
  sendModeOptions: LocalSelectOption[] = [
    { value: 'now', label: 'Enviar ahora' },
    { value: 'scheduled', label: 'Programar envío' },
  ];

  typeOptions: LocalSelectOption[] = [{ value: 'announcement', label: 'Anuncio' }];

  audienceOptions: LocalSelectOption[] = [
    { value: 'students', label: 'Estudiantes' },
    { value: 'teachers', label: 'Docentes' },
    { value: 'guardians', label: 'Apoderados' },
    { value: 'all', label: 'Todos' },
  ];

  priorityOptions: LocalSelectOption[] = [
    { value: 'high', label: '🔴 Alta — urgente' },
    { value: 'medium', label: '🟡 Media — general' },
    { value: 'low', label: '🟢 Baja — informativo' },
  ];

  statusOptions: LocalSelectOption[] = [
    { value: 'published', label: 'Publicar ahora' },
    { value: 'draft', label: 'Guardar como borrador' },
  ];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    const initialScheduledAt = this.current?.sentAt
      ? this.toDateTimeLocal(this.current.sentAt)
      : '';
    const initialSendMode =
      this.current?.status === 'scheduled' || initialScheduledAt ? 'scheduled' : 'now';
    this.form = this.fb.group({
      subject: [this.current?.subject ?? '', [Validators.required]],
      body: [this.current?.body ?? ''],
      type: [this.current?.type ?? 'announcement', [Validators.required]],
      audience: [this.current?.audience ?? 'students', [Validators.required]],
      status: [this.current?.status === 'draft' ? 'draft' : 'published', [Validators.required]],
      sendMode: [initialSendMode, [Validators.required]],
      sectionId: [this.current?.sectionId ?? ''],
      scheduledAt: [initialScheduledAt],
      priority: ['medium'],
      attachmentUrl: [''],
    });

    this.form.get('sendMode')?.valueChanges.subscribe((mode) => {
      const statusControl = this.form.get('status');
      const scheduledAtControl = this.form.get('scheduledAt');
      if (mode === 'scheduled') {
        statusControl?.setValue('published', { emitEvent: false });
        scheduledAtControl?.addValidators([Validators.required]);
      } else {
        scheduledAtControl?.clearValidators();
        scheduledAtControl?.setValue('', { emitEvent: false });
        if (statusControl?.value !== 'draft') {
          statusControl?.setValue('published', { emitEvent: false });
        }
      }
      scheduledAtControl?.updateValueAndValidity({ emitEvent: false });
    });

    this.sectionApi.getAll().subscribe({
      next: (res) => {
        this.sectionOptions = (res.data ?? []).map((section: Section) => ({
          value: section.id,
          label: section.name,
        }));
      },
    });
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const v: CommunicationCreate = {
      subject: raw.subject,
      body: raw.body,
      type: raw.type,
      audience: raw.audience,
      sectionId: raw.sectionId || null,
      scheduledAt: raw.sendMode === 'scheduled' ? raw.scheduledAt : undefined,
      status: raw.status,
      priority: raw.priority || 'medium',
      ...(raw.attachmentUrl?.trim() ? { attachmentUrl: raw.attachmentUrl.trim() } : {}),
    };
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

  private toDateTimeLocal(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
