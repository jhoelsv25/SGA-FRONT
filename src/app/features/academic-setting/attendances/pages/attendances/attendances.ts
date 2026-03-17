import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf, NgFor, NgSwitch } from '@angular/common';
import { Component, OnInit, inject, signal, input, ChangeDetectionStrategy } from '@angular/core';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardInputDirective } from '@/shared/components/input';
import { AttendanceApi } from '../../services/attendance-api';
import { AttendanceStore } from '../../services/store/attendance.store';
import { AttendanceStatus } from '../../types/attendance-types';
import { SectionCourseApi } from '@features/organization/section-courses/services/section-course-api';
import type { SectionCourse } from '@features/organization/section-courses/types/section-course-types';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';

type StudentRow = { id: string; name: string; studentCode: string; status: AttendanceStatus };


@Component({
  selector: 'sga-attendances',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, ZardInputDirective, SelectOptionComponent],
  templateUrl: './attendances.html',
  styleUrl: './attendances.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Attendances implements OnInit {
  public readonly store = inject(AttendanceStore);
  private readonly attendanceApi = inject(AttendanceApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly enrollmentApi = inject(EnrollmentApi);

  public selectedSectionCourse = signal<string>('');
  public attendanceDate = signal<string>(new Date().toISOString().split('T')[0]);
  public sectionCourseOptions = signal<SelectOption[]>([]);
  public students = signal<StudentRow[]>([]);

  ngOnInit(): void {
    this.sectionCourseApi.getAll().subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        this.sectionCourseOptions.set([
          { value: '', label: 'Seleccione...' },
          ...list.map((sc: SectionCourse) => ({
            value: sc.id,
            label: sc.course?.name && sc.section?.name
              ? `${sc.course.name} - ${sc.section.name}`
              : String(sc.id).slice(0, 12) + '...',
          }))]);
      },
    });
  }

  saveAttendances() {
    const request = {
      sectionCourseId: this.selectedSectionCourse(),
      date: this.attendanceDate(),
      sessionType: 'lecture',
      attendances: this.students().map(s => ({
        enrollmentId: s.id,
        status: s.status as AttendanceStatus,
        checkInTime: '08:00:00'
      }))
    };

    this.store.saveBulk(request).subscribe();
  }

  onSectionCourseChange(value: unknown): void {
    const id = value === null || value === undefined ? '' : String(value);
    this.selectedSectionCourse.set(id);
    if (id) {
      this.loadStudents(id);
    } else {
      this.students.set([]);
    }
  }

  onDateChange(): void {
    const sectionId = this.selectedSectionCourse();
    if (sectionId) {
      this.loadStudents(sectionId);
    }
  }

  private loadStudents(sectionCourseId: string): void {
    this.enrollmentApi.getAll({ sectionCourse: sectionCourseId }).subscribe({
      next: (enrollmentRes) => {
        const rows: StudentRow[] = enrollmentRes.data.map((e) => ({
          id: e.id,
          studentCode: e.student.studentCode,
          name: `${e.student.firstName} ${e.student.lastName}`,
          status: 'present' as AttendanceStatus,
        }));
        this.students.set(rows);
        this.attendanceApi.getBySectionCourse(sectionCourseId, this.attendanceDate()).subscribe({
          next: (attendanceRes) => {
            if (attendanceRes.data.length > 0) {
              this.students.update((prev) =>
                prev.map((s) => {
                  const att = attendanceRes.data.find((a) => a.enrollmentId === s.id);
                  return att ? { ...s, status: att.status } : s;
                })
              );
            }
          },
        });
      },
    });
  }

  updateStatus(studentId: string, status: string): void {
    this.students.update(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status: status as AttendanceStatus } : s))
    );
  }

  onFileUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const target = e.target;
      if (!target?.result) return;
      const data = new Uint8Array(target.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      this.students.update(prev => {
        const newState = [...prev];
        json.forEach(row => {
          const code = String(row['DNI'] || row['Matricula_ID'] || row['studentCode'] || row['Codigo'] || '').trim();
          const rawStatus = String(row['Estado'] || row['status'] || '').toLowerCase().trim();
          if (code && rawStatus) {
            let status: AttendanceStatus = 'present';
            if (['f', 'falta', 'absent'].includes(rawStatus)) status = 'absent';
            else if (['t', 'tardanza', 'late'].includes(rawStatus)) status = 'late';
            else if (['j', 'justificado', 'excused'].includes(rawStatus)) status = 'excused';

            const index = newState.findIndex(s => s.studentCode === code);
            if (index !== -1) {
              newState[index] = { ...newState[index], status };
            }
          }
        });
        return newState;
      });
      if (event.target) (event.target as HTMLInputElement).value = ''; // reset
    };
    reader.readAsArrayBuffer(file);
  }
}
