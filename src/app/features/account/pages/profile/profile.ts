import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { CurrentUser } from '@auth/types/auth-type';
import { UploadApi } from '@core/services/api/upload-api';
import { AvatarVersionService } from '@core/services/avatar-version.service';
import { Toast } from '@core/services/toast';
import { forkJoin, of } from 'rxjs';
import { ProfileHeroComponent } from '../../components/profile/profile-hero/profile-hero';
import { ProfileMainPanelComponent } from '../../components/profile/profile-main-panel/profile-main-panel';

type DetailRow = { label: string; value: string };

@Component({
  selector: 'sga-account-profile',
  imports: [CommonModule, ReactiveFormsModule, ProfileHeroComponent, ProfileMainPanelComponent],
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccountProfilePage {
  private readonly authFacade = inject(AuthFacade);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(Toast);
  private readonly uploadApi = inject(UploadApi);
  private readonly avatarVersion = inject(AvatarVersionService);

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
    const firstName =
      this.profileForm.get('firstName')?.value || user?.firstName || user?.person?.firstName || '';
    const lastName =
      this.profileForm.get('lastName')?.value || user?.lastName || user?.person?.lastName || '';
    return `${firstName} ${lastName}`.trim() || user?.username || 'Usuario';
  });

  protected readonly initials = computed(() => {
    const parts = this.displayName().split(/\s+/).filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U'
    );
  });

  protected readonly roleBadge = computed(
    () => this.user()?.profile?.roleLabel || this.user()?.role?.name || 'Perfil',
  );
  protected readonly roleType = computed(() => this.user()?.profile?.type || 'user');

  protected readonly heroDescription = computed(() => {
    const type = this.user()?.profile?.type;
    if (type === 'teacher')
      return 'Administra tus datos personales y revisa el contexto académico con el que trabajas dentro del sistema.';
    if (type === 'student')
      return 'Mantén actualizado tu perfil y verifica la información académica asociada a tu cuenta institucional.';
    if (type === 'guardian')
      return 'Actualiza tus datos de contacto y revisa el contexto familiar vinculado a tu acceso.';
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

  protected readonly roleSectionTitle = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Contexto docente';
      case 'student':
        return 'Contexto estudiantil';
      case 'guardian':
        return 'Contexto familiar';
      case 'director':
      case 'admin':
      case 'superadmin':
      case 'subdirector':
      case 'ugel':
        return 'Contexto institucional';
      default:
        return 'Contexto del rol';
    }
  });

  protected readonly roleSectionDescription = computed(() => {
    switch (this.roleType()) {
      case 'teacher':
        return 'Información académica y operativa asociada a tu función docente.';
      case 'student':
        return 'Datos de matrícula, seguimiento académico y vínculo con tu aula.';
      case 'guardian':
        return 'Relación con estudiantes vinculados y canales de contacto del hogar.';
      case 'director':
      case 'admin':
      case 'superadmin':
      case 'subdirector':
      case 'ugel':
        return 'Datos de gestión, rol institucional y alcance operativo actual.';
      default:
        return 'Metadatos asociados a tu cuenta actual.';
    }
  });

  protected readonly roleEditGroups = computed(() => {
    const rows = this.roleRows();
    if (!rows.length) return [];

    const groups = {
      identity: [] as DetailRow[],
      academic: [] as DetailRow[],
      operational: [] as DetailRow[],
    };

    for (const row of rows) {
      const label = row.label.toLowerCase();
      if (/(grado|curso|secci|competenc|matr|aula|student|alumno|promedio|nota)/.test(label)) {
        groups.academic.push(row);
      } else if (
        /(instit|rol|estado|modul|sesion|carga|horas|docente|apoderado|famil)/.test(label)
      ) {
        groups.operational.push(row);
      } else {
        groups.identity.push(row);
      }
    }

    return [
      { key: 'identity', title: 'Identidad del rol', rows: groups.identity },
      { key: 'academic', title: 'Contexto académico', rows: groups.academic },
      { key: 'operational', title: 'Operación actual', rows: groups.operational },
    ].filter((group) => group.rows.length);
  });

  protected readonly profileRows = computed<DetailRow[]>(() => {
    const person = this.user()?.person;
    return [
      { label: 'Nombre', value: this.displayName() },
      { label: 'Usuario', value: this.user()?.username || 'No definido' },
      { label: 'Correo', value: this.user()?.email || person?.email || 'No registrado' },
      {
        label: 'Documento',
        value:
          `${this.documentTypeLabel(person?.documentType)} ${person?.documentNumber || ''}`.trim() ||
          'No registrado',
      },
      { label: 'Teléfono', value: person?.phone || 'No registrado' },
      { label: 'Celular', value: person?.mobile || 'No registrado' },
      { label: 'Dirección', value: person?.address || 'No registrada' },
      {
        label: 'Ubicación',
        value:
          [person?.district, person?.province, person?.department].filter(Boolean).join(', ') ||
          'No registrada',
      },
    ];
  });

  protected readonly summaryRows = computed<DetailRow[]>(() => {
    const user = this.user();
    const person = user?.person;
    return [
      { label: 'Correo principal', value: user?.email || person?.email || 'No registrado' },
      {
        label: 'Institución',
        value: user?.profile?.institutionName || user?.profile?.institution || 'No asignada',
      },
      {
        label: 'Ubicación',
        value:
          [person?.district, person?.province, person?.department].filter(Boolean).join(', ') ||
          'No registrada',
      },
      {
        label: 'Documento',
        value:
          `${this.documentTypeLabel(person?.documentType)} ${person?.documentNumber || ''}`.trim() ||
          'No registrado',
      },
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

    const user = this.user();
    if (!user?.person?.id) {
      this.toast.error('No se encontró un perfil personal para actualizar la foto.');
      input.value = '';
      return;
    }

    this.photoUploading.set(true);
    this.prepareAvatarFile(file)
      .then((avatarFile) => {
        this.uploadApi
          .upload(avatarFile, {
            category: 'persons',
            entityCode: user.code || undefined,
            preserveName: false,
          })
          .subscribe({
            next: (response) => {
              this.http
                .patch(`persons/${user.person!.id}`, {
                  photoUrl: response.url,
                })
                .subscribe({
                  next: () => {
                    const version = this.avatarVersion.markUpdated();
                    this.photoUrl.set(this.withAvatarVersion(response.url, version));
                    this.authFacade.refreshSession().subscribe({
                      next: () => {
                        this.photoUploading.set(false);
                        input.value = '';
                        this.toast.success('Foto de perfil actualizada correctamente');
                      },
                      error: () => {
                        this.photoUploading.set(false);
                        input.value = '';
                        this.toast.success('Foto de perfil actualizada correctamente');
                      },
                    });
                  },
                  error: () => {
                    this.photoUploading.set(false);
                    input.value = '';
                    this.toast.error('No se pudo guardar la foto de perfil');
                  },
                });
            },
            error: () => {
              this.photoUploading.set(false);
              input.value = '';
              this.toast.error('No se pudo subir la foto de perfil');
            },
          });
      })
      .catch(() => {
        this.photoUploading.set(false);
        input.value = '';
        this.toast.error('No se pudo preparar la foto de perfil');
      });
  }

  private async prepareAvatarFile(file: File): Promise<File> {
    const image = await this.loadImage(file);
    const cropSize = Math.min(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
    );
    const sourceX = Math.max(0, ((image.naturalWidth || image.width) - cropSize) / 2);
    const sourceY = Math.max(0, ((image.naturalHeight || image.height) - cropSize) / 2);
    const canvas = document.createElement('canvas');
    const targetSize = 512;

    canvas.width = targetSize;
    canvas.height = targetSize;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas no disponible');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, targetSize, targetSize);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92);
    });

    if (!blob) {
      throw new Error('No se pudo generar el avatar');
    }

    const baseName = (file.name || 'avatar').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo cargar la imagen'));
      };

      image.src = objectUrl;
    });
  }

  private applyUserSnapshot(user: CurrentUser): void {
    this.photoUrl.set(
      this.avatarVersion.withVersion(user.profilePicture || user.person?.photoUrl || null),
    );
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

  private withAvatarVersion(url: string, version: number): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${version}`;
  }
}
