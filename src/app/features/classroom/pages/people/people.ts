import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi } from '../../services/classroom-api';
import { EnrollmentApi } from '@features/academic-setting/enrollments/services/enrollment-api';

export type TeacherRow = { id: string; firstName: string; lastName: string; email?: string };
export type StudentRow = { id: string; name: string; code: string };

@Component({
  selector: 'sga-classroom-people',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './people.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class People implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClassroomStore);
  private readonly classroomApi = inject(ClassroomApi);
  private readonly enrollmentApi = inject(EnrollmentApi);

  teachers = signal<TeacherRow[]>([]);
  students = signal<StudentRow[]>([]);
  loadingTeachers = signal(true);
  loadingStudents = signal(true);

  ngOnInit(): void {
    const sectionCourseId =
      this.store.selectedSectionId() ??
      (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');
    if (!sectionCourseId) return;

    this.classroomApi.getTeachers(sectionCourseId).subscribe({
      next: (list) => {
        this.teachers.set(list ?? []);
        this.loadingTeachers.set(false);
      },
      error: () => {
        this.teachers.set([]);
        this.loadingTeachers.set(false);
      },
    });

    this.enrollmentApi.getAll({ sectionCourse: sectionCourseId }).subscribe({
      next: (res) => {
        const rows: StudentRow[] = (res.data ?? []).map((e) => ({
          id: e.student.id,
          name: `${e.student.firstName} ${e.student.lastName}`.trim() || e.student.studentCode,
          code: e.student.studentCode ?? '',
        }));
        this.students.set(rows);
        this.loadingStudents.set(false);
      },
      error: () => {
        this.students.set([]);
        this.loadingStudents.set(false);
      },
    });
  }
}
