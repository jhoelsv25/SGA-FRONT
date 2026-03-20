import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { CurrentUser } from '@auth/types/auth-type';
import { UploadApi } from '@core/services/api/upload-api';
import { Toast } from '@core/services/toast';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { forkJoin, of } from 'rxjs';

type DetailRow = { label: string; value: string };

@Component({
  selector: 'sga-account-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardInputDirective,
    SelectOptionComponent,
  ],
  template: `
    <div class="space-y-6 p-4 md:p-6">
      <section class="relative overflow-hidden rounded-4xl border border-base-200 bg-card px-6 py-7 shadow-xl shadow-primary/5 lg:px-8">
        <div class="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-primary/10 blur-[60px]"></div>
        <div class="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-secondary/10 blur-[55px]"></div>

        <div class="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div class="flex min-w-0 items-start gap-5">
            <div class="relative">
              @if (photoUrl()) {
                <img
                  [src]="photoUrl()!"
                  [alt]="displayName()"
                  class="h-24 w-24 rounded-[2rem] border border-primary/15 object-cover shadow-2xl shadow-primary/15"
                />
              } @else {
                <div class="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary text-2xl font-black text-primary-foreground shadow-2xl shadow-primary/25">
                  {{ initials() }}
                </div>
              }

              @if (editing()) {
                <label class="absolute -bottom-2 -right-2 inline-flex h-10 cursor-pointer items-center justify-center rounded-[var(--radius-xl)] border border-base-200 bg-base-100 px-3 text-[10px] font-black uppercase tracking-[0.16em] shadow-lg transition hover:border-primary/30 hover:bg-primary/5">
                  <input type="file" class="hidden" accept="image/*" (change)="onPhotoSelected($event)" />
                  {{ photoUploading() ? '...' : 'Foto' }}
                </label>
              }
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  {{ roleBadge() }}
                </span>
                @if (user()?.role?.name) {
                  <span class="rounded-full border border-base-300 bg-base-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-base-content/65">
                    {{ user()!.role.name }}
                  </span>
                }
                @if (user()?.profile?.institutionName || user()?.profile?.institution) {
                  <span class="rounded-full border border-base-300 bg-base-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-base-content/65">
                    {{ user()?.profile?.institutionName || user()?.profile?.institution }}
                  </span>
                }
              </div>

              <h1 class="mt-3 truncate text-3xl font-black tracking-tight text-base-content">{{ displayName() }}</h1>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-base-content/60">{{ heroDescription() }}</p>

              <div class="mt-4 flex flex-wrap gap-3">
                @for (item of heroPills(); track item.label) {
                  <div class="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5">
                    <p class="text-[9px] font-black uppercase tracking-[0.18em] text-primary/70">{{ item.label }}</p>
                    <p class="mt-1 text-sm font-semibold text-base-content/80">{{ item.value }}</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            @if (!editing()) {
              <button z-button zColor="primary" class="h-12 rounded-4xl px-6 font-black uppercase tracking-[0.16em]" (click)="startEdit()">
                Editar perfil
              </button>
            } @else {
              <button z-button zType="outline" class="h-12 rounded-4xl px-6 font-black uppercase tracking-[0.16em]" (click)="cancelEdit()">
                Cancelar
              </button>
              <button z-button zColor="primary" class="h-12 rounded-4xl px-6 font-black uppercase tracking-[0.16em]" [disabled]="profileForm.invalid || saving()" (click)="saveProfile()">
                {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            }
            <a routerLink="/account/change-password" class="inline-flex h-12 items-center justify-center rounded-4xl border border-base-300 bg-base-100 px-6 text-xs font-black uppercase tracking-[0.16em] text-base-content/75 transition hover:border-primary/30 hover:bg-primary/5">
              Seguridad
            </a>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <z-card class="overflow-hidden rounded-4xl border border-base-200 bg-card">
          <div class="border-b border-base-200 px-6 py-5">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
              {{ editing() ? 'Edición de perfil' : 'Perfil personal' }}
            </p>
            <h2 class="mt-2 text-2xl font-black tracking-tight text-base-content">
              {{ editing() ? 'Actualiza tus datos principales' : 'Datos de cuenta y contacto' }}
            </h2>
          </div>

          @if (!editing()) {
            <div class="grid gap-4 p-6 md:grid-cols-2">
              @for (item of profileRows(); track item.label) {
                <div class="rounded-[var(--radius-xl)] border border-base-200 bg-base-100/70 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">{{ item.label }}</p>
                  <p class="mt-2 text-sm font-semibold text-base-content/80">{{ item.value }}</p>
                </div>
              }
            </div>
          } @else {
            <form [formGroup]="profileForm" class="space-y-6 p-6">
              <section>
                <div class="mb-4 flex items-center justify-between">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">Identidad</p>
                    <p class="mt-1 text-sm text-base-content/60">Información personal visible en el sistema.</p>
                  </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label class="label-form" for="firstName">Nombres</label>
                    <input z-input id="firstName" formControlName="firstName" />
                  </div>
                  <div>
                    <label class="label-form" for="lastName">Apellidos</label>
                    <input z-input id="lastName" formControlName="lastName" />
                  </div>
                  <div>
                    <label class="label-form" for="documentType">Tipo de documento</label>
                    <z-select-option id="documentType" formControlName="documentType" [options]="documentTypeOptions"></z-select-option>
                  </div>
                  <div>
                    <label class="label-form" for="documentNumber">Número de documento</label>
                    <input z-input id="documentNumber" formControlName="documentNumber" />
                  </div>
                  <div>
                    <label class="label-form" for="birthDate">Fecha de nacimiento</label>
                    <input z-input id="birthDate" type="date" formControlName="birthDate" />
                  </div>
                  <div>
                    <label class="label-form" for="gender">Género</label>
                    <z-select-option id="gender" formControlName="gender" [options]="genderOptions"></z-select-option>
                  </div>
                </div>
              </section>

              <section class="border-t border-base-200 pt-6">
                <div class="mb-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">Cuenta</p>
                  <p class="mt-1 text-sm text-base-content/60">Acceso principal y medios de contacto.</p>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <label class="label-form" for="username">Usuario</label>
                    <input z-input id="username" formControlName="username" />
                  </div>
                  <div>
                    <label class="label-form" for="email">Correo</label>
                    <input z-input id="email" type="email" formControlName="email" />
                  </div>
                  <div>
                    <label class="label-form" for="phone">Teléfono</label>
                    <input z-input id="phone" formControlName="phone" />
                  </div>
                  <div>
                    <label class="label-form" for="mobile">Celular</label>
                    <input z-input id="mobile" formControlName="mobile" />
                  </div>
                </div>
              </section>

              <section class="border-t border-base-200 pt-6">
                <div class="mb-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">Ubicación</p>
                  <p class="mt-1 text-sm text-base-content/60">Datos territoriales y de domicilio.</p>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="md:col-span-2">
                    <label class="label-form" for="address">Dirección</label>
                    <input z-input id="address" formControlName="address" />
                  </div>
                  <div>
                    <label class="label-form" for="district">Distrito</label>
                    <input z-input id="district" formControlName="district" />
                  </div>
                  <div>
                    <label class="label-form" for="province">Provincia</label>
                    <input z-input id="province" formControlName="province" />
                  </div>
                  <div>
                    <label class="label-form" for="department">Departamento</label>
                    <input z-input id="department" formControlName="department" />
                  </div>
                  <div>
                    <label class="label-form" for="nationality">Nacionalidad</label>
                    <input z-input id="nationality" formControlName="nationality" />
                  </div>
                </div>
              </section>
            </form>
          }
        </z-card>

        <div class="space-y-6">
          <z-card class="overflow-hidden rounded-4xl border border-base-200 bg-card">
            <div class="border-b border-base-200 px-6 py-5">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Contexto del rol</p>
              <h2 class="mt-2 text-2xl font-black tracking-tight text-base-content">Vista según tu perfil</h2>
            </div>

            <div class="space-y-3 p-6">
              @for (item of roleRows(); track item.label) {
                <div class="rounded-[var(--radius-xl)] border border-base-200 bg-base-100/70 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">{{ item.label }}</p>
                  <p class="mt-2 text-sm font-semibold text-base-content/80">{{ item.value }}</p>
                </div>
              } @empty {
                <div class="rounded-[var(--radius-xl)] border border-dashed border-base-300 bg-base-100/60 p-4 text-sm text-base-content/60">
                  Tu rol no tiene metadatos adicionales registrados todavía.
                </div>
              }
            </div>
          </z-card>

          <z-card class="overflow-hidden rounded-4xl border border-base-200 bg-card">
            <div class="border-b border-base-200 px-6 py-5">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Resumen operativo</p>
              <h2 class="mt-2 text-2xl font-black tracking-tight text-base-content">Cuenta actual</h2>
            </div>

            <div class="grid gap-3 p-6">
              @for (item of summaryRows(); track item.label) {
                <div class="rounded-[var(--radius-xl)] border border-base-200 bg-base-100/70 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.18em] text-base-content/45">{{ item.label }}</p>
                  <p class="mt-2 text-sm font-semibold text-base-content/80">{{ item.value }}</p>
                </div>
              }
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
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(Toast);
  private readonly uploadApi = inject(UploadApi);

  protected readonly user = computed(() => this.authFacade.getCurrentUser());
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly photoUploading = signal(false);
  protected readonly photoUrl = signal<string | null>(null);

  protected readonly documentTypeOptions = [
    { value: 'dni', label: 'DNI' },
    { value: 'passport', label: 'Pasaporte' },
    { value: 'other', label: 'Otro' },
  ];

  protected readonly genderOptions = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
  ];

  protected readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    documentType: ['dni', [Validators.required]],
    documentNumber: [''],
    birthDate: [''],
    gender: ['OTHER'],
    phone: [''],
    mobile: [''],
    address: [''],
    district: [''],
    province: [''],
    department: [''],
    nationality: [''],
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user || this.editing()) return;
      this.applyUserSnapshot(user);
    });
  }

  protected readonly displayName = computed(() => {
    const user = this.user();
    const firstName = this.profileForm.get('firstName')?.value || user?.firstName || user?.person?.firstName || '';
    const lastName = this.profileForm.get('lastName')?.value || user?.lastName || user?.person?.lastName || '';
    return `${firstName} ${lastName}`.trim() || user?.username || 'Usuario';
  });

  protected readonly initials = computed(() => {
    const parts = this.displayName().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
  });

  protected readonly roleBadge = computed(() => this.user()?.profile?.roleLabel || this.user()?.role?.name || 'Perfil');

  protected readonly heroDescription = computed(() => {
    const type = this.user()?.profile?.type;
    if (type === 'teacher') return 'Administra tus datos personales y revisa el contexto académico con el que trabajas dentro del sistema.';
    if (type === 'student') return 'Mantén actualizado tu perfil y verifica la información académica asociada a tu cuenta institucional.';
    if (type === 'guardian') return 'Actualiza tus datos de contacto y revisa el contexto familiar vinculado a tu acceso.';
    if (type === 'director' || type === 'admin' || type === 'superadmin') {
      return 'Gestiona la identidad principal de tu cuenta y mantén consistente tu información institucional.';
    }
    return 'Edita tus datos base y revisa el contexto actual de tu cuenta autenticada.';
  });

  protected readonly heroPills = computed<DetailRow[]>(() => {
    const user = this.user();
    const profile = user?.profile;
    return [
      { label: 'Código', value: user?.code || profile?.code || 'No registrado' },
      { label: 'Módulos', value: String(this.authFacade.getModules().length || 0) },
      { label: 'Estado', value: user?.isActive ? 'Activo' : 'Inactivo' },
    ];
  });

  protected readonly roleRows = computed<DetailRow[]>(() => {
    const user = this.user();
    const details = user?.profile?.details ?? {};
    const stats = user?.profile?.stats ?? {};
    const rows: DetailRow[] = [];

    for (const [key, value] of Object.entries(details)) {
      if (value === null || value === undefined || value === '') continue;
      rows.push({ label: this.humanizeKey(key), value: String(value) });
    }

    for (const [key, value] of Object.entries(stats)) {
      if (value === null || value === undefined || value === '') continue;
      rows.push({ label: this.humanizeKey(key), value: String(value) });
    }

    return rows;
  });

  protected readonly profileRows = computed<DetailRow[]>(() => {
    const person = this.user()?.person;
    return [
      { label: 'Nombre', value: this.displayName() },
      { label: 'Usuario', value: this.user()?.username || 'No definido' },
      { label: 'Correo', value: this.user()?.email || person?.email || 'No registrado' },
      { label: 'Documento', value: `${this.documentTypeLabel(person?.documentType)} ${person?.documentNumber || ''}`.trim() || 'No registrado' },
      { label: 'Teléfono', value: person?.phone || 'No registrado' },
      { label: 'Celular', value: person?.mobile || 'No registrado' },
      { label: 'Dirección', value: person?.address || 'No registrada' },
      {
        label: 'Ubicación',
        value: [person?.district, person?.province, person?.department].filter(Boolean).join(', ') || 'No registrada',
      },
    ];
  });

  protected readonly summaryRows = computed<DetailRow[]>(() => {
    const user = this.user();
    const person = user?.person;
    return [
      { label: 'Correo principal', value: user?.email || person?.email || 'No registrado' },
      { label: 'Institución', value: user?.profile?.institutionName || user?.profile?.institution || 'No asignada' },
      { label: 'Ubicación', value: [person?.district, person?.province, person?.department].filter(Boolean).join(', ') || 'No registrada' },
      { label: 'Documento', value: `${this.documentTypeLabel(person?.documentType)} ${person?.documentNumber || ''}`.trim() || 'No registrado' },
    ];
  });

  protected startEdit(): void {
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    const user = this.user();
    if (user) this.applyUserSnapshot(user);
    this.editing.set(false);
  }

  protected saveProfile(): void {
    const user = this.user();
    if (!user || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.getRawValue();
    const userRequest = this.http.patch(`users/${user.id}`, {
      username: values.username,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
    });

    const personRequest = user.person?.id
      ? this.http.patch(`persons/${user.person.id}`, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          documentType: values.documentType,
          documentNumber: values.documentNumber || undefined,
          birthDate: values.birthDate || undefined,
          gender: values.gender,
          phone: values.phone || undefined,
          mobile: values.mobile || undefined,
          address: values.address || undefined,
          district: values.district || undefined,
          province: values.province || undefined,
          department: values.department || undefined,
          nationality: values.nationality || undefined,
          photoUrl: this.photoUrl() || undefined,
        })
      : of(null);

    this.saving.set(true);
    forkJoin([userRequest, personRequest]).subscribe({
      next: () => {
        this.authFacade.refreshSession().subscribe({
          next: () => {
            this.saving.set(false);
            this.editing.set(false);
            this.toast.success('Perfil actualizado correctamente');
          },
          error: () => {
            this.saving.set(false);
            this.editing.set(false);
            this.toast.success('Perfil actualizado correctamente');
          },
        });
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('No se pudo actualizar el perfil', { description: error?.message });
      },
    });
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.photoUploading.set(true);
    this.uploadApi.upload(file, {
      category: 'persons',
      entityCode: this.user()?.code || this.user()?.username || undefined,
      preserveName: false,
    }).subscribe({
      next: (response) => {
        this.photoUrl.set(response.url);
        this.photoUploading.set(false);
        input.value = '';
      },
      error: () => {
        this.photoUploading.set(false);
        input.value = '';
      },
    });
  }

  private applyUserSnapshot(user: CurrentUser): void {
    this.photoUrl.set(user.profilePicture || user.person?.photoUrl || null);
    this.profileForm.patchValue(
      {
        firstName: user.firstName || user.person?.firstName || '',
        lastName: user.lastName || user.person?.lastName || '',
        username: user.username || '',
        email: user.email || user.person?.email || '',
        documentType: user.person?.documentType || 'dni',
        documentNumber: user.person?.documentNumber || '',
        birthDate: user.person?.birthDate ? String(user.person.birthDate).slice(0, 10) : '',
        gender: user.person?.gender || 'OTHER',
        phone: user.person?.phone || '',
        mobile: user.person?.mobile || '',
        address: user.person?.address || '',
        district: user.person?.district || '',
        province: user.person?.province || '',
        department: user.person?.department || '',
        nationality: user.person?.nationality || '',
      },
      { emitEvent: false },
    );
  }

  private humanizeKey(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private documentTypeLabel(value?: string): string {
    if (value === 'dni') return 'DNI';
    if (value === 'passport') return 'Pasaporte';
    if (value === 'other') return 'Otro';
    return 'Documento';
  }
}
