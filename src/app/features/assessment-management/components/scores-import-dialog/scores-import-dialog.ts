import { ZardButtonComponent } from '@/shared/components/button';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Toast } from '@core/services/toast';

interface ImportData {
  onImport: (data: { studentCode: string; score: number; observation?: string }[]) => void;
  maxScore: number;
  studentsInCourse: string[];
}

const STEPS = [
  { id: 'upload', label: 'Archivo', icon: 'fa-cloud-upload-alt' },
  { id: 'mapping', label: 'Mapeo', icon: 'fa-columns' },
  { id: 'done', label: 'Listo', icon: 'fa-check-circle' },
] as const;

@Component({
  selector: 'sga-scores-import-dialog',
  imports: [CommonModule, FormsModule, ZardButtonComponent],
  templateUrl: './scores-import-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoresImportDialog {
  private readonly ref = inject(ZardDialogRef);
  private readonly data = inject<ImportData>(Z_MODAL_DATA);
  private readonly toast = inject(Toast);

  steps = STEPS;
  step = signal<'upload' | 'mapping' | 'done'>('upload');
  file = signal<File | null>(null);
  headers = signal<string[]>([]);
  jsonRows = signal<Record<string, unknown>[]>([]);
  mapping = signal<Record<string, string>>({});

  fieldOptions = [
    {
      key: 'code',
      label: 'Código Estudiante',
      required: true,
      description: 'Código único o DNI del alumno.',
    },
    {
      key: 'score',
      label: 'Calificación / Nota',
      required: true,
      description: 'Puntaje obtenido (0 a ' + this.data.maxScore + ').',
    },
    {
      key: 'observation',
      label: 'Observación',
      required: false,
      description: 'Comentario opcional.',
    },
  ];

  downloadTemplate(): void {
    const data = [
      { Código: '20230001', Estudiante: 'Juan Perez', Nota: 15, Observación: 'Buen trabajo' },
      { Código: '20230002', Estudiante: 'Maria Lopez', Nota: 18, Observación: '' },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Notas');
    XLSX.writeFile(wb, 'plantilla_notas_sisae.xlsx');
    this.toast.info('Plantilla descargada correctamente');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.processFile(f);
  }

  private processFile(f: File): void {
    this.file.set(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const headers = this.getHeaders(worksheet);
      this.headers.set(headers);
      this.jsonRows.set(XLSX.utils.sheet_to_json(worksheet));
      this.autoMap(headers);
      this.step.set('mapping');
    };
    reader.readAsArrayBuffer(f);
  }

  private getHeaders(sheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const headers: string[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (cell && cell.t) headers.push(String(cell.v).trim());
    }
    return headers;
  }

  private autoMap(headers: string[]): void {
    const map: Record<string, string> = {};
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

    headers.forEach((h) => {
      const hNorm = norm(h);
      if (['codigo', 'dni', 'code', 'identificacion', 'cod'].includes(hNorm)) map['code'] = h;
      if (['nota', 'calificacion', 'score', 'puntos', 'puntaje', 'grade'].includes(hNorm))
        map['score'] = h;
      if (['observacion', 'comentario', 'nota_adicional', 'remarks', 'obs'].includes(hNorm))
        map['observation'] = h;
    });
    this.mapping.set(map);
  }

  canStartImport = computed(() => !!this.mapping()['code'] && !!this.mapping()['score']);

  startImport(): void {
    if (!this.canStartImport()) return;

    const mappedData = this.jsonRows()
      .map((row) => {
        const rawCode = String(row[this.mapping()['code']] || '').trim();
        const rawScore = Number(row[this.mapping()['score']]);
        const rawObs = this.mapping()['observation']
          ? String(row[this.mapping()['observation']] || '').trim()
          : undefined;

        return { studentCode: rawCode, score: rawScore, observation: rawObs };
      })
      .filter((d) => d.studentCode && !isNaN(d.score));

    // Optional: Filter only valid students for this course
    const validData = mappedData.filter((d) => this.data.studentsInCourse.includes(d.studentCode));

    if (validData.length === 0) {
      this.toast.warning('No se encontraron alumnos válidos en el archivo');
      return;
    }

    this.data.onImport(validData);
    this.step.set('done');
    setTimeout(() => this.ref.close(true), 1500);
  }

  close(): void {
    this.ref.close();
  }
}
