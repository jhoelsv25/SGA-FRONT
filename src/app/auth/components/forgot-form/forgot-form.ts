import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { Component, inject, signal, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { format } from 'date-fns';
import { AuthApi } from '@auth/services/api/auth-api';


@Component({
  selector: 'sga-forgot-form',
  imports: [RouterLinkWithHref, ReactiveFormsModule, ZardButtonComponent, ZardInputDirective, ZardDatePickerComponent],
  templateUrl: './forgot-form.html',
})
export class ForgotForm {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);

  readonly loading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  /** Fecha máxima para fecha de nacimiento (hoy) */
  maxBirthdate = signal<Date>(new Date());

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    birthdate: [null as Date | null, [Validators.required]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, birthdate } = this.form.getRawValue();
    const birthdateStr = birthdate instanceof Date ? format(birthdate, 'yyyy-MM-dd') : '';
    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authApi.forgotPassword(username ?? '', birthdateStr).subscribe({
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
