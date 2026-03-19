import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStore } from '@features/admin-services/store/user.store';
import { User, UserCreate } from '../../types/user-types';

import { ZardFormImports } from '@/shared/components/form';

@Component({
  selector: 'sga-user-form',
  imports: [
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardIconComponent,
    ...ZardFormImports,
  ],
  templateUrl: './user-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private store = inject(UserStore);
  private data = inject(Z_MODAL_DATA, { optional: true });
  private ref = inject(ZardDialogRef);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  current: User | null = null;

  ngOnInit() {
    this.current = this.data?.current ?? null;
    this.form = this.fb.group({
      username: [this.current?.username ?? '', [Validators.required]],
      firstName: [this.current?.firstName ?? '', [Validators.required]],
      lastName: [this.current?.lastName ?? '', [Validators.required]],
      email: [this.current?.email ?? '', [Validators.required, Validators.email]],
      password: ['', this.current ? [] : [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    if (this.current?.id) {
      // No incluimos el password en la actualización por petición del usuario
      const { password, ...payload } = v;
      this.store.update(String(this.current.id), payload).subscribe({
        next: () => this.ref.close(),
      });
    } else {
      this.store.create(v as UserCreate).subscribe({
        next: () => this.ref.close(),
      });
    }
  }

  close() {
    this.ref.close();
  }
}
