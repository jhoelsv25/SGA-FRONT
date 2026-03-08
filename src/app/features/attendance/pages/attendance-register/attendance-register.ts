import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ListToolbar } from '@shared/ui/list-toolbar';
import { DataSource, SgaTemplate } from '@shared/components/data-source/data-source';
import { Input } from '@shared/ui/input/input';
import { Select, type SelectOption } from '@shared/ui/select/select';
import { Button } from '@shared/directives';
import { Toast } from '@core/services/toast';

import { AttendanceApi } from '../../../academic-setting/attendances/services/attendance-api';
import { AttendanceStore } from '../../../academic-setting/attendances/services/store/attendance.store';
import { AttendanceStatus } from '../../../academic-setting/attendances/types/attendance-types';
import { SectionCourseApi } from '@features/organization/section-courses/services/section-course-api';
import { EnrollmentApi } from '../../../academic-setting/enrollments/services/enrollment-api';
import type { SectionCourse } from '@features/organization/section-courses/types/section-course-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { AttendanceImportDialog } from '../../components/attendance-import-dialog/attendance-import-dialog';
import { Dropdown, DropdownItem } from '@shared/ui/dropdown/dropdown';

type StudentRow = { id: string; name: string; studentCode: string; status: AttendanceStatus };

@Component({
  selector: 'sga-attendance-register',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, ListToolbar, DataSource, SgaTemplate, Input, Select, Button, Dropdown],
  templateUrl: './attendance-register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AttendanceRegisterPage implements OnInit {
  private readonly dialog = inject(Dialog);
  public readonly store = inject(AttendanceStore);
  private readonly attendanceApi = inject(AttendanceApi);
  private readonly sectionCourseApi = inject(SectionCourseApi);
  private readonly enrollmentApi = inject(EnrollmentApi);
  private readonly toast = inject(Toast);

  // Filters
  public selectedSectionCourse = signal<string>('');
  public attendanceDate = signal<string>(new Date().toISOString().split('T')[0]);
  
  // Data
  public sectionCourseOptions = signal<SelectOption[]>([]);
  public students = signal<StudentRow[]>([]);
  
  public columns: DataSourceColumn[] = [
    { key: 'studentCode', label: 'Código', width: '120px' },
    { key: 'name', label: 'Estudiante', sortable: true },
    { key: 'status', label: 'Estado', width: '150px', type: 'custom', customTemplate: 'statusTemplate' },
    { key: 'id', label: 'Marcar Asistencia', width: '200px', type: 'custom', customTemplate: 'actionsTemplate' },
  ];

  public canSave = computed(() => this.selectedSectionCourse() && this.students().length > 0);

  public toolbarActions = computed<DropdownItem[]>(() => [
    {
      label: 'Importar desde Excel',
      icon: 'fas fa-file-excel text-emerald-600',
      action: () => this.openImportWizard(),
    },
    {
      label: 'Guardar Cambios',
      icon: 'fas fa-save text-primary',
      disabled: !this.canSave() || this.store.loading(),
      action: () => this.saveAttendances(),
    }
  ]);

  ngOnInit(): void {
    this.loadSectionCourses();
  }

  private loadSectionCourses() {
    this.sectionCourseApi.getAll().subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        this.sectionCourseOptions.set(
          list.map((sc: SectionCourse) => ({
            value: sc.id,
            label: sc.course?.name && sc.section?.name
              ? `${sc.course.name} - ${sc.section.name}`
              : sc.id.slice(0, 8),
          }))
        );
      },
    });
  }

  onSectionCourseChange(value: unknown): void {
    const id = String(value ?? '');
    this.selectedSectionCourse.set(id);
    if (id) {
       this.loadStudents(id);
    } else {
       this.students.set([]);
    }
  }

  onDateChange(): void {
    const id = this.selectedSectionCourse();
    if (id) this.loadStudents(id);
  }

  private loadStudents(sectionCourseId: string): void {
    this.enrollmentApi.getAll({ sectionCourse: sectionCourseId }).subscribe({
      next: (enrollmentRes) => {
        const rows: StudentRow[] = enrollmentRes.data.map((e) => ({
          id: e.id,
          studentCode: e.student.studentCode,
          name: `${e.student.person?.firstName || ''} ${e.student.person?.lastName || ''}`.trim() || e.student.studentCode,
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
      error: () => this.toast.error('Error al cargar la lista de estudiantes')
    });
  }

  updateStatus(studentId: string, status: AttendanceStatus): void {
    this.students.update(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status } : s))
    );
  }

  saveAttendances() {
    if (!this.selectedSectionCourse()) return;
    
    const request = {
      sectionCourseId: this.selectedSectionCourse(),
      date: this.attendanceDate(),
      sessionType: 'lecture',
      attendances: this.students().map(s => ({
        enrollmentId: s.id,
        status: s.status,
        checkInTime: '08:00:00'
      }))
    };

    this.store.saveBulk(request).subscribe();
  }

  openImportWizard(): void {
    if (!this.selectedSectionCourse()) {
      this.toast.warning('Seleccione un curso antes de importar');
      return;
    }

    this.dialog.open(AttendanceImportDialog, {
      data: {
        onImport: (mappedData: { studentCode: string; status: AttendanceStatus }[]) => {
          this.students.update(prev => {
            const newState = [...prev];
            mappedData.forEach(item => {
              const index = newState.findIndex(s => s.studentCode === item.studentCode);
              if (index !== -1) newState[index] = { ...newState[index], status: item.status };
            });
            return newState;
          });
          this.toast.success('Asistencias cargadas desde el archivo');
        }
      },
      width: '600px',
      panelClass: 'dialog-center',
    });
  }
}
