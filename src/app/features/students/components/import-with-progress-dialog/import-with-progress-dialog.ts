import { ZardButtonComponent } from '@/shared/components/button';
import { ZardDialogRef } from '@shared/components/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentApi } from '../../services/api/student-api';
import { StudentsImportSocketService } from '../../services/students-import.socket';
import { ExcelService } from '@core/services/excel.service';
import { Subscription } from 'rxjs';
import { ImportStepIndicator } from './import-step-indicator/import-step-indicator';
import { ImportStepUpload } from './import-step-upload/import-step-upload';
import { ImportStepMapping } from './import-step-mapping/import-step-mapping';
import { ImportStepImporting } from './import-step-importing/import-step-importing';
import { ImportStepDone } from './import-step-done/import-step-done';

const FIELD_OPTIONS = [
  { key: 'name', label: 'Nombre', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'age', label: 'Edad', required: false },
  { key: 'grade', label: 'Grado', required: false },
] as const;

@Component({
  selector: 'sga-import-with-progress-dialog',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ImportStepIndicator,
    ImportStepUpload,
    ImportStepMapping,
    ImportStepImporting,
    ImportStepDone,
  ],
  templateUrl: './import-with-progress-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportWithProgressDialog implements OnDestroy {
  private readonly ref = inject(ZardDialogRef);
  private readonly studentApi = inject(StudentApi);
  private readonly socketService = inject(StudentsImportSocketService);
  private readonly excel = inject(ExcelService);
  private progressSub?: Subscription;
  private completeSub?: Subscription;

  fieldOptions = FIELD_OPTIONS;
  step = signal<'upload' | 'mapping' | 'importing' | 'done'>('upload');
  file = signal<File | null>(null);
  uploadId = signal<string | null>(null);
  headers = signal<string[]>([]);
  rowCount = signal(0);
  columnMapping = signal<Record<string, string>>({});
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  progress = signal<{
    processed: number;
    total: number;
    percentage: number;
    created: number;
  } | null>(null);
  result = signal<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  isDragging = signal(false);

  private readonly ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
    this.completeSub?.unsubscribe();
    this.socketService.disconnect();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.processFile(f);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const f = event.dataTransfer?.files?.[0];
    if (!f) return;
    this.processFile(f);
  }

  private processFile(f: File): void {
    const ext = '.' + (f.name.split('.').pop()?.toLowerCase() ?? '');
    if (!this.ACCEPTED_EXTENSIONS.includes(ext)) {
      this.errorMessage.set('Formato no válido. Use .xlsx, .xls o .csv');
      return;
    }
    this.file.set(f);
    this.errorMessage.set(null);
    this.loading.set(true);
    this.studentApi.uploadImportFile(f).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.uploadId.set(res.uploadId);
        this.headers.set(res.headers);
        this.rowCount.set(res.rowCount);
        this.columnMapping.set(this.autoMap(res.headers));
        this.step.set('mapping');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Error al subir el archivo');
      },
    });
  }

  private autoMap(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const norm = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '') || '';
    for (const opt of FIELD_OPTIONS) {
      const optNorm = norm(opt.label);
      const match = headers.find((h) => norm(h) === optNorm || norm(h).includes(optNorm));
      if (match) mapping[opt.key] = match;
    }
    return mapping;
  }

  setMapping(field: string, header: string): void {
    const current = { ...this.columnMapping() };
    if (header === '') {
      delete current[field];
    } else {
      current[field] = header;
    }
    this.columnMapping.set(current);
  }

  onMappingChange(event: { field: string; header: string }): void {
    this.setMapping(event.field, event.header);
  }

  getMapping(field: string): string {
    return this.columnMapping()[field] ?? '';
  }

  downloadTemplate(): void {
    const columns = FIELD_OPTIONS.map((o) => ({ key: o.key, label: o.label }));
    this.excel.downloadTemplate(
      columns,
      { name: 'Ejemplo Estudiante', email: 'estudiante@ejemplo.com', age: 15, grade: '1ro' },
      { sheetName: 'Estudiantes', fileName: 'plantilla_estudiantes.xlsx' },
    );
  }

  canStartImport(): boolean {
    const m = this.columnMapping();
    return !!m['name'] && !!m['email'];
  }

  startImport(): void {
    const uploadId = this.uploadId();
    const mapping = this.columnMapping();
    if (!uploadId || !this.canStartImport()) return;
    this.errorMessage.set(null);
    this.step.set('importing');
    this.progress.set({ processed: 0, total: this.rowCount(), percentage: 0, created: 0 });
    this.socketService.connect();
    this.progressSub = this.socketService.progress$.subscribe((p) =>
      this.progress.set({
        processed: p.processed,
        total: p.total,
        percentage: p.percentage,
        created: p.created,
      }),
    );
    this.completeSub = this.socketService.complete$.subscribe((p) => {
      this.result.set({ created: p.created, errors: p.errors });
      this.step.set('done');
      this.socketService.disconnect();
      this.completeSub?.unsubscribe();
      this.progressSub?.unsubscribe();
      // Auto-cerrar y refrescar lista tras 1.5 segundos
      setTimeout(() => this.close(), 1500);
    });
    this.studentApi.startImport(uploadId, mapping).subscribe({
      next: () => {},
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'Error al iniciar importación',
        );
        this.step.set('mapping');
        this.socketService.disconnect();
      },
    });
  }

  close(): void {
    this.ref.close(this.result());
  }
}
