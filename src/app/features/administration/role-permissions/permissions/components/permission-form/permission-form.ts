import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardFormImports } from '@/shared/components/form';
import { ZardSelectImports } from '@/shared/components/select';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Permission } from '../../../../services/api/permission-api';

interface PermissionFormData {
  current: Permission | null;
  title?: string;
}

@Component({
  selector: 'sga-permission-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardIconComponent,
    ...ZardFormImports,
    ...ZardSelectImports,
  ],
  templateUrl: './permission-form.html',
  styleUrls: ['./permission-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionForm implements OnInit {
  private data = inject<PermissionFormData>(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
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
