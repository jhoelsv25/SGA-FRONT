import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { StudentStore } from '@features/students/services/store/student.store';
import { TeacherStore } from '@features/teachers/services/store/teacher.store';
import { Card } from '@shared/ui/card/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'sga-home',
  imports: [Card, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home implements OnInit {
  private authFacade = inject(AuthFacade);
  private studentStore = inject(StudentStore);
  private teacherStore = inject(TeacherStore);

  currentUser = computed(() => this.authFacade.getCurrentUser());
  studentCount = computed(() => this.studentStore.students().length);
  teacherCount = computed(() => this.teacherStore.teachers().length);
  studentLoading = computed(() => this.studentStore.loading());
  teacherLoading = computed(() => this.teacherStore.loading());

  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  });

  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return (user as Record<string, unknown>)['firstName']
      ? `${(user as Record<string, unknown>)['firstName']}`
      : `${(user as Record<string, unknown>)['username'] ?? ''}`;
  });

  quickLinks = signal([
    { label: 'Estudiantes', icon: 'fas fa-user-graduate', route: '/students/list', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' },
    { label: 'Docentes', icon: 'fas fa-chalkboard-teacher', route: '/teachers/list', color: 'bg-info-100 text-info-700 dark:bg-info-900 dark:text-info-300' },
    { label: 'Pagos', icon: 'fas fa-money-bill-wave', route: '/payments', color: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' },
    { label: 'Asistencia', icon: 'fas fa-clipboard-check', route: '/attendance', color: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300' },
    { label: 'Conducta', icon: 'fas fa-exclamation-triangle', route: '/behavior', color: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300' },
    { label: 'Comunicaciones', icon: 'fas fa-envelope', route: '/communications', color: 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300' },
    { label: 'Reportes', icon: 'fas fa-chart-bar', route: '/reports', color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
    { label: 'Configuración', icon: 'fas fa-cog', route: '/academic-setup', color: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-400 dark:text-secondary-100' },
  ]);

  ngOnInit() {
    this.studentStore.loadAll({});
    this.teacherStore.loadAll({});
  }
}
