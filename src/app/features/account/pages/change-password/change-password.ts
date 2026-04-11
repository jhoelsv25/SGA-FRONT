import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ZardIconComponent } from '@shared/components/icon';
import { ZardInputDirective } from '@shared/components/input';

@Component({
  selector: 'sga-account-change-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ZardInputDirective, ZardIconComponent],
  templateUrl: './change-password.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccountChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly authFacade = inject(AuthFacade);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly currentUser = computed(() => this.authFacade.getCurrentUser());
  protected readonly summaryRows = computed(() => [
    {
      label: 'Usuario',
      value: this.currentUser()?.username || 'No definido',
    },
    {
      label: 'Rol',
      value: this.currentUser()?.role?.name || 'Sin rol',
    },
    {
      label: 'Correo',
      value: this.currentUser()?.email || this.currentUser()?.person?.email || 'Sin correo',
    },
  ]);

  protected readonly form = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit() {
    this.error.set(null);
    this.success.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('La confirmacion no coincide con la nueva contrasena.');
      return;
    }

    const userId = this.authFacade.getCurrentUser()?.id;
    if (!userId) {
      this.error.set('No se pudo identificar al usuario actual.');
      return;
    }

    this.loading.set(true);
    this.authApi.changePassword(userId, currentPassword!, newPassword!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Contrasena actualizada correctamente.');
        this.form.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'No se pudo actualizar la contrasena.');
      },
    });
  }
}
