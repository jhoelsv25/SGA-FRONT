import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';
import type { AccountAuditLog, AccountUserDetail } from '@auth/types/auth-type';
import { LayoutStore } from '@core/stores/layout.store';
import type { ThemeConfig } from '@core/types/layout-types';
import { Card } from '@shared/adapters/ui/card/card';
import { catchError, of, switchMap, tap } from 'rxjs';

type SettingsSectionId = 'general' | 'appearance' | 'notifications' | 'email' | 'security' | 'logs' | 'sessions';

type ToggleKey =
  | 'digest'
  | 'reminders'
  | 'incidents'
  | 'approvals'
  | 'emailSummary'
  | 'browserAlerts'
  | 'newDeviceAlerts';

@Component({
  selector: 'sga-account-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, Card],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-3">
            <span class="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Centro de cuenta
            </span>
            <div>
              <h1 class="text-3xl font-semibold tracking-tight text-foreground">Configuracion de cuenta</h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Vista conectada a la data real del usuario, su perfil institucional y eventos de auditoria recientes.
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            @for (metric of headerMetrics(); track metric.label) {
              <div class="rounded-[1.5rem] border border-border bg-background/80 px-4 py-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{{ metric.label }}</p>
                <p class="mt-2 text-base font-semibold text-foreground">{{ metric.value }}</p>
                <p class="mt-1 text-xs text-muted-foreground">{{ metric.helper }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <sga-card class="h-fit overflow-hidden">
          <div class="border-border/70 border-b px-5 py-4">
            <p class="text-sm font-semibold text-foreground">Areas de configuracion</p>
            <p class="mt-1 text-xs text-muted-foreground">Cada bloque responde a una fuente de datos distinta.</p>
          </div>

          <nav class="space-y-1 p-3">
            @for (section of sections(); track section.id) {
              <button
                type="button"
                class="flex w-full items-start gap-3 rounded-[1.25rem] px-3 py-3 text-left transition"
                [class.bg-primary]="activeSection() === section.id"
                [class.text-primary-foreground]="activeSection() === section.id"
                [class.bg-background]="activeSection() !== section.id"
                [class.text-foreground]="activeSection() !== section.id"
                [class.hover:bg-muted]="activeSection() !== section.id"
                (click)="activeSection.set(section.id)"
              >
                <span
                  class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class.bg-primary-foreground/15]="activeSection() === section.id"
                  [class.bg-primary/10]="activeSection() !== section.id"
                  [class.text-primary-foreground]="activeSection() === section.id"
                  [class.text-primary]="activeSection() !== section.id"
                >
                  <i [class]="section.icon"></i>
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold">{{ section.label }}</span>
                  <span
                    class="mt-1 block text-xs leading-5"
                    [class.text-primary-foreground/80]="activeSection() === section.id"
                    [class.text-muted-foreground]="activeSection() !== section.id"
                  >
                    {{ section.description }}
                  </span>
                </span>
              </button>
            }
          </nav>
        </sga-card>

        <div class="space-y-6">
          @if (activeSection() === 'general') {
            <sga-card>
              <div class="border-border/70 flex items-center justify-between border-b p-6">
                <div>
                  <h2 class="text-xl font-semibold text-foreground">General</h2>
                  <p class="mt-1 text-sm text-muted-foreground">Detalle de cuenta traido desde users/:id.</p>
                </div>
                <i class="fa-solid fa-user-gear text-muted-foreground"></i>
              </div>

              @if (loadingUser()) {
                <div class="p-6 text-sm text-muted-foreground">Cargando informacion de cuenta...</div>
              } @else {
                <div class="grid gap-4 p-6 md:grid-cols-2">
                  @for (item of generalRows(); track item.label) {
                    <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                      <p class="mt-2 text-sm font-medium leading-6 text-foreground">{{ item.value }}</p>
                    </div>
                  }
                </div>
              }

              <div class="border-border/70 flex flex-wrap gap-3 border-t p-6">
                <a
                  routerLink="/account/profile"
                  class="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <i class="fa-solid fa-id-badge"></i>
                  Ver perfil completo
                </a>
                <a
                  routerLink="/account/change-password"
                  class="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  <i class="fa-solid fa-key"></i>
                  Cambiar contrasena
                </a>
              </div>
            </sga-card>
          }

          @if (activeSection() === 'appearance') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Apariencia y entorno</h2>
                <p class="mt-1 text-sm text-muted-foreground">Preferencias locales del entorno del usuario.</p>
              </div>

              <div class="space-y-6 p-6">
                <div class="grid gap-3 lg:grid-cols-3">
                  @for (option of themeOptions(); track option.value) {
                    <button
                      type="button"
                      class="rounded-[1.5rem] border p-5 text-left transition"
                      [class.border-primary]="currentTheme() === option.value"
                      [class.bg-primary/5]="currentTheme() === option.value"
                      [class.border-border]="currentTheme() !== option.value"
                      [class.hover:border-primary/30]="currentTheme() !== option.value"
                      (click)="setTheme(option.value)"
                    >
                      <p class="text-sm font-semibold text-foreground">{{ option.label }}</p>
                      <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ option.description }}</p>
                    </button>
                  }
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  @for (item of appearanceRows(); track item.label) {
                    <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                      <p class="text-sm font-semibold text-foreground">{{ item.label }}</p>
                      <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ item.description }}</p>
                    </div>
                  }
                </div>
              </div>
            </sga-card>
          }

          @if (activeSection() === 'notifications') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Notificaciones</h2>
                <p class="mt-1 text-sm text-muted-foreground">Preferencias operativas del panel actual.</p>
              </div>

              <div class="space-y-4 p-6">
                @for (item of notificationRows(); track item.key) {
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-[1.5rem] border border-border bg-background/80 p-4 text-left transition hover:border-primary/30"
                    (click)="togglePreference(item.key)"
                  >
                    <span class="pr-4">
                      <span class="block text-sm font-semibold text-foreground">{{ item.label }}</span>
                      <span class="mt-1 block text-sm leading-6 text-muted-foreground">{{ item.description }}</span>
                    </span>
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      [class.bg-emerald-500/10]="preferences()[item.key]"
                      [class.text-emerald-600]="preferences()[item.key]"
                      [class.bg-muted]="!preferences()[item.key]"
                      [class.text-muted-foreground]="!preferences()[item.key]"
                    >
                      {{ preferences()[item.key] ? 'Activo' : 'Pausado' }}
                    </span>
                  </button>
                }
              </div>
            </sga-card>
          }

          @if (activeSection() === 'email') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Correo y comunicacion</h2>
                <p class="mt-1 text-sm text-muted-foreground">Canales y estado de contacto basados en la cuenta actual.</p>
              </div>

              <div class="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div class="space-y-4">
                  @for (item of emailRows(); track item.label) {
                    <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{{ item.value }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">{{ item.helper }}</p>
                    </div>
                  }
                </div>

                <div class="rounded-[1.75rem] border border-primary/15 bg-primary/5 p-5">
                  <p class="text-sm font-semibold text-foreground">Politica operativa</p>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    Esta seccion combina correo principal, telefono y disponibilidad de contacto que llegan desde la ficha del usuario y persona.
                  </p>

                  <div class="mt-5 space-y-3">
                    @for (item of emailPolicyRows(); track item.label) {
                      <div class="flex items-center justify-between rounded-2xl border border-primary/10 bg-background/80 px-4 py-3">
                        <span class="text-sm font-medium text-foreground">{{ item.label }}</span>
                        <span class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{{ item.value }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </sga-card>
          }

          @if (activeSection() === 'security') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Seguridad</h2>
                <p class="mt-1 text-sm text-muted-foreground">Estado de acceso y control de cuenta.</p>
              </div>

              <div class="grid gap-4 p-6 lg:grid-cols-[1fr_340px]">
                <div class="space-y-4">
                  @for (item of securityRows(); track item.label) {
                    <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                      <p class="text-sm font-semibold text-foreground">{{ item.label }}</p>
                      <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ item.description }}</p>
                    </div>
                  }
                </div>

                <div class="rounded-[1.75rem] border border-destructive/15 bg-destructive/5 p-5">
                  <p class="text-sm font-semibold text-foreground">Accion prioritaria</p>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    Si hay intentos fallidos o la ultima actividad no te resulta conocida, cambia la contrasena y revisa los logs.
                  </p>

                  <a
                    routerLink="/account/change-password"
                    class="mt-5 inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                  >
                    <i class="fa-solid fa-shield-halved"></i>
                    Ir a cambio de contrasena
                  </a>
                </div>
              </div>
            </sga-card>
          }

          @if (activeSection() === 'logs') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Logs y auditoria</h2>
                <p class="mt-1 text-sm text-muted-foreground">Eventos reales obtenidos desde audit/user/:userId.</p>
              </div>

              @if (loadingAudit()) {
                <div class="p-6 text-sm text-muted-foreground">Cargando eventos de auditoria...</div>
              } @else if (auditRows().length === 0) {
                <div class="p-6 text-sm text-muted-foreground">No hay eventos de auditoria recientes para este usuario.</div>
              } @else {
                <div class="space-y-3 p-6">
                  @for (item of auditRows(); track item.id) {
                    <div class="flex items-start gap-4 rounded-[1.5rem] border border-border bg-background/80 p-4">
                      <span class="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <i [class]="item.icon"></i>
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-foreground">{{ item.title }}</p>
                          <span class="text-xs font-medium text-muted-foreground">{{ item.time }}</span>
                        </div>
                        <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ item.description }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            </sga-card>
          }

          @if (activeSection() === 'sessions') {
            <sga-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Sesiones activas</h2>
                <p class="mt-1 text-sm text-muted-foreground">Estado operativo de la cuenta y ultima actividad registrada.</p>
              </div>

              <div class="grid gap-4 p-6 lg:grid-cols-[1fr_1fr]">
                @for (item of sessionRows(); track item.label) {
                  <div class="rounded-[1.5rem] border border-border bg-background/80 p-4">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                    <p class="mt-2 text-sm font-medium leading-6 text-foreground">{{ item.value }}</p>
                  </div>
                }
              </div>
            </sga-card>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccountSettingsPage {
  protected readonly layout = inject(LayoutStore);
  private readonly authFacade = inject(AuthFacade);
  private readonly authApi = inject(AuthApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeSection = signal<SettingsSectionId>('general');
  protected readonly loadingUser = signal(false);
  protected readonly loadingAudit = signal(false);
  protected readonly userDetail = signal<AccountUserDetail | null>(null);
  protected readonly userAudit = signal<AccountAuditLog[]>([]);
  protected readonly currentTheme = computed(() => this.layout.currentTheme());
  protected readonly currentUser = computed(() => this.authFacade.getCurrentUser());
  protected readonly modules = computed(() => this.authFacade.getModules());
  protected readonly accountUser = computed<AccountUserDetail | null>(() => {
    const detail = this.userDetail();
    if (detail) return detail;
    const user = this.currentUser();
    if (!user) return null;

    return {
      ...user,
      createdAt: undefined,
      updatedAt: undefined,
      failedLoginAttempts: 0,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      lastLogin: user.lastLogin ? String(user.lastLogin) : null,
      role: {
        ...user.role,
        permissions: [],
      },
    };
  });
  protected readonly preferences = signal<Record<ToggleKey, boolean>>({
    digest: true,
    reminders: true,
    incidents: true,
    approvals: true,
    emailSummary: true,
    browserAlerts: false,
    newDeviceAlerts: true,
  });
  protected readonly sections = computed(() => [
    { id: 'general' as SettingsSectionId, label: 'General', description: 'Cuenta, rol y datos personales.', icon: 'fa-solid fa-user' },
    { id: 'appearance' as SettingsSectionId, label: 'Apariencia', description: 'Tema y entorno visual local.', icon: 'fa-solid fa-palette' },
    { id: 'notifications' as SettingsSectionId, label: 'Notificaciones', description: 'Preferencias operativas del panel.', icon: 'fa-solid fa-bell' },
    { id: 'email' as SettingsSectionId, label: 'Correo', description: 'Canales de contacto institucionales.', icon: 'fa-solid fa-envelope' },
    { id: 'security' as SettingsSectionId, label: 'Seguridad', description: 'Estado de acceso y control.', icon: 'fa-solid fa-shield-halved' },
    { id: 'logs' as SettingsSectionId, label: 'Logs', description: 'Auditoria reciente del usuario.', icon: 'fa-solid fa-clipboard-list' },
    { id: 'sessions' as SettingsSectionId, label: 'Sesiones', description: 'Ultima actividad y datos de sesion.', icon: 'fa-solid fa-laptop' },
  ]);
  protected readonly themeOptions = computed(() => [
    { value: 'light' as ThemeConfig, label: 'Claro', description: 'Para oficinas con mucha luz y jornadas largas.' },
    { value: 'dark' as ThemeConfig, label: 'Oscuro', description: 'Reduce brillo y mejora el foco visual.' },
    { value: 'system' as ThemeConfig, label: 'Sistema', description: 'Respeta la preferencia del dispositivo.' },
  ]);
  protected readonly headerMetrics = computed(() => {
    const user = this.accountUser();
    return [
      {
        label: 'Perfil',
        value: user?.profile?.roleLabel || user?.role?.name || 'Cuenta',
        helper: 'Rol activo cargado desde base de datos',
      },
      {
        label: 'Permisos',
        value: `${user?.role?.permissions?.length ?? 0}`,
        helper: 'Permisos asociados al rol',
      },
      {
        label: 'Estado',
        value: user?.status || (user?.isActive ? 'ACTIVE' : 'INACTIVE') || 'N/A',
        helper: 'Estado actual de la cuenta',
      },
    ];
  });
  protected readonly generalRows = computed(() => {
    const user = this.accountUser();
    const person = user?.person;
    const location = [person?.district, person?.province, person?.department].filter(Boolean).join(', ');
    return [
      { label: 'Nombre visible', value: `${user?.firstName || person?.firstName || ''} ${user?.lastName || person?.lastName || ''}`.trim() || user?.username || 'No definido' },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Correo', value: user?.email || person?.email || 'No registrado' },
      { label: 'Rol operativo', value: user?.role?.name || 'Sin rol' },
      { label: 'Institucion', value: user?.profile?.institution || 'No asignada' },
      { label: 'Telefono', value: person?.mobile || person?.phone || 'No registrado' },
      { label: 'Direccion', value: person?.address || 'No registrada' },
      { label: 'Ubicacion', value: location || 'No registrada' },
      { label: 'Fecha de alta', value: this.formatDate(user?.createdAt) },
      { label: 'Ultima actualizacion', value: this.formatDate(user?.updatedAt) },
    ];
  });
  protected readonly appearanceRows = computed(() => [
    { label: 'Sidebar compacto', description: 'Ideal para perfiles con muchos modulos y navegacion frecuente.' },
    { label: 'Vista enfocada', description: 'Prioriza contraste, jerarquia visual y lectura de formularios.' },
    { label: 'Preferencia persistente', description: 'El tema elegido se conserva en este navegador.' },
    { label: 'Base institucional', description: 'La UI se mantiene alineada con el sistema academico.' },
  ]);
  protected readonly notificationRows = computed(() => [
    { key: 'digest' as ToggleKey, label: 'Resumen diario', description: 'Consolida pendientes, aprobaciones y eventos del dia.' },
    { key: 'reminders' as ToggleKey, label: 'Recordatorios academicos', description: 'Fechas de cierre, actas y tareas administrativas.' },
    { key: 'incidents' as ToggleKey, label: 'Alertas de incidencias', description: 'Errores operativos, accesos fallidos o estados inusuales.' },
    { key: 'approvals' as ToggleKey, label: 'Flujos de aprobacion', description: 'Procesos que requieren accion del usuario.' },
    { key: 'browserAlerts' as ToggleKey, label: 'Avisos dentro del sistema', description: 'Banners y estados visibles en el panel.' },
    { key: 'newDeviceAlerts' as ToggleKey, label: 'Alertas por nuevo dispositivo', description: 'Avisa cuando hay un acceso desde un equipo distinto.' },
  ]);
  protected readonly emailRows = computed(() => {
    const user = this.accountUser();
    const person = user?.person;
    return [
      {
        label: 'Correo principal',
        value: user?.email || person?.email || 'Sin correo institucional',
        helper: 'Usado para acceso, recuperacion y comunicaciones clave.',
      },
      {
        label: 'Canal movil',
        value: person?.mobile || person?.phone || 'No registrado',
        helper: 'Canal alterno para avisos urgentes.',
      },
      {
        label: 'Perfil de envio',
        value: user?.profile?.roleLabel || user?.role?.name || 'General',
        helper: 'Segmento institucional usado para personalizar mensajes.',
      },
    ];
  });
  protected readonly emailPolicyRows = computed(() => [
    { label: 'Resumen diario', value: this.preferences().digest ? 'activo' : 'pausado' },
    { label: 'Correo de seguridad', value: this.preferences().newDeviceAlerts ? 'activo' : 'pausado' },
    { label: 'Aprobaciones', value: this.preferences().approvals ? 'activo' : 'pausado' },
  ]);
  protected readonly securityRows = computed(() => {
    const user = this.accountUser();
    return [
      {
        label: 'Estado de cuenta',
        description: `La cuenta se encuentra en estado ${user?.status || 'desconocido'} y ${user?.isActive ? 'habilitada' : 'deshabilitada'} para autenticacion.`,
      },
      {
        label: 'Ultimo acceso registrado',
        description: this.formatDate(user?.lastLogin, 'No hay acceso registrado todavia.'),
      },
      {
        label: 'Intentos fallidos',
        description: `${user?.failedLoginAttempts ?? 0} intento(s) fallido(s) registrados para esta cuenta.`,
      },
    ];
  });
  protected readonly auditRows = computed(() =>
    this.userAudit().map((item) => ({
      id: item.id,
      title: `${item.action} · ${item.entity}`,
      description: item.description,
      time: this.formatDate(item.createdAt),
      icon: this.getAuditIcon(item.action),
    })),
  );
  protected readonly sessionRows = computed(() => {
    const user = this.accountUser();
    return [
      { label: 'Estado', value: user?.status || 'Sin estado' },
      { label: 'Activo', value: user?.isActive ? 'Si' : 'No' },
      { label: 'Ultimo login', value: this.formatDate(user?.lastLogin) },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Rol en uso', value: user?.role?.name || 'Sin rol' },
      { label: 'Permisos del rol', value: `${user?.role?.permissions?.length ?? 0}` },
      { label: 'Modulos visibles', value: `${this.modules().length}` },
      { label: 'Tema aplicado', value: this.currentTheme() },
    ];
  });

  constructor() {
    toObservable(this.currentUser)
      .pipe(
        tap((user) => {
          if (user?.id) {
            this.loadingUser.set(true);
          } else {
            this.userDetail.set(null);
          }
        }),
        switchMap((user) => {
          if (!user?.id) {
            this.loadingUser.set(false);
            return of(null);
          }

          return this.authApi.getCurrentUserDetail(user.id).pipe(
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.userDetail.set(detail);
        this.loadingUser.set(false);
      });

    toObservable(this.currentUser)
      .pipe(
        tap((user) => {
          if (user?.id) {
            this.loadingAudit.set(true);
          } else {
            this.userAudit.set([]);
          }
        }),
        switchMap((user) => {
          if (!user?.id) {
            this.loadingAudit.set(false);
            return of(null);
          }

          return this.authApi.getCurrentUserAudit(user.id).pipe(
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.userAudit.set(response?.data ?? []);
        this.loadingAudit.set(false);
      });
  }

  protected setTheme(target: ThemeConfig) {
    while (this.layout.currentTheme() !== target) {
      this.layout.toggleTheme();
    }
  }

  protected togglePreference(key: ToggleKey) {
    this.preferences.update((state) => ({
      ...state,
      [key]: !state[key],
    }));
  }

  private formatDate(value?: string | null, fallback = 'No registrado') {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private getAuditIcon(action: AccountAuditLog['action']) {
    switch (action) {
      case 'CREATE':
        return 'fa-solid fa-plus';
      case 'DELETE':
        return 'fa-solid fa-trash';
      case 'UPDATE':
      default:
        return 'fa-solid fa-pen';
    }
  }
}
