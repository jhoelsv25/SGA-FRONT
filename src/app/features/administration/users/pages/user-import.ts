import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ExcelService } from '@core/services/excel.service';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar';
import { UserApi } from '../../services/api/user-api';
import {
  UserImportProgressPayload,
  UserImportSocketService,
} from '../../services/user-import.socket';
import { UserImportDropzone } from '../components/user-import-dropzone/user-import-dropzone';

const FIELD_OPTIONS = [
  { key: 'username', label: 'Usuario', required: true, description: 'Identificador único del usuario' },
  { key: 'email', label: 'Correo', required: true, description: 'Correo único para usuario y persona' },
  { key: 'firstName', label: 'Nombres', required: true, description: 'Nombres de la persona asociada' },
  { key: 'lastName', label: 'Apellidos', required: true, description: 'Apellidos de la persona asociada' },
  { key: 'role', label: 'Rol', required: true, description: 'Nombre o UUID del rol existente' },
  { key: 'password', label: 'Contraseña', required: false, description: 'Opcional. Si falta, se usa una temporal' },
  { key: 'status', label: 'Estado', required: false, description: 'ACTIVE, INACTIVE o SUSPENDED' },
  { key: 'isActive', label: 'Activo', required: false, description: 'true/false, si/no, 1/0' },
] as const;

@Component({
  selector: 'sga-user-import',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardProgressBarComponent,
    RouterLink,
    UserImportDropzone,
  ],
  templateUrl: './user-import.html',
  styles: [
    `
      :host {
        display: block;
        background: radial-gradient(circle at top right, var(--primary-muted), transparent 40%);
        min-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UserImportPage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApi);
  private readonly socketService = inject(UserImportSocketService);
  private readonly excel = inject(ExcelService);
  private progressSub?: Subscription;
  private completeSub?: Subscription;

  readonly fieldOptions = FIELD_OPTIONS;
  readonly step = signal<'upload' | 'mapping' | 'importing' | 'done'>('upload');
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly uploadId = signal<string | null>(null);
  readonly headers = signal<string[]>([]);
  readonly rowCount = signal(0);
  readonly columnMapping = signal<Record<string, string>>({});
  readonly jobId = signal<string | null>(null);
  readonly progress = signal<UserImportProgressPayload | null>(null);
  readonly result = signal<UserImportProgressPayload | null>(null);

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
    this.completeSub?.unsubscribe();
    this.socketService.disconnect();
  }

  onFileSelected(file: File) {
    this.selectedFile.set(file);
    this.errorMessage.set(null);
  }

  importUsers() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.userApi.uploadImportFile(file).subscribe({
      next: (response) => {
        this.uploadId.set(response.uploadId);
        this.headers.set(response.headers);
        this.rowCount.set(response.rowCount);
        this.columnMapping.set(this.autoMap(response.headers));
        this.isUploading.set(false);
        this.step.set('mapping');
      },
      error: (err) => {
        this.isUploading.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'No se pudo procesar el archivo');
      },
    });
  }

  onCancel() {
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  setMapping(field: string, header: string): void {
    const current = { ...this.columnMapping() };
    if (!header) {
      delete current[field];
    } else {
      current[field] = header;
    }
    this.columnMapping.set(current);
  }

  getMapping(field: string): string {
    return this.columnMapping()[field] ?? '';
  }

  canStartImport(): boolean {
    const mapping = this.columnMapping();
    return ['username', 'email', 'firstName', 'lastName', 'role'].every((field) => !!mapping[field]);
  }

  startAsyncImport(): void {
    const uploadId = this.uploadId();
    if (!uploadId || !this.canStartImport()) return;

    this.errorMessage.set(null);
    this.step.set('importing');
    this.progress.set({
      jobId: '',
      processed: 0,
      total: this.rowCount(),
      percentage: 0,
      created: 0,
      errors: [],
    });

    this.socketService.connect();
    this.progressSub?.unsubscribe();
    this.completeSub?.unsubscribe();

    this.progressSub = this.socketService.progress$.subscribe((payload) => {
      const currentJobId = this.jobId();
      if (currentJobId && payload.jobId !== currentJobId) return;
      this.progress.set(payload);
    });

    this.completeSub = this.socketService.complete$.subscribe((payload) => {
      const currentJobId = this.jobId();
      if (currentJobId && payload.jobId !== currentJobId) return;
      this.result.set(payload);
      this.progress.set(payload);
      this.step.set('done');
      this.socketService.disconnect();
    });

    this.userApi.startImport(uploadId, this.columnMapping()).subscribe({
      next: ({ jobId }) => {
        this.jobId.set(jobId);
      },
      error: (err) => {
        this.step.set('mapping');
        this.socketService.disconnect();
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'No se pudo iniciar la importación');
      },
    });
  }

  resetFlow(): void {
    this.progressSub?.unsubscribe();
    this.completeSub?.unsubscribe();
    this.socketService.disconnect();
    this.selectedFile.set(null);
    this.isUploading.set(false);
    this.errorMessage.set(null);
    this.uploadId.set(null);
    this.headers.set([]);
    this.rowCount.set(0);
    this.columnMapping.set({});
    this.jobId.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.step.set('upload');
  }

  downloadTemplate(): void {
    this.excel.downloadTemplate(
      FIELD_OPTIONS.map(({ key, label }) => ({ key, label })),
      {
        username: 'jperez',
        email: 'juan.perez@colegio.edu.pe',
        firstName: 'Juan',
        lastName: 'Perez Soto',
        role: 'Estudiante',
        password: 'Temp12345!',
        status: 'ACTIVE',
        isActive: 'true',
      },
      { sheetName: 'Usuarios', fileName: 'plantilla_usuarios.xlsx' },
    );
  }

  goBack(): void {
    this.router.navigate(['/administration/users']);
  }

  private autoMap(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      username: ['usuario', 'username', 'user', 'login'],
      email: ['correo', 'email', 'mail', 'correo_electronico'],
      firstName: ['nombres', 'nombre', 'first_name', 'firstname'],
      lastName: ['apellidos', 'apellido', 'last_name', 'lastname'],
      role: ['rol', 'role', 'perfil'],
      password: ['contrasena', 'contraseña', 'password', 'clave'],
      status: ['estado', 'status'],
      isActive: ['activo', 'is_active', 'habilitado'],
    };

    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    for (const field of FIELD_OPTIONS) {
      const candidates = aliases[field.key] ?? [field.label];
      const match = headers.find((header) => {
        const normalizedHeader = normalize(header);
        return candidates.some((candidate) => {
          const normalizedCandidate = normalize(candidate);
          return normalizedHeader === normalizedCandidate || normalizedHeader.includes(normalizedCandidate);
        });
      });

      if (match) {
        mapping[field.key] = match;
      }
    }

    return mapping;
  }
}
