import { ZardButtonComponent } from '@/shared/components/button';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ChangeDetectionStrategy, Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { Toast } from '@core/services/toast';
import { AttendanceStatus } from '../../../attendances/types/attendance-types';

interface ImportData {
  onImport: (data: { studentCode: string; status: AttendanceStatus }[]) => void;
}

const STEPS = [
  { id: 'upload', label: 'Archivo', icon: 'fa-cloud-upload-alt' },
  { id: 'mapping', label: 'Mapeo', icon: 'fa-columns' },
  { id: 'done', label: 'Listo', icon: 'fa-check-circle' }] as const;


@Component({
  selector: 'sga-attendance-import-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardButtonComponent],
  templateUrl: './attendance-import-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceImportDialog {
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
    { key: 'code', label: 'Código / DNI', required: true, example: '20230001' },
    { key: 'status', label: 'Estado (P, T, F, J)', required: true, example: 'P' },
    { key: 'time', label: 'Hora de Ingreso', required: false, example: '08:15' },
    { key: 'remarks', label: 'Observaciones', required: false, example: 'Justificado médico' }];

  downloadTemplate(): void {
    const data = [
      { 'Código': '20230001', 'Estudiante': 'Juan Perez', 'Asistencia': 'P' },
      { 'Código': '20230002', 'Estudiante': 'Maria Lopez', 'Asistencia': 'T' },
      { 'Código': '20230003', 'Estudiante': 'Pedro Sanchez', 'Asistencia': 'F' },
      { 'Código': '20230004', 'Estudiante': 'Ana Gomez', 'Asistencia': 'J' }];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Asistencia');
    XLSX.writeFile(wb, 'plantilla_asistencia_sisae.xlsx');
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
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    
    headers.forEach(h => {
      const hNorm = norm(h);
      if (['codigo', 'dni', 'code', 'identificacion', 'cod'].includes(hNorm)) map['code'] = h;
      if (['estado', 'status', 'asistencia', 'asist', 'marcar'].includes(hNorm)) map['status'] = h;
      if (['hora', 'ingreso', 'entrada', 'time', 'checkin'].includes(hNorm)) map['time'] = h;
      if (['observaciones', 'notas', 'comentarios', 'remarks', 'obs'].includes(hNorm)) map['remarks'] = h;
    });
    this.mapping.set(map);
  }

  canStartImport = computed(() => !!this.mapping()['code'] && !!this.mapping()['status']);

  startImport(): void {
    if (!this.canStartImport()) return;

    const mappedData = this.jsonRows().map(row => {
      const rawCode = String(row[this.mapping()['code']] || '').trim();
      const rawStatus = String(row[this.mapping()['status']] || '').toLowerCase().trim();
      const rawTime = this.mapping()['time'] ? String(row[this.mapping()['time']] || '').trim() : null;
      const rawRemarks = this.mapping()['remarks'] ? String(row[this.mapping()['remarks']] || '').trim() : null;
      
      let status: AttendanceStatus = 'present';
      if (['f', 'falta', 'absent', 'f'].includes(rawStatus)) status = 'absent';
      else if (['t', 'tardanza', 'late', 't'].includes(rawStatus)) status = 'late';
      else if (['j', 'justificado', 'excused', 'j'].includes(rawStatus)) status = 'excused';
      
      return { 
        studentCode: rawCode, 
        status, 
        checkInTime: rawTime || undefined,
        observations: rawRemarks || undefined 
      };
    }).filter(d => d.studentCode);

    this.data.onImport(mappedData);
    this.step.set('done');
    setTimeout(() => this.ref.close(), 1500);
  }

  close(): void {
    this.ref.close();
  }
}
