import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { Card } from '@shared/adapters/ui/card/card';
import { Input } from '@shared/adapters/ui/input/input';
import { Button } from '@shared/directives';

@Component({
  selector: 'sga-account-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Card, Input, Button],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="space-y-4">
            <span class="inline-flex w-fit items-center rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-destructive">
              Seguridad de acceso
            </span>
            <div>
              <h1 class="text-3xl font-semibold tracking-tight text-foreground">Cambiar contrasena</h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Actualiza tu clave para proteger sesiones, aprobaciones y operaciones sensibles dentro del sistema academico.
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            @for (item of sideNotes(); track item.label) {
              <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-sm font-semibold text-foreground">{{ item.value }}</p>
                <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ item.helper }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <sga-card class="overflow-hidden">
          <div class="border-border/70 border-b p-6">
            <h2 class="text-lg font-semibold text-foreground">Actualizar credenciales</h2>
            <p class="mt-1 text-sm text-muted-foreground">Usa una contrasena robusta y evita reutilizar claves antiguas.</p>
          </div>

          <form [formGroup]="form" class="space-y-5 p-6" (ngSubmit)="submit()">
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="currentPassword">Contrasena actual</label>
              <sga-input id="currentPassword" type="password" formControlName="currentPassword" placeholder="Ingresa tu contrasena actual" />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="newPassword">Nueva contrasena</label>
              <sga-input id="newPassword" type="password" formControlName="newPassword" placeholder="Minimo 6 caracteres" />
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground" for="confirmPassword">Confirmar nueva contrasena</label>
              <sga-input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repite la nueva contrasena" />
            </div>

            @if (error()) {
              <div class="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {{ error() }}
              </div>
            }

            @if (success()) {
              <div class="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                {{ success() }}
              </div>
            }

            <div class="flex flex-wrap justify-end gap-3 pt-2">
              <a
                routerLink="/account/settings"
                class="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                <i class="fa-solid fa-arrow-left"></i>
                Volver a configuracion
              </a>
              <button type="submit" sgaButton color="primary" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Actualizando...' : 'Actualizar contrasena' }}
              </button>
            </div>
          </form>
        </sga-card>

        <div class="space-y-6">
          <sga-card>
            <div class="border-border/70 border-b p-5">
              <h2 class="text-base font-semibold text-foreground">Buenas practicas</h2>
            </div>
            <div class="space-y-3 p-5">
              @for (item of securityTips; track item) {
                <div class="flex items-start gap-3 rounded-[1.25rem] border border-border bg-background/80 p-4">
                  <span class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <i class="fa-solid fa-check"></i>
                  </span>
                  <p class="text-sm leading-6 text-muted-foreground">{{ item }}</p>
                </div>
              }
            </div>
          </sga-card>
        </div>
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
  protected readonly sideNotes = computed(() => [
    {
      label: 'Usuario',
      value: this.currentUser()?.username || 'No definido',
      helper: 'Cuenta autenticada en esta sesion.',
    },
    {
      label: 'Rol',
      value: this.currentUser()?.role?.name || 'Sin rol',
      helper: 'Nivel operativo con acceso actual.',
    },
    {
      label: 'Canal',
      value: this.currentUser()?.email || this.currentUser()?.person?.email || 'Sin correo',
      helper: 'Contacto para alertas de seguridad.',
    },
  ]);
  protected readonly securityTips = [
    'Usa una clave unica para este sistema y evita repetirla en otros servicios.',
    'Si cambiaste de equipo o compartiste navegador, actualiza la contrasena y revisa tus sesiones.',
    'Combina letras, numeros y simbolos para aumentar la resistencia de la clave.',
  ];

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
