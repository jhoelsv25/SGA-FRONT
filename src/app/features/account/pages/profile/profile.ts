import { ZardCardComponent } from '@/shared/components/card';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthFacade } from '@auth/services/store/auth.acede';


@Component({
  selector: 'sga-account-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardCardComponent],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            @if (avatarUrl()) {
              <img
                [src]="avatarUrl()!"
                [alt]="displayName()"
                class="h-20 w-20 rounded-[1.5rem] border border-border object-cover"
              />
            } @else {
              <div class="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/10 text-xl font-semibold text-primary">
                {{ initials() }}
              </div>
            }

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {{ profileLabel() }}
                </span>
                <span class="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {{ user()?.role?.name || 'Cuenta institucional' }}
                </span>
              </div>

              <h1 class="mt-3 truncate text-3xl font-semibold tracking-tight text-foreground">{{ displayName() }}</h1>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ primaryEmail() }}</p>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ summary() }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <a
              routerLink="/account/settings"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Ajustes
            </a>
            <a
              routerLink="/account/change-password"
              class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
            >
              Seguridad
            </a>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <z-card>
          <div class="border-border/70 border-b p-6">
            <h2 class="text-xl font-semibold text-foreground">Datos personales</h2>
            <p class="mt-1 text-sm text-muted-foreground">Informacion principal de la cuenta autenticada.</p>
          </div>

          <div class="grid gap-4 p-6 md:grid-cols-2">
            @for (item of profileRows(); track item.label) {
              <div class="rounded-xl border border-border bg-background/80 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-sm font-medium leading-6 text-foreground">{{ item.value }}</p>
              </div>
            }
          </div>
        </z-card>

        <div class="space-y-6">
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

          <z-card>
            <div class="border-border/70 border-b p-6">
              <h2 class="text-lg font-semibold text-foreground">Accesos</h2>
            </div>

            <div class="space-y-3 p-6">
              <a
                routerLink="/account/settings"
                class="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-4 transition hover:border-primary/30 hover:bg-muted"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">Configuracion</p>
                  <p class="mt-1 text-xs text-muted-foreground">Preferencias, sesiones y actividad.</p>
                </div>
                <i class="fa-solid fa-arrow-right text-muted-foreground"></i>
              </a>

              <a
                routerLink="/account/change-password"
                class="flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-4 transition hover:border-primary/30 hover:bg-muted"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">Cambiar contrasena</p>
                  <p class="mt-1 text-xs text-muted-foreground">Actualiza tus credenciales de acceso.</p>
                </div>
                <i class="fa-solid fa-lock text-muted-foreground"></i>
              </a>
            </div>
          </z-card>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccountProfilePage {
  private readonly authFacade = inject(AuthFacade);

  protected readonly user = computed(() => this.authFacade.getCurrentUser());
  protected readonly modules = computed(() => this.authFacade.getModules());
  protected readonly displayName = computed(() => {
    const user = this.user();
    const firstName = user?.firstName || user?.person?.firstName || '';
    const lastName = user?.lastName || user?.person?.lastName || '';
    return `${firstName} ${lastName}`.trim() || user?.username || 'Usuario';
  });
  protected readonly initials = computed(() => {
    const parts = this.displayName().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
  });
  protected readonly avatarUrl = computed(() => {
    const user = this.user();
    return user?.profilePicture || user?.person?.photoUrl || null;
  });
  protected readonly primaryEmail = computed(() => {
    const user = this.user();
    return user?.email || user?.person?.email || 'Sin correo institucional';
  });
  protected readonly profileLabel = computed(() => this.user()?.profile?.roleLabel || 'Perfil institucional');
  protected readonly location = computed(() => {
    const person = this.user()?.person;
    const parts = [person?.district, person?.province, person?.department].filter(Boolean);
    return parts.length ? parts.join(', ') : 'No registrada';
  });
  protected readonly summary = computed(() => {
    const institution = this.user()?.profile?.institution;
    if (institution) {
      return `Cuenta asociada a ${institution}.`;
    }
    return 'Cuenta autenticada dentro del sistema academico.';
  });
  protected readonly profileRows = computed(() => {
    const user = this.user();
    const person = user?.person;
    return [
      { label: 'Nombre', value: this.displayName() },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Correo', value: this.primaryEmail() },
      { label: 'Rol', value: user?.role?.name || 'Sin rol' },
      { label: 'Codigo', value: user?.code || user?.profile?.code || 'No registrado' },
      { label: 'Telefono', value: person?.mobile || person?.phone || 'No registrado' },
      { label: 'Direccion', value: person?.address || 'No registrada' },
      { label: 'Ubicacion', value: this.location() }];
  });
  protected readonly summaryRows = computed(() => [
    { label: 'Institucion', value: this.user()?.profile?.institution || 'No asignada' },
    { label: 'Perfil', value: this.profileLabel() },
    { label: 'Modulos', value: `${this.modules().length}` },
    { label: 'Estado', value: this.user()?.isActive ? 'Activo' : 'Inactivo' }]);
}
