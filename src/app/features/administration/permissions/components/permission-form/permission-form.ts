import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';
import { Input } from '@shared/ui/input/input';
import { Permission } from '../../../services/api/permission-api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@shared/ui/card/card';

interface PermissionFormData {
  current: Permission | null;
  title?: string;
}

@Component({
  selector: 'sga-permission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Input, Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter],
  templateUrl: './permission-form.html',
  styleUrls: ['./permission-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionForm implements OnInit {
  private data = inject<PermissionFormData>(DIALOG_DATA, { optional: true });
  private ref = inject(DialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: Permission | null = null;
  title = 'Nuevo Permiso';

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.title = this.data?.title || (this.current ? 'Editar Permiso' : 'Nuevo Permiso');

    this.form = this.fb.group({
      name: [this.current?.name ?? '', [Validators.required, Validators.minLength(3)]],
      slug: [this.current?.slug ?? '', [Validators.required]],
      module: [this.current?.module ?? '', [Validators.required]],
      scope: [this.current?.scope ?? 'global', [Validators.required]],
      description: [this.current?.description ?? ''],
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
