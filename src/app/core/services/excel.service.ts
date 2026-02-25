import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export type ExcelColumn = { key: string; label: string };

/**
 * Servicio compartido para generar y leer Excel.
 * En backend se puede tener un equivalente (excel.service) que reciba headers, columns y data
 * y devuelva el archivo para descarga; para importar, el front envía JSON (rows) o el backend
 * recibe el archivo y lo parsea.
 */
@Injectable({ providedIn: 'root' })
export class ExcelService {
  /**
   * Genera un archivo Excel a partir de columnas y datos.
   * @param columns [{ key, label }] para cabecera y claves de cada fila
   * @param data Array de objetos con las mismas keys que columns[].key
   * @param sheetName Nombre de la hoja
   */
  generate(columns: ExcelColumn[], data: Record<string, unknown>[], sheetName = 'Datos'): Blob {
    const headers = columns.map((c) => c.label);
    const keys = columns.map((c) => c.key);
    const rows = data.map((row) => keys.map((k) => row[k] ?? ''));
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Genera una plantilla Excel solo con la fila de cabecera (y opcionalmente una fila de ejemplo).
   */
  generateTemplate(columns: ExcelColumn[], exampleRow?: Record<string, unknown>, sheetName = 'Plantilla'): Blob {
    const headers = columns.map((c) => c.label);
    const keys = columns.map((c) => c.key);
    const aoa = [headers];
    if (exampleRow) {
      aoa.push(keys.map((k) => exampleRow[k] ?? ''));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
          const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { header: 1 }) as unknown[][];
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
