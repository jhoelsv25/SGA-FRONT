import { inject, Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Observable } from 'rxjs';
import { ExcelApi, type ExcelColumn, type ExcelConfig } from './excel-api.service';

export type { ExcelColumn, ExcelConfig };

/**
 * Servicio global y reutilizable para Excel.
 * - Generación y plantillas: vía backend (headers + data + config)
 * - Parse: local (para ImportDialog con flujo JSON)
 * - download: utilidad para disparar descarga
 */
@Injectable({ providedIn: 'root' })
export class ExcelService {
  private readonly excelApi = inject(ExcelApi);

  /**
   * Genera Excel con headers + data. Llama al backend.
   */
  generate(
    columns: ExcelColumn[],
    data: Record<string, unknown>[],
    config?: ExcelConfig & { sheetName?: string },
  ): Observable<Blob> {
    return this.excelApi.generate(columns, data, {
      sheetName: config?.sheetName ?? 'Datos',
      fileName: config?.fileName,
    });
  }

  /**
   * Genera plantilla con headers + fila ejemplo opcional. Llama al backend.
   */
  generateTemplate(
    columns: ExcelColumn[],
    exampleRow?: Record<string, unknown>,
    config?: ExcelConfig & { sheetName?: string },
  ): Observable<Blob> {
    return this.excelApi.template(columns, exampleRow, {
      sheetName: config?.sheetName ?? 'Plantilla',
      fileName: config?.fileName,
    });
  }

  /**
   * Descarga plantilla (genera en backend + dispara descarga).
   */
  downloadTemplate(
    columns: ExcelColumn[],
    exampleRow?: Record<string, unknown>,
    config?: ExcelConfig & { sheetName?: string },
  ): void {
    this.generateTemplate(columns, exampleRow, config).subscribe((blob) =>
      this.download(blob, config?.fileName ?? 'plantilla.xlsx'),
    );
  }

  /**
   * Descarga export (genera en backend + dispara descarga).
   */
  downloadExport(
    columns: ExcelColumn[],
    data: Record<string, unknown>[],
    config?: ExcelConfig & { sheetName?: string },
  ): void {
    this.generate(columns, data, config).subscribe((blob) =>
      this.download(blob, config?.fileName ?? `export_${Date.now()}.xlsx`),
    );
  }

  /**
   * Parsea un archivo Excel. Primera fila = cabeceras.
   * Si pasas columns, las cabeceras se mapean a column.key (por label normalizado).
   */
  async parse(file: File, columns?: ExcelColumn[]): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No se pudo leer el archivo'));
            return;
          }
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];
          if (raw.length < 2) {
            resolve([]);
            return;
          }
          const headerRow = raw[0].map((h) => String(h ?? '').trim());
          const normalizedHeaders = headerRow.map((h) => this.normalizeHeader(h));
          const keys = columns
            ? headerRow.map((_, j) => {
                const norm = normalizedHeaders[j];
                const col = columns.find((c) => this.normalizeHeader(c.label) === norm);
                return col?.key ?? norm;
              })
            : normalizedHeaders;
          const rows: Record<string, unknown>[] = [];
          for (let i = 1; i < raw.length; i++) {
            const row = raw[i] as unknown[];
            const obj: Record<string, unknown> = {};
            keys.forEach((k, j) => {
              const val = row[j];
              if (typeof val === 'number' && Number.isFinite(val)) {
                obj[k] = val;
              } else {
                obj[k] = val != null ? String(val).trim() : '';
              }
            });
            if (Object.values(obj).some((v) => v !== '' && v != null)) {
              rows.push(obj);
            }
          }
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Descarga un Blob como archivo con el nombre indicado.
   */
  download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private normalizeHeader(h: string): string {
    return h
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '') || 'col';
  }
}
