import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthFacade } from '@auth/services/store/auth.acede';
import { Card } from '@shared/adapters/ui/card/card';

@Component({
  selector: 'sga-account-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, Card],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div class="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(122,28,42,0.22),transparent_45%),radial-gradient(circle_at_top_right,rgba(204,147,93,0.16),transparent_35%)]"></div>

        <div class="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1.3fr)_320px] lg:p-8">
          <div class="space-y-6">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div class="relative shrink-0">
                @if (avatarUrl()) {
                  <img
                    [src]="avatarUrl()!"
                    [alt]="displayName()"
                    class="h-24 w-24 rounded-[1.75rem] border border-border object-cover shadow-sm"
                  />
                } @else {
                  <div class="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-primary/20 bg-primary/10 text-2xl font-semibold text-primary shadow-sm">
                    {{ initials() }}
                  </div>
                }

                <span class="absolute -bottom-1 -right-1 rounded-full border border-card bg-emerald-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                  Activo
                </span>
              </div>

              <div class="min-w-0 flex-1 space-y-4">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                      {{ profileLabel() }}
                    </span>
                    <span class="rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                      {{ user()?.role?.name || 'Cuenta institucional' }}
                    </span>
                  </div>

                  <div>
                    <h1 class="truncate text-3xl font-semibold tracking-tight text-foreground">{{ displayName() }}</h1>
                    <p class="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {{ profileSummary() }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <a
                    routerLink="/account/settings"
                    class="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                  >
                    <i class="fa-solid fa-sliders"></i>
                    Ajustes de cuenta
                  </a>
                  <a
                    routerLink="/account/change-password"
                    class="inline-flex items-center gap-2 rounded-2xl border border-border bg-background/80 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted"
                  >
                    <i class="fa-solid fa-shield-keyhole"></i>
                    Seguridad
                  </a>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border bg-background/70 px-4 py-2.5 text-sm font-medium text-muted-foreground"
                  >
                    <i class="fa-solid fa-camera"></i>
                    Actualizar avatar
                  </button>
                </div>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              @for (metric of headlineMetrics(); track metric.label) {
                <div class="rounded-[1.5rem] border border-border bg-background/85 p-4">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{{ metric.label }}</p>
                  <p class="mt-3 text-xl font-semibold text-foreground">{{ metric.value }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ metric.helper }}</p>
                </div>
              }
            </div>
          </div>

          <sga-card class="border-border/80 bg-background/90">
            <div class="space-y-5 p-5">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Identidad institucional</p>
                <p class="mt-2 text-lg font-semibold text-foreground">{{ user()?.username || 'Usuario' }}</p>
                <p class="text-sm text-muted-foreground">{{ primaryEmail() }}</p>
              </div>

              <div class="space-y-3">
                @for (item of identityRows(); track item.label) {
                  <div class="rounded-2xl border border-border bg-card px-4 py-3">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{{ item.label }}</p>
                    <p class="mt-1 text-sm font-medium text-foreground">{{ item.value }}</p>
                  </div>
                }
              </div>

              <div class="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                <p class="text-sm font-semibold text-foreground">Estado de cuenta</p>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  Cuenta habilitada para operar dentro del sistema academico. Si cambias de sede, correo o rol, hazlo desde configuracion general.
                </p>
              </div>
            </div>
          </sga-card>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
        <sga-card>
          <div class="border-border/70 flex items-center justify-between border-b p-6">
            <div>
              <h2 class="text-lg font-semibold text-foreground">Ficha personal</h2>
              <p class="mt-1 text-sm text-muted-foreground">Datos clave del usuario autenticado y de su perfil academico.</p>
            </div>
            <i class="fa-solid fa-id-card text-muted-foreground"></i>
          </div>

          <div class="grid gap-4 p-6 md:grid-cols-2">
            @for (item of profileRows(); track item.label) {
              <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-sm font-medium leading-6 text-foreground">{{ item.value }}</p>
              </div>
            }
          </div>
        </sga-card>

        <div class="space-y-6">
          <sga-card>
            <div class="border-border/70 border-b p-6">
              <h2 class="text-lg font-semibold text-foreground">Actividad y accesos</h2>
              <p class="mt-1 text-sm text-muted-foreground">Resumen operativo de la cuenta actual.</p>
            </div>

            <div class="space-y-3 p-6">
              @for (item of activityRows(); track item.label) {
                <div class="flex items-start gap-3 rounded-[1.5rem] border border-border bg-background/75 p-4">
                  <div class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <i [class]="item.icon"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-foreground">{{ item.label }}</p>
                    <p class="mt-1 text-sm text-muted-foreground">{{ item.value }}</p>
                  </div>
                </div>
              }
            </div>
          </sga-card>

          <sga-card>
            <div class="border-border/70 border-b p-6">
              <h2 class="text-lg font-semibold text-foreground">Siguientes acciones</h2>
              <p class="mt-1 text-sm text-muted-foreground">Atajos para mantener la cuenta ordenada y segura.</p>
            </div>

            <div class="space-y-3 p-6">
              <a
                routerLink="/account/settings"
                class="flex items-center justify-between rounded-[1.5rem] border border-border bg-background/80 px-4 py-4 transition hover:border-primary/30 hover:bg-muted"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">Completar preferencias de cuenta</p>
                  <p class="mt-1 text-xs text-muted-foreground">Notificaciones, correo y politicas de seguridad.</p>
                </div>
                <i class="fa-solid fa-arrow-right text-muted-foreground"></i>
              </a>

              <a
                routerLink="/account/change-password"
                class="flex items-center justify-between rounded-[1.5rem] border border-border bg-background/80 px-4 py-4 transition hover:border-primary/30 hover:bg-muted"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">Actualizar credenciales</p>
                  <p class="mt-1 text-xs text-muted-foreground">Refuerza el acceso con una contrasena nueva.</p>
                </div>
                <i class="fa-solid fa-lock text-muted-foreground"></i>
              </a>
            </div>
          </sga-card>
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
  protected readonly profileSummary = computed(() => {
    const user = this.user();
    const institution = user?.profile?.institution;
    const roleName = user?.role?.name || 'usuario del sistema';
    if (institution) {
      return `Cuenta asociada a ${institution}. Gestiona tu informacion personal, credenciales y preferencias operativas desde este espacio.`;
    }
    return `Vista central del ${roleName.toLowerCase()} para revisar identidad, seguridad y datos operativos del sistema.`;
  });
  protected readonly location = computed(() => {
    const person = this.user()?.person;
    const parts = [person?.district, person?.province, person?.department].filter(Boolean);
    return parts.length ? parts.join(', ') : 'No registrada';
  });
  protected readonly headlineMetrics = computed(() => {
    const modulesCount = this.modules().length;
    const user = this.user();
    return [
      {
        label: 'Codigo',
        value: user?.code || user?.profile?.code || user?.username || 'N/A',
        helper: 'Identificador principal de la cuenta',
      },
      {
        label: 'Modulos',
        value: `${modulesCount}`,
        helper: modulesCount === 1 ? 'Modulo habilitado' : 'Modulos habilitados',
      },
      {
        label: 'Institucion',
        value: user?.profile?.institution || 'Pendiente',
        helper: 'Unidad educativa asociada',
      },
      {
        label: 'Contacto',
        value: user?.person?.mobile || user?.person?.phone || 'No registrado',
        helper: 'Canal rapido para soporte y alertas',
      },
    ];
  });
  protected readonly identityRows = computed(() => [
    { label: 'Usuario', value: this.user()?.username || 'No asignado' },
    { label: 'Rol actual', value: this.user()?.role?.name || 'Sin rol' },
    { label: 'Correo', value: this.primaryEmail() },
    { label: 'Ubicacion', value: this.location() },
  ]);
  protected readonly profileRows = computed(() => {
    const user = this.user();
    const person = user?.person;
    return [
      { label: 'Nombres completos', value: this.displayName() },
      { label: 'Documento', value: person?.documentType || 'No registrado' },
      { label: 'Codigo institucional', value: user?.code || user?.profile?.code || 'No registrado' },
      { label: 'Nacimiento', value: person?.birthDate || 'No registrado' },
      { label: 'Telefono', value: person?.mobile || person?.phone || 'No registrado' },
      { label: 'Direccion', value: person?.address || 'No registrada' },
      { label: 'Institucion', value: user?.profile?.institution || 'No asignada' },
      { label: 'Perfil academico', value: this.profileLabel() },
    ];
  });
  protected readonly activityRows = computed(() => {
    const modulesCount = this.modules().length;
    return [
      {
        label: 'Acceso de plataforma',
        value: `${modulesCount} ${modulesCount === 1 ? 'modulo habilitado' : 'modulos habilitados'} para tu rol actual.`,
        icon: 'fa-solid fa-grid-2',
      },
      {
        label: 'Sesion vigente',
        value: 'Tu sesion esta activa y protegida por las politicas de autenticacion del sistema.',
        icon: 'fa-solid fa-shield-check',
      },
      {
        label: 'Canales de contacto',
        value: `${this.primaryEmail()} · ${this.user()?.person?.mobile || this.user()?.person?.phone || 'sin telefono registrado'}`,
        icon: 'fa-solid fa-address-book',
      },
    ];
  });
}
