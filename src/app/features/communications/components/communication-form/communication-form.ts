import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Select, SelectOption } from '@shared/ui/select/select';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication, CommunicationCreate } from '../../types/communication-types';

@Component({
  selector: 'sga-communication-form',
  imports: [ReactiveFormsModule, Button, Input, Select],
  templateUrl: './communication-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationForm implements OnInit {
  private store = inject(CommunicationStore);
  private data = inject(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Communication | null = null;

  typeOptions: SelectOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'notification', label: 'Notificación' },
    { value: 'announcement', label: 'Anuncio' },
    { value: 'other', label: 'Otro' },
  ];

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
