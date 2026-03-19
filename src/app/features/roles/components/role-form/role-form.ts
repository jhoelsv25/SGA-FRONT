import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ZardInputGroupComponent } from '@shared/components/input-group';
import { ZardSwitchComponent } from '@shared/components/switch';
import { Role } from '@features/admin-services/api/role-api';

interface RoleFormData {
  current: Role | null;
  title?: string;
}


@Component({
  selector: 'sga-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, ZardInputGroupComponent, ZardSwitchComponent],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleForm implements OnInit {
  private data = inject<RoleFormData>(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
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
