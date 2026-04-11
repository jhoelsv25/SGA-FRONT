import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { AuthApi } from '@auth/services/api/auth-api';
import { AuthFacade } from '@auth/services/store/auth.acede';
import type {
  AccountAuditLog,
  AccountEmailLog,
  AccountSession,
  AccountUserDetail,
} from '@auth/types/auth-type';
import { Toast } from '@core/services/toast';
import { LayoutStore } from '@core/stores/layout.store';
import type { ThemeConfig } from '@core/types/layout-types';
import { SessionApi } from '@features/admin-services/api/session-api';
import { catchError, of } from 'rxjs';
import type {
  SettingsAuditRow,
  SettingsHeroPill,
  SettingsInfoRow,
  SettingsNotificationItem,
  SettingsPreferenceKey,
  SettingsSectionId,
  SettingsSectionItem,
  SettingsStatusRow,
  SettingsThemeOption,
} from '../../components/settings/settings.types';
import { SettingsAppearanceSectionComponent } from '../../components/settings/settings-appearance-section/settings-appearance-section';
import { SettingsEmailSectionComponent } from '../../components/settings/settings-email-section/settings-email-section';
import { SettingsGeneralSectionComponent } from '../../components/settings/settings-general-section/settings-general-section';
import { SettingsHeroComponent } from '../../components/settings/settings-hero/settings-hero';
import { SettingsLogsSectionComponent } from '../../components/settings/settings-logs-section/settings-logs-section';
import { SettingsNotificationsSectionComponent } from '../../components/settings/settings-notifications-section/settings-notifications-section';
import { SettingsSectionNavComponent } from '../../components/settings/settings-section-nav/settings-section-nav';
import { SettingsSecuritySectionComponent } from '../../components/settings/settings-security-section/settings-security-section';
import { SettingsSessionsSectionComponent } from '../../components/settings/settings-sessions-section/settings-sessions-section';

const LIVE_CLASS_REMINDER_PRESETS = [0, 5, 10, 15] as const;
const GLOBAL_TEACHER_REMINDER_KEY = 'teacher-live-class-reminder';

@Component({
  selector: 'sga-account-settings',

  imports: [
    SettingsHeroComponent,
    SettingsSectionNavComponent,
    SettingsGeneralSectionComponent,
    SettingsAppearanceSectionComponent,
    SettingsNotificationsSectionComponent,
    SettingsEmailSectionComponent,
    SettingsSecuritySectionComponent,
    SettingsLogsSectionComponent,
    SettingsSessionsSectionComponent,
  ],
  templateUrl: './settings.html',
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
  protected readonly roleBadge = computed(
    () => this.currentUser()?.profile?.roleLabel || this.currentUser()?.role?.name || 'Perfil',
  );
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
  protected readonly preferences = signal<Record<SettingsPreferenceKey, boolean>>({
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
    return (
      roleType === 'admin' ||
      roleType === 'superadmin' ||
      roleType === 'director' ||
      roleType === 'subdirector' ||
      roleType === 'ugel'
    );
  });
  protected readonly sections = computed<SettingsSectionItem[]>(() => {
    const roleType = this.roleType();
    const base = [
      {
        id: 'general' as SettingsSectionId,
        label: 'General',
        description: 'Cuenta y datos personales.',
        icon: 'fa-solid fa-user',
      },
      {
        id: 'appearance' as SettingsSectionId,
        label: 'Apariencia',
        description: 'Tema del sistema.',
        icon: 'fa-solid fa-palette',
      },
      {
        id: 'notifications' as SettingsSectionId,
        label: 'Notificaciones',
        description: 'Preferencias guardadas.',
        icon: 'fa-solid fa-bell',
      },
      {
        id: 'email' as SettingsSectionId,
        label: 'Correo',
        description: 'Historial de envios.',
        icon: 'fa-solid fa-envelope',
      },
      {
        id: 'security' as SettingsSectionId,
        label: 'Seguridad',
        description: 'Estado y control.',
        icon: 'fa-solid fa-shield-halved',
      },
    ];

    if (
      roleType === 'admin' ||
      roleType === 'superadmin' ||
      roleType === 'director' ||
      roleType === 'subdirector' ||
      roleType === 'ugel'
    ) {
      return [
        ...base,
        {
          id: 'logs' as SettingsSectionId,
          label: 'Logs',
          description: 'Auditoria reciente.',
          icon: 'fa-solid fa-clipboard-list',
        },
        {
          id: 'sessions' as SettingsSectionId,
          label: 'Sesiones',
          description: 'Accesos activos.',
          icon: 'fa-solid fa-laptop',
        },
      ];
    }

    return [
      ...base,
      {
        id: 'sessions' as SettingsSectionId,
        label: 'Sesiones',
        description: 'Dispositivos y accesos activos.',
        icon: 'fa-solid fa-laptop',
      },
    ];
  });
  protected readonly themeOptions = computed<SettingsThemeOption[]>(() => [
    { value: 'light' as ThemeConfig, label: 'Claro', description: 'Entorno luminoso.' },
    { value: 'dark' as ThemeConfig, label: 'Oscuro', description: 'Reduce brillo.' },
    {
      value: 'system' as ThemeConfig,
      label: 'Sistema',
      description: 'Respeta preferencia del dispositivo.',
    },
  ]);
  protected readonly generalRows = computed<SettingsInfoRow[]>(() => {
    const user = this.accountUser();
    const person = user?.person;
    const location = [person?.district, person?.province, person?.department]
      .filter(Boolean)
      .join(', ');
    return [
      {
        label: 'Nombre',
        value:
          `${user?.firstName || person?.firstName || ''} ${user?.lastName || person?.lastName || ''}`.trim() ||
          user?.username ||
          'No definido',
      },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Correo', value: user?.email || person?.email || 'No registrado' },
      { label: 'Rol', value: user?.role?.name || 'Sin rol' },
      { label: 'Institucion', value: user?.profile?.institution || 'No asignada' },
      { label: 'Telefono', value: person?.mobile || person?.phone || 'No registrado' },
      { label: 'Direccion', value: person?.address || 'No registrada' },
      { label: 'Ubicacion', value: location || 'No registrada' },
    ];
  });
  protected readonly settingsHeroPills = computed<SettingsHeroPill[]>(() => {
    const user = this.accountUser();
    return [
      { label: 'Rol', value: this.roleBadge() },
      { label: 'Módulos', value: String(this.modules().length) },
      { label: 'Tema', value: this.currentTheme() },
      { label: 'Estado', value: user?.isActive ? 'Activa' : 'Inactiva' },
    ];
  });
  protected readonly roleSettingsRows = computed<SettingsInfoRow[]>(() => {
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
  protected readonly notificationRows = computed<SettingsNotificationItem[]>(() => [
    {
      key: 'digest' as SettingsPreferenceKey,
      label: 'Resumen diario',
      description: 'Consolida pendientes y eventos.',
    },
    {
      key: 'reminders' as SettingsPreferenceKey,
      label: 'Recordatorios',
      description: 'Fechas de cierre y tareas.',
    },
    {
      key: 'incidents' as SettingsPreferenceKey,
      label: 'Incidencias',
      description: 'Errores operativos o accesos fallidos.',
    },
    {
      key: 'approvals' as SettingsPreferenceKey,
      label: 'Aprobaciones',
      description: 'Procesos que requieren accion.',
    },
    {
      key: 'browserAlerts' as SettingsPreferenceKey,
      label: 'Avisos en el panel',
      description: 'Banners y alertas internas.',
    },
    {
      key: 'newDeviceAlerts' as SettingsPreferenceKey,
      label: 'Nuevo dispositivo',
      description: 'Aviso por accesos desconocidos.',
    },
  ]);
  protected readonly emailRows = computed<SettingsInfoRow[]>(() => {
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
      },
    ];
  });
  protected readonly securityRows = computed<SettingsStatusRow[]>(() => {
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
      },
    ];
  });
  protected readonly auditRows = computed<SettingsAuditRow[]>(() =>
    this.userAudit().map((item) => ({
      id: item.id,
      title: `${item.action} · ${item.entity}`,
      description: item.description,
      time: this.formatDate(item.createdAt),
      icon: this.getAuditIcon(item.action),
    })),
  );
  protected readonly sessionRows = computed<SettingsInfoRow[]>(() => {
    const user = this.accountUser();
    return [
      { label: 'Estado', value: user?.status || 'Sin estado' },
      { label: 'Activo', value: user?.isActive ? 'Si' : 'No' },
      { label: 'Ultimo login', value: this.formatDate(user?.lastLogin) },
      { label: 'Usuario', value: user?.username || 'No definido' },
      { label: 'Rol', value: user?.role?.name || 'Sin rol' },
      { label: 'Modulos', value: `${this.modules().length}` },
      { label: 'Tema', value: this.currentTheme() },
    ];
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

  protected togglePreference(key: SettingsPreferenceKey) {
    this.preferences.update((state) => ({
      ...state,
      [key]: !state[key],
    }));

    this.persistPreferences(this.preferences());
  }

  protected toggleLiveClassReminder() {
    this.liveClassReminderEnabled.update((value) => !value);
    this.persistReminderPreferences();
  }

  protected setLiveClassReminderLeadMinutes(minutes: number) {
    this.liveClassReminderLeadMinutes.set(minutes);
    this.persistReminderPreferences();
  }

  protected toggleGlobalLiveClassReminder() {
    this.globalLiveClassReminderEnabled.update((value) => !value);
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
    this.authApi
      .updateSystemSetting(GLOBAL_TEACHER_REMINDER_KEY, {
        enabled: this.globalLiveClassReminderEnabled(),
        leadMinutes: this.globalLiveClassReminderLeadMinutes(),
      })
      .subscribe({
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
    this.authApi
      .getCurrentUserDetail(userId)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.userDetail.set(detail);
        this.loadingUser.set(false);
      });
  }

  private loadAudit(userId: string) {
    this.loadingAudit.set(true);
    this.authApi
      .getCurrentUserAudit(userId)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.userAudit.set(response?.data ?? []);
        this.loadingAudit.set(false);
      });
  }

  private loadSessions(userId: string) {
    this.loadingSessions.set(true);
    this.authApi
      .getCurrentUserSessions(userId, 6)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.userSessions.set(response?.data ?? []);
        this.loadingSessions.set(false);
      });
  }

  private loadEmailLogs(userId: string) {
    this.loadingEmailLogs.set(true);
    this.authApi
      .getCurrentUserEmailLogs(userId, 6)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.userEmailLogs.set(response?.data ?? []);
        this.loadingEmailLogs.set(false);
      });
  }

  private loadPreferences(userId: string) {
    this.authApi
      .getUserPreferences(userId)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (response?.preferences) {
          this.preferences.update((state) => ({
            ...state,
            ...response.preferences,
          }));
          this.liveClassReminderEnabled.set(
            response.preferences['liveClassReminderEnabled'] !== false,
          );
          this.liveClassReminderLeadMinutes.set(
            this.normalizeReminderLeadMinutes(response.preferences['liveClassReminderLeadMinutes']),
          );
        }
        this.preferenceStatus.set('Sincronizado');
      });
  }

  private loadGlobalReminderSettings() {
    if (!this.showGlobalReminderConfig()) return;

    this.authApi
      .getSystemSetting(GLOBAL_TEACHER_REMINDER_KEY)
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        const value = response?.data?.value ?? {};
        this.globalLiveClassReminderEnabled.set(value['enabled'] !== false);
        this.globalLiveClassReminderLeadMinutes.set(
          this.normalizeReminderLeadMinutes(value['leadMinutes']),
        );
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

    this.sessionApi
      .delete(sessionId)
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
