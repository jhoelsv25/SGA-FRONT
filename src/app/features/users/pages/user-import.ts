import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { SgaDisableIfNoPermissionDirective } from '@/shared/core/directives/permission/disable-if-no-permission.directive';
import { SgaHasPermissionDirective } from '@/shared/core/directives/permission/has-permission.directive';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar';
import { ExcelService } from '@core/services/excel.service';
import { UserApi } from '@features/admin-services/api/user-api';
import {
  UserImportProgressPayload,
  UserImportSocketService,
} from '@features/admin-services/user-import.socket';
import { UserImportDropzone } from '../components/user-import-dropzone/user-import-dropzone';

const FIELD_OPTIONS = [
  {
    key: 'username',
    label: 'Usuario',
    required: true,
    description: 'Identificador único del usuario',
  },
  {
    key: 'email',
    label: 'Correo',
    required: false,
    description: 'Opcional. Correo único para usuario y persona',
  },
  {
    key: 'firstName',
    label: 'Nombres',
    required: true,
    description: 'Nombres de la persona asociada',
  },
  {
    key: 'lastName',
    label: 'Apellidos',
    required: true,
    description: 'Apellidos de la persona asociada',
  },
  {
    key: 'docNumber',
    label: 'DNI / Nro. Documento',
    required: false,
    description: 'Se usará como contraseña por defecto',
  },
  {
    key: 'birthDate',
    label: 'Fecha Nacimiento',
    required: false,
    description: 'Formato YYYY-MM-DD',
  },
  { key: 'gender', label: 'Género', required: false, description: 'M, F u O' },
  { key: 'address', label: 'Dirección', required: false, description: 'Dirección de domicilio' },
  { key: 'phone', label: 'Teléfono', required: false, description: 'Teléfono fijo' },
  { key: 'mobile', label: 'Celular', required: false, description: 'Número de celular' },
  { key: 'role', label: 'Rol', required: true, description: 'Nombre o UUID del rol existente' },
  {
    key: 'institution',
    label: 'Institucion',
    required: false,
    description: 'Nombre o UUID de la institución',
  },
  {
    key: 'password',
    label: 'Contraseña',
    required: false,
    description: 'Opcional. Si falta, se usa el DNI',
  },
  { key: 'status', label: 'Estado', required: false, description: 'ACTIVE, INACTIVE o SUSPENDED' },
  { key: 'isActive', label: 'Activo', required: false, description: 'true/false, si/no, 1/0' },
  {
    key: 'studentCode',
    label: 'Codigo Estudiante',
    required: false,
    description: 'Obligatorio si el rol de la fila es Estudiante',
  },
  {
    key: 'studentType',
    label: 'Tipo Estudiante',
    required: false,
    description: 'regular, irregular o external',
  },
  {
    key: 'studentStatus',
    label: 'Estado Estudiante',
    required: false,
    description: 'active, inactive, graduated o dropped_out',
  },
  {
    key: 'admissionDate',
    label: 'Fecha Admision',
    required: false,
    description: 'Fecha de admisión del estudiante en formato YYYY-MM-DD',
  },
  {
    key: 'teacherCode',
    label: 'Codigo Docente',
    required: false,
    description: 'Obligatorio si el rol de la fila es Docente o Director',
  },
  {
    key: 'specialization',
    label: 'Especialidad',
    required: false,
    description: 'Especialidad del docente',
  },
  {
    key: 'professionalTitle',
    label: 'Titulo Profesional',
    required: false,
    description: 'Título profesional del docente',
  },
  {
    key: 'university',
    label: 'Universidad',
    required: false,
    description: 'Universidad de graduación',
  },
  {
    key: 'graduationYear',
    label: 'Anio Graduacion',
    required: false,
    description: 'Año de graduación del docente',
  },
  {
    key: 'professionalLicense',
    label: 'Licencia Profesional',
    required: false,
    description: 'Número de licencia profesional',
  },
  {
    key: 'contractType',
    label: 'Tipo Contrato',
    required: false,
    description: 'full_time, part_time, temporary o permanent',
  },
  {
    key: 'laborRegime',
    label: 'Regimen Laboral',
    required: false,
    description: 'public o private',
  },
  {
    key: 'hireDate',
    label: 'Fecha Contratacion',
    required: false,
    description: 'Fecha de contratación en formato YYYY-MM-DD',
  },
  {
    key: 'workloadType',
    label: 'Carga Horaria',
    required: false,
    description: '20_hours, 30_hours o 40_hours',
  },
  {
    key: 'weeklyHours',
    label: 'Horas Semanales',
    required: false,
    description: 'Cantidad de horas semanales',
  },
  {
    key: 'teachingLevel',
    label: 'Nivel Ensenanza',
    required: false,
    description: 'Nivel de enseñanza del docente',
  },
  {
    key: 'employmentStatus',
    label: 'Estado Laboral',
    required: false,
    description: 'active, inactive u on_leave',
  },
] as const;

type ImportHistoryItem = {
  id: string;
  jobId: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  createdRows: number;
  failedRows: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  errorDetails?: { row: number; message: string; rowData?: Record<string, unknown> }[] | null;
};

@Component({
  selector: 'sga-user-import',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardProgressBarComponent,
    RouterLink,
    UserImportDropzone,
    SgaHasPermissionDirective,
    SgaDisableIfNoPermissionDirective,
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
export default class UserImportPage implements OnDestroy, OnInit {
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
  readonly previewRows = signal<Record<string, unknown>[]>([]);
  readonly validationIssues = signal<string[]>([]);
  readonly jobId = signal<string | null>(null);
  readonly progress = signal<UserImportProgressPayload | null>(null);
  readonly result = signal<UserImportProgressPayload | null>(null);
  readonly importHistory = signal<ImportHistoryItem[]>([]);
  readonly selectedHistory = signal<ImportHistoryItem | null>(null);

  ngOnInit(): void {
    this.loadImportHistory();
  }

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
      next: async (response) => {
        try {
          this.uploadId.set(response.uploadId);
          this.headers.set(response.headers);
          this.rowCount.set(response.rowCount);
          this.columnMapping.set(this.autoMap(response.headers));
          await this.loadPreviewRows(file, response.headers);
          this.refreshValidationIssues();
          this.isUploading.set(false);
          this.step.set('mapping');
        } catch (error) {
          this.isUploading.set(false);
          this.errorMessage.set(
            error instanceof Error
              ? error.message
              : 'No se pudo validar localmente el archivo cargado',
          );
        }
      },
      error: (err) => {
        this.isUploading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'No se pudo procesar el archivo',
        );
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
    this.refreshValidationIssues();
  }

  getMapping(field: string): string {
    return this.columnMapping()[field] ?? '';
  }

  canStartImport(): boolean {
    return this.validationIssues().length === 0;
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
      this.loadImportHistory();
    });

    this.userApi.startImport(uploadId, this.columnMapping()).subscribe({
      next: ({ jobId }) => {
        this.jobId.set(jobId);
        this.loadImportHistory();
      },
      error: (err) => {
        this.step.set('mapping');
        this.socketService.disconnect();
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'No se pudo iniciar la importación',
        );
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
    this.previewRows.set([]);
    this.validationIssues.set([]);
    this.jobId.set(null);
    this.progress.set(null);
    this.result.set(null);
    this.step.set('upload');
  }

  downloadTemplate(): void {
    this.userApi.downloadImportTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla_usuarios.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'No se pudo descargar la plantilla',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/administration/users']);
  }

  exportErrors(): void {
    const errors = this.result()?.errors ?? [];
    if (!errors.length) return;
    this.exportErrorRows(errors, 'errores_importacion_usuarios.xlsx');
  }

  openHistoryDetail(item: ImportHistoryItem): void {
    this.selectedHistory.set(item);
  }

  closeHistoryDetail(): void {
    this.selectedHistory.set(null);
  }

  exportHistoryErrors(item: ImportHistoryItem): void {
    const errors = item.errorDetails ?? [];
    if (!errors.length) return;
    const safeFileName = item.fileName.replace(/\.(xlsx|xls|csv)$/i, '');
    this.exportErrorRows(errors, `errores_${safeFileName}.xlsx`);
  }

  private exportErrorRows(
    errors: { row: number; message: string; rowData?: Record<string, unknown> }[],
    fileName: string,
  ): void {
    if (!errors.length) return;

    const dynamicKeys = Array.from(
      new Set(errors.flatMap((error) => Object.keys(error.rowData ?? {}))),
    );

    const columns = [
      { key: 'row', label: 'Fila' },
      { key: 'message', label: 'Motivo' },
      ...dynamicKeys.map((key) => ({
        key,
        label: FIELD_OPTIONS.find((field) => field.key === key)?.label ?? key,
      })),
    ];

    const data = errors.map((error) => {
      const base: Record<string, unknown> = {
        row: error.row,
        message: error.message,
      };

      for (const key of dynamicKeys) {
        base[key] = error.rowData?.[key] ?? '';
      }

      return base;
    });

    this.excel.downloadExport(columns, data, {
      sheetName: 'Errores Importacion Usuarios',
      fileName,
    });
  }

  getDetectedRoleLabels(): string[] {
    return Array.from(this.detectedRoles()).map((role) => {
      if (role === 'estudiante') return 'Estudiante';
      if (role === 'docente') return 'Docente';
      if (role === 'director') return 'Director';
      return role;
    });
  }

  private async loadPreviewRows(file: File, headers: string[]): Promise<void> {
    const columns = headers.map((header) => ({ key: header, label: header }));
    const rows = await this.excel.parse(file, columns);
    this.previewRows.set(rows);
  }

  loadImportHistory(): void {
    this.userApi.getImportHistory().subscribe({
      next: (history) => this.importHistory.set(history),
      error: () => {},
    });
  }

  private refreshValidationIssues(): void {
    this.validationIssues.set(this.collectValidationIssues());
  }

  private collectValidationIssues(): string[] {
    const issues: string[] = [];
    const mapping = this.columnMapping();
    const baseRequired = ['username', 'firstName', 'lastName', 'role'];

    for (const field of baseRequired) {
      if (!mapping[field]) {
        const label = FIELD_OPTIONS.find((option) => option.key === field)?.label ?? field;
        issues.push(`Falta mapear la columna obligatoria "${label}"`);
      }
    }

    const roles = this.detectedRoles();

    if (roles.has('estudiante') && !mapping['studentCode']) {
      issues.push(
        'El archivo contiene filas con rol Estudiante y falta mapear "Codigo Estudiante"',
      );
    }

    if (roles.has('docente') || roles.has('director')) {
      const teacherRequired = [
        'teacherCode',
        'institution',
        'specialization',
        'professionalTitle',
        'university',
        'professionalLicense',
        'teachingLevel',
      ];

      for (const field of teacherRequired) {
        if (!mapping[field]) {
          const label = FIELD_OPTIONS.find((option) => option.key === field)?.label ?? field;
          issues.push(
            `El archivo contiene filas con rol Docente/Director y falta mapear "${label}"`,
          );
        }
      }
    }

    return Array.from(new Set(issues));
  }

  private detectedRoles(): Set<string> {
    const roles = new Set<string>();
    const roleColumn = this.columnMapping()['role'];
    if (!roleColumn) return roles;

    for (const row of this.previewRows()) {
      const rawRole = String(row[roleColumn] ?? '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

      if (rawRole) roles.add(rawRole);
    }

    return roles;
  }

  private autoMap(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const aliases: Record<string, string[]> = {
      username: ['usuario', 'username', 'user', 'login'],
      email: ['correo', 'email', 'mail', 'correo_electronico'],
      firstName: ['nombres', 'nombre', 'first_name', 'firstname'],
      lastName: ['apellidos', 'apellido', 'last_name', 'lastname'],
      role: ['rol', 'role', 'perfil'],
      institution: ['institucion', 'institución', 'institution', 'colegio'],
      password: ['contrasena', 'contraseña', 'password', 'clave'],
      status: ['estado', 'status'],
      isActive: ['activo', 'is_active', 'habilitado'],
      studentCode: ['codigo_estudiante', 'codigo', 'student_code', 'cod_estudiante'],
      studentType: ['tipo_estudiante', 'student_type'],
      studentStatus: ['estado_estudiante', 'student_status'],
      admissionDate: ['fecha_admision', 'admission_date', 'fecha_ingreso'],
      teacherCode: ['codigo_docente', 'teacher_code', 'cod_docente'],
      specialization: ['especialidad', 'specialization'],
      professionalTitle: ['titulo_profesional', 'titulo', 'professional_title'],
      university: ['universidad', 'university'],
      graduationYear: ['anio_graduacion', 'año_graduacion', 'graduation_year'],
      professionalLicense: ['licencia_profesional', 'professional_license', 'licencia'],
      contractType: ['tipo_contrato', 'contract_type'],
      laborRegime: ['regimen_laboral', 'régimen_laboral', 'labor_regime'],
      hireDate: ['fecha_contratacion', 'hire_date', 'fecha_ingreso_docente'],
      workloadType: ['carga_horaria', 'workload_type'],
      weeklyHours: ['horas_semanales', 'weekly_hours'],
      teachingLevel: ['nivel_ensenanza', 'nivel_enseñanza', 'teaching_level'],
      employmentStatus: ['estado_laboral', 'employment_status'],
      docNumber: ['dni', 'nro_documento', 'documento', 'document_number', 'doc_number'],
      birthDate: ['fecha_nacimiento', 'nacimiento', 'birth_date', 'birthdate'],
      gender: ['genero', 'género', 'sexo', 'gender'],
      address: ['direccion', 'dirección', 'address'],
      phone: ['telefono', 'teléfono', 'phone'],
      mobile: ['celular', 'mobile', 'movil', 'móvil'],
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
          return (
            normalizedHeader === normalizedCandidate ||
            normalizedHeader.includes(normalizedCandidate)
          );
        });
      });

      if (match) {
        mapping[field.key] = match;
      }
    }

    return mapping;
  }
}
