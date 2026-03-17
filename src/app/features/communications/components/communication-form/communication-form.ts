export type LocalSelectOption = { value: string | number; label: string; [key: string]: any };
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication, CommunicationCreate } from '../../types/communication-types';


@Component({
  selector: 'sga-communication-form',
  imports: [ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, SelectOptionComponent],
  templateUrl: './communication-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationForm implements OnInit {
  private store = inject(CommunicationStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Communication | null = null;

  typeOptions: LocalSelectOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'notification', label: 'Notificación' },
    { value: 'announcement', label: 'Anuncio' },
    { value: 'other', label: 'Otro' }];

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      subject: [this.current?.subject ?? '', [Validators.required]],
      body: [this.current?.body ?? ''],
      type: [this.current?.type ?? 'notification', [Validators.required]],
      scheduledAt: [this.current?.sentAt?.slice(0, 16) ?? ''],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value as CommunicationCreate;
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
}
