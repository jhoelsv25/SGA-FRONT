import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Input } from '@shared/ui/input/input';
import { Select } from '@shared/ui/select/select';
import type { SelectOption } from '@shared/ui/select/select';
import { AttendanceApi } from '../../services/attendance-api';
import { AttendanceStore } from '../../services/store/attendance.store';
import { AttendanceStatus } from '../../types/attendance-types';
import { SectionCourseApi } from '../../../section-courses/services/section-course-api';
import { EnrollmentApi } from '../../../enrollments/services/enrollment-api';

type StudentRow = { id: string; name: string; status: AttendanceStatus };

@Component({
  selector: 'sga-attendances',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, Input, Select],
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
      next: (list) => {
        this.sectionCourseOptions.set([
          { value: '', label: 'Seleccione...' },
          ...list.map((sc) => ({
            value: sc.id,
            label: sc.course?.name && sc.section?.name
              ? `${sc.course.name} - ${sc.section.name}`
              : String(sc.id).slice(0, 12) + '...',
          })),
        ]);
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
}
