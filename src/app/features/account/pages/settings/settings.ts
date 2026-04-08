import { ZardCardComponent } from '@/shared/components/card';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';
import type { AccountAuditLog, AccountEmailLog, AccountSession, AccountUserDetail } from '@auth/types/auth-type';
import { Toast } from '@core/services/toast';
import { LayoutStore } from '@core/stores/layout.store';
import type { ThemeConfig } from '@core/types/layout-types';
import { SessionApi } from '@features/admin-services/api/session-api';
import { catchError, of } from 'rxjs';

type SettingsSectionId = 'general' | 'appearance' | 'notifications' | 'email' | 'security' | 'logs' | 'sessions';

type ToggleKey =
  | 'digest'
  | 'reminders'
  | 'incidents'
  | 'approvals'
  | 'emailSummary'
  | 'browserAlerts'
  | 'newDeviceAlerts';

const LIVE_CLASS_REMINDER_PRESETS = [0, 5, 10, 15] as const;
const GLOBAL_TEACHER_REMINDER_KEY = 'teacher-live-class-reminder';


@Component({
  selector: 'sga-account-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ZardCardComponent],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
        <div class="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-[55px]"></div>
        <div class="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-secondary/10 blur-[45px]"></div>

        <div class="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                {{ roleBadge() }}
              </span>
              <span class="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ajustes de cuenta
              </span>
            </div>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">Configuracion de cuenta</h1>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Preferencias, seguridad y actividad conectadas a la cuenta autenticada.
            </p>
          </div>

          <div class="grid min-w-[280px] grid-cols-2 gap-3">
            @for (item of settingsHeroPills(); track item.label) {
              <div class="rounded-2xl border border-border bg-background/80 px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                <p class="mt-2 text-sm font-semibold text-foreground">{{ item.value }}</p>
              </div>
            }
          </div>
        </div>

        <div class="relative z-10 mt-5 flex flex-wrap gap-2">
          @for (section of sections(); track section.id) {
            <button
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              [class.border-primary]="activeSection() === section.id"
              [class.bg-primary]="activeSection() === section.id"
              [class.text-primary-foreground]="activeSection() === section.id"
              [class.border-border]="activeSection() !== section.id"
              [class.bg-background]="activeSection() !== section.id"
              [class.text-muted-foreground]="activeSection() !== section.id"
              (click)="activeSection.set(section.id)"
            >
              {{ section.label }}
            </button>
          }
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <z-card class="h-fit overflow-hidden">
          <div class="border-border/70 border-b px-4 py-3">
            <p class="text-sm font-semibold text-foreground">Secciones</p>
          </div>

          <nav class="space-y-1 p-2">
            @for (section of sections(); track section.id) {
              <button
                type="button"
                class="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition"
                [class.bg-primary]="activeSection() === section.id"
                [class.text-primary-foreground]="activeSection() === section.id"
                [class.bg-background]="activeSection() !== section.id"
                [class.text-foreground]="activeSection() !== section.id"
                [class.hover:bg-muted]="activeSection() !== section.id"
                (click)="activeSection.set(section.id)"
              >
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <i [class]="section.icon"></i>
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold">{{ section.label }}</span>
                  <span class="mt-1 block text-xs leading-5 text-muted-foreground">{{ section.description }}</span>
                </span>
              </button>
            }
          </nav>
        </z-card>

        <div class="space-y-6">
          @if (activeSection() === 'general') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">General</h2>
                <p class="mt-1 text-sm text-muted-foreground">Datos desde users/:id.</p>
              </div>

              @if (loadingUser()) {
                <div class="p-6 text-sm text-muted-foreground">Cargando informacion...</div>
              } @else {
                <div class="grid gap-4 p-6 md:grid-cols-2">
                  @for (item of generalRows(); track item.label) {
                    <div class="rounded-xl border border-border bg-background/80 p-4">
                      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{{ item.value }}</p>
                    </div>
                  }
                </div>

                @if (roleSettingsRows().length) {
                  <div class="border-border/70 border-t p-6">
                    <div class="mb-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">Contexto del rol</p>
                      <p class="mt-1 text-sm text-muted-foreground">Datos operativos cargados específicamente para este perfil.</p>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      @for (item of roleSettingsRows(); track item.label) {
                        <div class="rounded-xl border border-border bg-background/80 p-4">
                          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                          <p class="mt-2 text-sm font-medium text-foreground">{{ item.value }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }
              }

              <div class="border-border/70 flex flex-wrap gap-3 border-t p-6">
                <a
                  routerLink="/account/profile"
                  class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Ver perfil completo
                </a>
                <a
                  routerLink="/account/change-password"
                  class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground"
                >
                  Cambiar contrasena
                </a>
              </div>
            </z-card>
          }

          @if (activeSection() === 'appearance') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Apariencia</h2>
                <p class="mt-1 text-sm text-muted-foreground">Preferencias locales del entorno.</p>
              </div>

              <div class="grid gap-3 p-6 lg:grid-cols-3">
                @for (option of themeOptions(); track option.value) {
                  <button
                    type="button"
                    class="rounded-xl border p-4 text-left transition"
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
            </z-card>
          }

          @if (activeSection() === 'notifications') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Notificaciones</h2>
                <p class="mt-1 text-sm text-muted-foreground">Preferencias guardadas en tu cuenta.</p>
              </div>

              <div class="space-y-3 p-6">
                @for (item of notificationRows(); track item.key) {
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-xl border border-border bg-background/80 p-4 text-left transition hover:border-primary/30"
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

                @if (showTeacherReminderConfig()) {
                  <div class="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div class="max-w-2xl">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Clase en vivo</p>
                        <h3 class="mt-2 text-base font-semibold text-foreground">Recordatorio previo para iniciar clase</h3>
                        <p class="mt-1 text-sm leading-6 text-muted-foreground">
                          El sistema revisa cada minuto tus horarios del dia y te avisa antes de que empiece el bloque.
                        </p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition"
                        [class.border-emerald-500/30]="liveClassReminderEnabled()"
                        [class.bg-emerald-500/10]="liveClassReminderEnabled()"
                        [class.text-emerald-700]="liveClassReminderEnabled()"
                        [class.border-border]="!liveClassReminderEnabled()"
                        [class.bg-background]="!liveClassReminderEnabled()"
                        [class.text-muted-foreground]="!liveClassReminderEnabled()"
                        (click)="toggleLiveClassReminder()"
                      >
                        {{ liveClassReminderEnabled() ? 'Activo' : 'Pausado' }}
                      </button>
                    </div>

                    <div class="mt-4 rounded-xl border border-border bg-background/80 p-4">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anticipacion</p>
                          <p class="mt-1 text-sm text-foreground">
                            @if (liveClassReminderLeadMinutes() === 0) {
                              Al iniciar el bloque
                            } @else {
                              {{ liveClassReminderLeadMinutes() }} min antes
                            }
                          </p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          @for (minutes of liveClassReminderPresets; track minutes) {
                            <button
                              type="button"
                              class="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                              [class.border-primary]="liveClassReminderLeadMinutes() === minutes"
                              [class.bg-primary]="liveClassReminderLeadMinutes() === minutes"
                              [class.text-primary-foreground]="liveClassReminderLeadMinutes() === minutes"
                              [class.border-border]="liveClassReminderLeadMinutes() !== minutes"
                              [class.bg-background]="liveClassReminderLeadMinutes() !== minutes"
                              [class.text-muted-foreground]="liveClassReminderLeadMinutes() !== minutes"
                              (click)="setLiveClassReminderLeadMinutes(minutes)"
                            >
                              {{ reminderLeadLabel(minutes) }}
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }

                @if (showGlobalReminderConfig()) {
                  <div class="rounded-2xl border border-border bg-background/90 p-5">
                    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div class="max-w-2xl">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Regla global</p>
                        <h3 class="mt-2 text-base font-semibold text-foreground">Recordatorio institucional para docentes</h3>
                        <p class="mt-1 text-sm leading-6 text-muted-foreground">
                          Este valor se usa como predeterminado para todos los docentes. Si un docente no personaliza su ajuste,
                          el sistema toma esta configuracion global.
                        </p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition"
                        [class.border-emerald-500/30]="globalLiveClassReminderEnabled()"
                        [class.bg-emerald-500/10]="globalLiveClassReminderEnabled()"
                        [class.text-emerald-700]="globalLiveClassReminderEnabled()"
                        [class.border-border]="!globalLiveClassReminderEnabled()"
                        [class.bg-background]="!globalLiveClassReminderEnabled()"
                        [class.text-muted-foreground]="!globalLiveClassReminderEnabled()"
                        (click)="toggleGlobalLiveClassReminder()"
                      >
                        {{ globalLiveClassReminderEnabled() ? 'Activo' : 'Pausado' }}
                      </button>
                    </div>

                    <div class="mt-4 rounded-xl border border-border bg-card p-4">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Anticipacion global</p>
                          <p class="mt-1 text-sm text-foreground">
                            @if (globalLiveClassReminderLeadMinutes() === 0) {
                              Al iniciar el bloque
                            } @else {
                              {{ globalLiveClassReminderLeadMinutes() }} min antes
                            }
                          </p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          @for (minutes of liveClassReminderPresets; track minutes) {
                            <button
                              type="button"
                              class="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                              [class.border-primary]="globalLiveClassReminderLeadMinutes() === minutes"
                              [class.bg-primary]="globalLiveClassReminderLeadMinutes() === minutes"
                              [class.text-primary-foreground]="globalLiveClassReminderLeadMinutes() === minutes"
                              [class.border-border]="globalLiveClassReminderLeadMinutes() !== minutes"
                              [class.bg-background]="globalLiveClassReminderLeadMinutes() !== minutes"
                              [class.text-muted-foreground]="globalLiveClassReminderLeadMinutes() !== minutes"
                              (click)="setGlobalLiveClassReminderLeadMinutes(minutes)"
                            >
                              {{ reminderLeadLabel(minutes) }}
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <div class="rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
                  {{ preferenceStatus() }}
                </div>
              </div>
            </z-card>
          }

          @if (activeSection() === 'email') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Correo</h2>
                <p class="mt-1 text-sm text-muted-foreground">Contacto y ultimos envios.</p>
              </div>

              <div class="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div class="space-y-3">
                  @for (item of emailRows(); track item.label) {
                    <div class="rounded-xl border border-border bg-background/80 p-4">
                      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{{ item.value }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">{{ item.helper }}</p>
                    </div>
                  }
                </div>

                <div class="rounded-xl border border-border bg-background/80 p-4">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-semibold text-foreground">Ultimos correos</p>
                    <span class="text-xs text-muted-foreground">{{ userEmailLogs().length }}</span>
                  </div>
                  @if (loadingEmailLogs()) {
                    <p class="mt-3 text-xs text-muted-foreground">Cargando historial...</p>
                  } @else if (userEmailLogs().length === 0) {
                    <p class="mt-3 text-xs text-muted-foreground">No hay correos registrados.</p>
                  } @else {
                    <div class="mt-3 space-y-2">
                      @for (log of userEmailLogs(); track log.id) {
                        <div class="rounded-lg border border-border bg-card px-3 py-2">
                          <div class="flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-foreground">{{ log.subject }}</p>
                            <span
                              class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                              [class.bg-emerald-500/10]="log.status === 'sent'"
                              [class.text-emerald-600]="log.status === 'sent'"
                              [class.bg-destructive/10]="log.status !== 'sent'"
                              [class.text-destructive]="log.status !== 'sent'"
                            >
                              {{ log.status === 'sent' ? 'enviado' : 'fallido' }}
                            </span>
                          </div>
                          <p class="mt-1 text-xs text-muted-foreground">{{ log.recipient }}</p>
                          <p class="mt-1 text-xs text-muted-foreground">{{ formatDate(log.createdAt) }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </z-card>
          }

          @if (activeSection() === 'security') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Seguridad</h2>
                <p class="mt-1 text-sm text-muted-foreground">Estado de acceso y control.</p>
              </div>

              <div class="space-y-3 p-6">
                @for (item of securityRows(); track item.label) {
                  <div class="rounded-xl border border-border bg-background/80 p-4">
                    <p class="text-sm font-semibold text-foreground">{{ item.label }}</p>
                    <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ item.description }}</p>
                  </div>
                }
              </div>

              <div class="border-border/70 border-t p-6">
                <a
                  routerLink="/account/change-password"
                  class="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
                >
                  Ir a cambio de contrasena
                </a>
              </div>
            </z-card>
          }

          @if (activeSection() === 'logs') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Logs y auditoria</h2>
                <p class="mt-1 text-sm text-muted-foreground">Eventos recientes del usuario.</p>
              </div>

              @if (loadingAudit()) {
                <div class="p-6 text-sm text-muted-foreground">Cargando eventos...</div>
              } @else if (auditRows().length === 0) {
                <div class="p-6 text-sm text-muted-foreground">No hay eventos recientes.</div>
              } @else {
                <div class="space-y-3 p-6">
                  @for (item of auditRows(); track item.id) {
                    <div class="flex items-start gap-4 rounded-xl border border-border bg-background/80 p-4">
                      <span class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
            </z-card>
          }

          @if (activeSection() === 'sessions') {
            <z-card>
              <div class="border-border/70 border-b p-6">
                <h2 class="text-xl font-semibold text-foreground">Sesiones</h2>
                <p class="mt-1 text-sm text-muted-foreground">Estado operativo y accesos recientes.</p>
              </div>

              <div class="grid gap-4 p-6 lg:grid-cols-[1fr_1fr]">
                @for (item of sessionRows(); track item.label) {
                  <div class="rounded-xl border border-border bg-background/80 p-4">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{{ item.label }}</p>
                    <p class="mt-2 text-sm font-medium leading-6 text-foreground">{{ item.value }}</p>
                  </div>
                }
              </div>

              <div class="border-border/70 border-t p-6">
                @if (loadingSessions()) {
                  <p class="text-xs text-muted-foreground">Cargando sesiones...</p>
                } @else if (userSessions().length === 0) {
                  <p class="text-xs text-muted-foreground">No hay sesiones registradas.</p>
                } @else {
                  <div class="mt-2 grid gap-3 lg:grid-cols-2">
                    @for (session of userSessions(); track session.id) {
                      <div class="rounded-xl border border-border bg-background/80 p-4">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-foreground">Sesion</p>
                          <div class="flex items-center gap-2">
                            <span
                              class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                              [class.bg-emerald-500/10]="isSessionActive(session)"
                              [class.text-emerald-600]="isSessionActive(session)"
                              [class.bg-muted]="!isSessionActive(session)"
                              [class.text-muted-foreground]="!isSessionActive(session)"
                            >
                              {{ isSessionActive(session) ? 'activa' : 'expirada' }}
                            </span>
                            <button
                              type="button"
                              class="rounded-xl border border-destructive/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-destructive transition hover:bg-destructive/10"
                              (click)="revokeSession(session.id)"
                            >
                              Revocar
                            </button>
                          </div>
                        </div>
                        <p class="mt-2 text-xs text-muted-foreground">{{ session.userAgent }}</p>
                        <p class="mt-1 text-xs text-muted-foreground">IP {{ session.ipAddress }}</p>
                        <p class="mt-1 text-xs text-muted-foreground">Ultima actividad: {{ formatDate(session.lastActive) }}</p>
                      </div>
                    }
                  </div>
                }
              </div>
            </z-card>
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
  private readonly sessionApi = inject(SessionApi);
  private readonly toast = inject(Toast);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeSection = signal<SettingsSectionId>('general');
  protected readonly loadingUser = signal(false);
  protected readonly loadingAudit = signal(false);
  protected readonly loadingSessions = signal(false);
  protected readonly loadingEmailLogs = signal(false);
  protected readonly preferenceStatus = signal('Sincronizado');
  protected readonly userDetail = signal<AccountUserDetail | null>(null);
  protected readonly userAudit = signal<AccountAuditLog[]>([]);
  protected readonly userSessions = signal<AccountSession[]>([]);
  protected readonly userEmailLogs = signal<AccountEmailLog[]>([]);
  protected readonly currentTheme = computed(() => this.layout.currentTheme());
  protected readonly currentUser = computed(() => this.authFacade.getCurrentUser());
  protected readonly modules = computed(() => this.authFacade.getModules());
  protected readonly roleType = computed(() => this.currentUser()?.profile?.type || 'user');
  protected readonly roleBadge = computed(() => this.currentUser()?.profile?.roleLabel || this.currentUser()?.role?.name || 'Perfil');
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
  protected readonly liveClassReminderEnabled = signal(true);
  protected readonly liveClassReminderLeadMinutes = signal<number>(5);
  protected readonly globalLiveClassReminderEnabled = signal(true);
  protected readonly globalLiveClassReminderLeadMinutes = signal<number>(5);
  protected readonly liveClassReminderPresets = LIVE_CLASS_REMINDER_PRESETS;
  protected readonly showTeacherReminderConfig = computed(() => this.roleType() === 'teacher');
  protected readonly showGlobalReminderConfig = computed(() => {
    const roleType = this.roleType();
    return roleType === 'admin' || roleType === 'superadmin' || roleType === 'director' || roleType === 'subdirector' || roleType === 'ugel';
  });
  protected readonly sections = computed(() => {
    const roleType = this.roleType();
    const base = [
      { id: 'general' as SettingsSectionId, label: 'General', description: 'Cuenta y datos personales.', icon: 'fa-solid fa-user' },
      { id: 'appearance' as SettingsSectionId, label: 'Apariencia', description: 'Tema del sistema.', icon: 'fa-solid fa-palette' },
      { id: 'notifications' as SettingsSectionId, label: 'Notificaciones', description: 'Preferencias guardadas.', icon: 'fa-solid fa-bell' },
      { id: 'email' as SettingsSectionId, label: 'Correo', description: 'Historial de envios.', icon: 'fa-solid fa-envelope' },
      { id: 'security' as SettingsSectionId, label: 'Seguridad', description: 'Estado y control.', icon: 'fa-solid fa-shield-halved' },
    ];

    if (roleType === 'admin' || roleType === 'superadmin' || roleType === 'director' || roleType === 'subdirector' || roleType === 'ugel') {
      return [
        ...base,
        { id: 'logs' as SettingsSectionId, label: 'Logs', description: 'Auditoria reciente.', icon: 'fa-solid fa-clipboard-list' },
        { id: 'sessions' as SettingsSectionId, label: 'Sesiones', description: 'Accesos activos.', icon: 'fa-solid fa-laptop' },
      ];
    }

    return [
      ...base,
      { id: 'sessions' as SettingsSectionId, label: 'Sesiones', description: 'Dispositivos y accesos activos.', icon: 'fa-solid fa-laptop' },
    ];
  });
  protected readonly themeOptions = computed(() => [
    { value: 'light' as ThemeConfig, label: 'Claro', description: 'Entorno luminoso.' },
    { value: 'dark' as ThemeConfig, label: 'Oscuro', description: 'Reduce brillo.' },
    { value: 'system' as ThemeConfig, label: 'Sistema', description: 'Respeta preferencia del dispositivo.' }]);
  protected readonly generalRows = computed(() => {
    const user = this.accountUser();
    const person = user?.person;
    const location = [person?.district, person?.province, person?.department].filter(Boolean).join(', ');
    return [
      { label: 'Nombre', value: `${user?.firstName || person?.firstName || ''} ${user?.lastName || person?.lastName || ''}`.trim() || user?.username || 'No definido' },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Correo', value: user?.email || person?.email || 'No registrado' },
      { label: 'Rol', value: user?.role?.name || 'Sin rol' },
      { label: 'Institucion', value: user?.profile?.institution || 'No asignada' },
      { label: 'Telefono', value: person?.mobile || person?.phone || 'No registrado' },
      { label: 'Direccion', value: person?.address || 'No registrada' },
      { label: 'Ubicacion', value: location || 'No registrada' }];
  });
  protected readonly settingsHeroPills = computed(() => {
    const user = this.accountUser();
    return [
      { label: 'Rol', value: this.roleBadge() },
      { label: 'Módulos', value: String(this.modules().length) },
      { label: 'Tema', value: this.currentTheme() },
      { label: 'Estado', value: user?.isActive ? 'Activa' : 'Inactiva' },
    ];
  });
  protected readonly roleSettingsRows = computed(() => {
    const details = this.currentUser()?.profile?.details ?? {};
    const stats = this.currentUser()?.profile?.stats ?? {};
    return [...Object.entries(details), ...Object.entries(stats)]
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        label: this.humanizeKey(key),
        value: String(value),
      }))
      .slice(0, 8);
  });
  protected readonly notificationRows = computed(() => [
    { key: 'digest' as ToggleKey, label: 'Resumen diario', description: 'Consolida pendientes y eventos.' },
    { key: 'reminders' as ToggleKey, label: 'Recordatorios', description: 'Fechas de cierre y tareas.' },
    { key: 'incidents' as ToggleKey, label: 'Incidencias', description: 'Errores operativos o accesos fallidos.' },
    { key: 'approvals' as ToggleKey, label: 'Aprobaciones', description: 'Procesos que requieren accion.' },
    { key: 'browserAlerts' as ToggleKey, label: 'Avisos en el panel', description: 'Banners y alertas internas.' },
    { key: 'newDeviceAlerts' as ToggleKey, label: 'Nuevo dispositivo', description: 'Aviso por accesos desconocidos.' }]);
  protected readonly emailRows = computed(() => {
    const user = this.accountUser();
    const person = user?.person;
    return [
      {
        label: 'Correo principal',
        value: user?.email || person?.email || 'Sin correo institucional',
        helper: 'Usado para acceso y comunicaciones clave.',
      },
      {
        label: 'Canal movil',
        value: person?.mobile || person?.phone || 'No registrado',
        helper: 'Canal alterno para avisos urgentes.',
      },
      {
        label: 'Perfil de envio',
        value: user?.profile?.roleLabel || user?.role?.name || 'General',
        helper: 'Segmento institucional del usuario.',
      }];
  });
  protected readonly securityRows = computed(() => {
    const user = this.accountUser();
    return [
      {
        label: 'Estado de cuenta',
        description: `Cuenta ${user?.status || 'desconocido'} (${user?.isActive ? 'activa' : 'inactiva'}).`,
      },
      {
        label: 'Ultimo acceso',
        description: this.formatDate(user?.lastLogin, 'Sin acceso registrado.'),
      },
      {
        label: 'Intentos fallidos',
        description: `${user?.failedLoginAttempts ?? 0} intento(s).`,
      }];
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
      { label: 'Rol', value: user?.role?.name || 'Sin rol' },
      { label: 'Modulos', value: `${this.modules().length}` },
      { label: 'Tema', value: this.currentTheme() }];
  });

  constructor() {
    toObservable(this.currentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => this.loadUserData(user?.id));
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

    this.persistPreferences(this.preferences());
  }

  protected toggleLiveClassReminder() {
    this.liveClassReminderEnabled.update(value => !value);
    this.persistReminderPreferences();
  }

  protected setLiveClassReminderLeadMinutes(minutes: number) {
    this.liveClassReminderLeadMinutes.set(minutes);
    this.persistReminderPreferences();
  }

  protected toggleGlobalLiveClassReminder() {
    this.globalLiveClassReminderEnabled.update(value => !value);
    this.persistGlobalReminderPreferences();
  }

  protected setGlobalLiveClassReminderLeadMinutes(minutes: number) {
    this.globalLiveClassReminderLeadMinutes.set(minutes);
    this.persistGlobalReminderPreferences();
  }

  protected reminderLeadLabel(minutes: number) {
    return minutes === 0 ? 'Al iniciar' : `${minutes} min`;
  }

  private persistReminderPreferences() {
    this.persistPreferences({
      liveClassReminderEnabled: this.liveClassReminderEnabled(),
      liveClassReminderLeadMinutes: this.liveClassReminderLeadMinutes(),
    });
  }

  private persistGlobalReminderPreferences() {
    this.preferenceStatus.set('Guardando configuracion global...');
    this.authApi.updateSystemSetting(GLOBAL_TEACHER_REMINDER_KEY, {
      enabled: this.globalLiveClassReminderEnabled(),
      leadMinutes: this.globalLiveClassReminderLeadMinutes(),
    }).subscribe({
      next: () => {
        this.preferenceStatus.set('Configuracion global guardada');
      },
      error: () => {
        this.preferenceStatus.set('No se pudo guardar la configuracion global.');
      },
    });
  }

  private persistPreferences(preferences: Record<string, any>) {
    const userId = this.currentUser()?.id;
    if (!userId) return;

    this.preferenceStatus.set('Guardando cambios...');

    this.authApi.updateUserPreferences(userId, preferences).subscribe({
      next: () => {
        this.preferenceStatus.set('Cambios guardados');
      },
      error: () => {
        this.preferenceStatus.set('No se pudo guardar. El cambio queda solo local.');
      },
    });
  }

  private loadUserData(userId?: string) {
    if (!userId) {
      this.userDetail.set(null);
      this.userAudit.set([]);
      this.userSessions.set([]);
      this.userEmailLogs.set([]);
      return;
    }

    this.loadUserDetail(userId);
    this.loadAudit(userId);
    this.loadSessions(userId);
    this.loadEmailLogs(userId);
    this.loadPreferences(userId);
    this.loadGlobalReminderSettings();
  }

  private loadUserDetail(userId: string) {
    this.loadingUser.set(true);
    this.authApi.getCurrentUserDetail(userId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((detail) => {
        this.userDetail.set(detail);
        this.loadingUser.set(false);
      });
  }

  private loadAudit(userId: string) {
    this.loadingAudit.set(true);
    this.authApi.getCurrentUserAudit(userId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.userAudit.set(response?.data ?? []);
        this.loadingAudit.set(false);
      });
  }

  private loadSessions(userId: string) {
    this.loadingSessions.set(true);
    this.authApi.getCurrentUserSessions(userId, 6)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.userSessions.set(response?.data ?? []);
        this.loadingSessions.set(false);
      });
  }

  private loadEmailLogs(userId: string) {
    this.loadingEmailLogs.set(true);
    this.authApi.getCurrentUserEmailLogs(userId, 6)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.userEmailLogs.set(response?.data ?? []);
        this.loadingEmailLogs.set(false);
      });
  }

  private loadPreferences(userId: string) {
    this.authApi.getUserPreferences(userId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response?.preferences) {
          this.preferences.update((state) => ({
            ...state,
            ...response.preferences,
          }));
          this.liveClassReminderEnabled.set(response.preferences['liveClassReminderEnabled'] !== false);
          this.liveClassReminderLeadMinutes.set(this.normalizeReminderLeadMinutes(response.preferences['liveClassReminderLeadMinutes']));
        }
        this.preferenceStatus.set('Sincronizado');
      });
  }

  private loadGlobalReminderSettings() {
    if (!this.showGlobalReminderConfig()) return;

    this.authApi.getSystemSetting(GLOBAL_TEACHER_REMINDER_KEY)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        const value = response?.data?.value ?? {};
        this.globalLiveClassReminderEnabled.set(value['enabled'] !== false);
        this.globalLiveClassReminderLeadMinutes.set(this.normalizeReminderLeadMinutes(value['leadMinutes']));
      });
  }

  private normalizeReminderLeadMinutes(value: unknown) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 5;
    return Math.min(15, Math.max(0, Math.round(parsed)));
  }

  protected formatDate(value?: string | null, fallback = 'No registrado') {
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

  protected isSessionActive(session: AccountSession) {
    const date = new Date(session.expiresAt);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() > Date.now();
  }

  protected revokeSession(sessionId: string) {
    const userId = this.currentUser()?.id;
    if (!userId) return;

    this.sessionApi.delete(sessionId)
      .pipe(
        catchError((error) => {
          this.toast.error(error?.message || 'No se pudo revocar la sesion');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result === null) return;
        this.toast.success('Sesion revocada');
        this.loadSessions(userId);
      });
  }

  private humanizeKey(key: string) {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase());
  }
}
