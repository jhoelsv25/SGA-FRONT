import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';


@Component({
  selector: 'sga-account-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ZardCardComponent, ZardButtonComponent],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">Cambiar contrasena</h1>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Actualiza tu clave de acceso y mantén protegida tu cuenta.
        </p>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <z-card class="overflow-hidden">
          <div class="border-border/70 border-b p-6">
            <h2 class="text-xl font-semibold text-foreground">Actualizar credenciales</h2>
            <p class="mt-1 text-sm text-muted-foreground">Usa una contrasena nueva y evita repetir claves antiguas.</p>
          </div>

          <form [formGroup]="form" class="space-y-5 p-6" (ngSubmit)="submit()">
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="currentPassword">Contrasena actual</label>
              <z-input id="currentPassword" type="password" formControlName="currentPassword" placeholder="Ingresa tu contrasena actual" />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="newPassword">Nueva contrasena</label>
              <z-input id="newPassword" type="password" formControlName="newPassword" placeholder="Minimo 6 caracteres" />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="confirmPassword">Confirmar nueva contrasena</label>
              <z-input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repite la nueva contrasena" />
            </div>

            @if (error()) {
              <div class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {{ error() }}
              </div>
            }

            @if (success()) {
              <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                {{ success() }}
              </div>
            }

            <div class="flex flex-wrap justify-end gap-3 pt-2">
              <a
                routerLink="/account/settings"
                class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Volver a configuracion
              </a>
              <button type="submit" z-button color="primary" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Actualizando...' : 'Actualizar contrasena' }}
              </button>
            </div>
          </form>
        </z-card>

        <z-card>
          <div class="border-border/70 border-b p-6">
            <h2 class="text-lg font-semibold text-foreground">Resumen</h2>
          </div>

          <div class="space-y-3 p-6">
            @for (item of summaryRows(); track item.label) {
              <div class="rounded-xl border border-border bg-background/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-sm font-medium text-foreground">{{ item.value }}</p>
              </div>
            }
          </div>
        </z-card>
      </div>
    </div>
  `,
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
    }]);

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
