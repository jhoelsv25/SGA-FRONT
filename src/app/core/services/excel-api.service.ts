import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ExcelColumn = { key: string; label: string };

export interface ExcelConfig {
  sheetName?: string;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class ExcelApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'excel';

  /** Genera Excel con headers + data. Retorna Blob. */
  generate(
    columns: ExcelColumn[],
    data: Record<string, unknown>[],
    config?: ExcelConfig,
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/generate`,
      { columns, data, ...config },
      {
        responseType: 'blob',
      },
    );
  }

  /** Genera plantilla con headers + fila ejemplo opcional. Retorna Blob. */
  template(
    columns: ExcelColumn[],
    exampleRow?: Record<string, unknown>,
    config?: ExcelConfig,
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/template`,
      { columns, exampleRow, ...config },
      {
        responseType: 'blob',
      },
    );
  }
}
