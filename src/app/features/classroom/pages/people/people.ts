import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomStudentRow, type ClassroomTeacherRow } from '../../services/classroom-api';


@Component({
  selector: 'sga-classroom-people',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './people.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class People implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClassroomStore);
  private readonly classroomApi = inject(ClassroomApi);
  private readonly authFacade = inject(AuthFacade);

  teachers = signal<ClassroomTeacherRow[]>([]);
  students = signal<ClassroomStudentRow[]>([]);
  loadingTeachers = signal(true);
  loadingStudents = signal(true);
  profileType = signal(this.authFacade.getCurrentUser()?.profile?.type ?? 'user');
  search = signal('');
  filteredTeachers = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.teachers();
    return this.teachers().filter((teacher) =>
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(term) ||
      (teacher.email ?? '').toLowerCase().includes(term)
    );
  });
  filteredStudents = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.students();
    return this.students().filter((student) =>
      student.name.toLowerCase().includes(term) ||
      (student.code ?? '').toLowerCase().includes(term)
    );
  });

  clearSearch(): void {
    this.search.set('');
  }

  ngOnInit(): void {
    const sectionCourseId =
      this.store.selectedSectionId() ??
      (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');
    if (!sectionCourseId) return;

    this.classroomApi.getPeople(sectionCourseId).subscribe({
      next: (response) => {
        this.teachers.set(response?.teachers ?? []);
        this.students.set(response?.students ?? []);
        this.loadingTeachers.set(false);
        this.loadingStudents.set(false);
      },
      error: () => {
        this.teachers.set([]);
        this.students.set([]);
        this.loadingTeachers.set(false);
        this.loadingStudents.set(false);
      },
    });
  }
}
