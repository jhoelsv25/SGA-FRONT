import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Role } from '../../../services/api/role-api';
import { Card } from '@shared/ui/card/card';

interface RoleFormData {
  current: Role | null;
  title?: string;
}

@Component({
  selector: 'sga-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Input, Card],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleForm implements OnInit {
  private data = inject<RoleFormData>(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Role | null = null;
  title = 'Nuevo Rol';

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.title = this.data?.title || (this.current ? 'Editar Rol' : 'Nuevo Rol');

    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required, Validators.minLength(3)]],
      description: [this.current?.description ?? ''],
      isActive: [this.current?.isActive ?? true],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.ref.close(this.form.value);
  }

  close() {
    this.ref.close();
  }
}
