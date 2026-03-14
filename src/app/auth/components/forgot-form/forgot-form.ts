import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { AuthApi } from '@auth/services/api/auth-api';
import { Button } from '@shared/directives';
import { Input } from '@shared/adapters/ui/input/input';

@Component({
  selector: 'sga-forgot-form',
  imports: [RouterLinkWithHref, ReactiveFormsModule, Button, Input],
  templateUrl: './forgot-form.html',
})
export class ForgotForm {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);

  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    birthdate: ['', [Validators.required]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, birthdate } = this.form.getRawValue();
    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authApi.forgotPassword(username ?? '', birthdate ?? '').subscribe({
      next: () => {
        this.successMessage.set('Solicitud enviada. Revisa el flujo definido por tu institucion para continuar con la recuperacion.');
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo procesar la solicitud. Verifica los datos ingresados.');
        this.loading.set(false);
      },
    });
  }
}
