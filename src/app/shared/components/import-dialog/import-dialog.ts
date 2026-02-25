import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';
import { ExcelService, type ExcelColumn } from '@core/services/excel.service';

export interface ImportDialogData {
  title: string;
  columns: ExcelColumn[];
  exampleRow?: Record<string, unknown>;
  templateSheetName?: string;
  /** Valida una fila; devuelve mensaje de error o null si es válida. */
  validateRow?: (row: Record<string, unknown>, index: number) => string | null;
  /** Llama al backend para importar; devuelve created y opcionalmente errors. */
  importRows: (rows: Record<string, unknown>[]) => import('rxjs').Observable<{ created: number; errors?: { row: number; message: string }[] }>;
}

@Component({
  selector: 'sga-import-dialog',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './import-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDialog {
  private readonly data = inject(DIALOG_DATA) as ImportDialogData;
  private readonly ref = inject(DialogRef);
  private readonly excel = inject(ExcelService);

  title = this.data.title;
  columns = this.data.columns;
  exampleRow = this.data.exampleRow;
  templateSheetName = this.data.templateSheetName ?? 'Plantilla';
  validateRow = this.data.validateRow;
  importRows = this.data.importRows;

  file = signal<File | null>(null);
  parsed = signal<Record<string, unknown>[]>([]);
  validationErrors = signal<Map<number, string>>(new Map());
  loading = signal(false);
  result = signal<{ created: number; errors?: { row: number; message: string }[] } | null>(null);
  errorMessage = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.file.set(f);
    this.errorMessage.set(null);
    this.result.set(null);
    this.excel.parse(f, this.columns).then(
      (rows) => {
        this.parsed.set(rows);
        const errors = new Map<number, string>();
        if (this.validateRow) {
          rows.forEach((row, i) => {
            const err = this.validateRow!(row, i);
            if (err) errors.set(i, err);
          });
        }
        this.validationErrors.set(errors);
      },
      (err) => this.errorMessage.set(err?.message ?? 'Error al leer el archivo'),
    );
  }

  downloadTemplate(): void {
    const blob = this.excel.generateTemplate(
      this.columns,
      this.exampleRow,
      this.templateSheetName,
    );
    this.excel.download(blob, `plantilla_importacion.xlsx`);
  }

  hasValidationErrors(): boolean {
    return this.validationErrors().size > 0;
  }

  getError(rowIndex: number): string | null {
    return this.validationErrors().get(rowIndex) ?? null;
  }

  confirm(): void {
    const rows = this.parsed();
    if (rows.length === 0) {
      this.errorMessage.set('No hay filas para importar.');
      return;
    }
    if (this.hasValidationErrors()) {
      this.errorMessage.set('Corrija los errores de validación antes de importar.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.importRows(rows).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.result.set(res);
        if (res.created > 0 && (!res.errors || res.errors.length === 0)) {
          setTimeout(() => this.ref.close(res), 1500);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Error al importar');
      },
    });
  }

  close(): void {
    this.ref.close(this.result());
  }
}
