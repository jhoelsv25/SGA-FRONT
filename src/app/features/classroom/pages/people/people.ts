import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomApi, type ClassroomStudentRow, type ClassroomTeacherRow } from '../../services/classroom-api';
import { ClassroomPeopleStats } from '../../components/classroom-people-stats/classroom-people-stats';
import { ClassroomPeopleHeader } from '../../components/classroom-people-header/classroom-people-header';
import { ClassroomPeopleFilters } from '../../components/classroom-people-filters/classroom-people-filters';
import { ClassroomPersonCard } from '../../components/classroom-person-card/classroom-person-card';

@Component({
  selector: 'sga-classroom-people',
  standalone: true,
  imports: [
    ClassroomPeopleStats,
    ClassroomPeopleHeader,
    ClassroomPeopleFilters,
    ClassroomPersonCard
  ],
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
    const list = this.teachers();
    if (!term) return list;
    return list.filter((t) =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(term) ||
      (t.email ?? '').toLowerCase().includes(term)
    );
  });

  filteredStudents = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.students();
    if (!term) return list;
    return list.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.code ?? '').toLowerCase().includes(term)
    );
  });

  teachersWithEmailCount = computed(() => this.filteredTeachers().filter(t => !!t.email).length);
  studentsWithCodeCount = computed(() => this.filteredStudents().filter(s => !!s.code).length);

  clearSearch(): void {
    this.search.set('');
  }

  ngOnInit(): void {
    const id = this.store.selectedSectionId() ?? (this.route.parent?.snapshot?.paramMap?.get('id') ?? '');
    if (id) this.loadPeople(id);
  }

  loadPeople(sectionCourseId: string) {
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
