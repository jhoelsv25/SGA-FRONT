import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ClassroomCourseCardComponent } from '../../components/classroom-course-card/classroom-course-card';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig } from '@core/types/action-types';
import { VirtualClassroomApi } from '../../services/virtual-classroom-api';
import type { VirtualClassroomItem } from '../../types/virtual-classroom-types';
import { AuthStore } from '@auth/services/store/auth.store';


@Component({
  selector: 'sga-classroom-list',
  standalone: true,
  imports: [CommonModule, HeaderDetail, ZardInputDirective, ZardEmptyComponent, ZardSkeletonComponent, ClassroomCourseCardComponent],
  template: `
    <div class="mx-auto w-full max-w-7xl space-y-6 p-6">
      <sga-header-detail
        [config]="headerConfig()"
        [actions]="headerActions()"
        (action)="onHeaderAction($event)"
      />

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-4xl border border-base-200 bg-card p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Aulas</p>
          <p class="mt-3 text-3xl font-black tracking-tight">{{ filteredCourses().length }}</p>
          <p class="mt-1 text-sm text-base-content/55">Entornos disponibles</p>
        </article>
        <article class="rounded-4xl border border-base-200 bg-card p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Docentes</p>
          <p class="mt-3 text-3xl font-black tracking-tight">{{ teacherCount() }}</p>
          <p class="mt-1 text-sm text-base-content/55">Aulas con responsable</p>
        </article>
        <article class="rounded-4xl border border-base-200 bg-card p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Estudiantes</p>
          <p class="mt-3 text-3xl font-black tracking-tight">{{ enrolledCount() }}</p>
          <p class="mt-1 text-sm text-base-content/55">Inscritos acumulados</p>
        </article>
        <article class="rounded-4xl border border-base-200 bg-card p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Activas</p>
          <p class="mt-3 text-3xl font-black tracking-tight">{{ activeCount() }}</p>
          <p class="mt-1 text-sm text-base-content/55">Con estado operativo</p>
        </article>
      </section>

      <section class="rounded-4xl border border-base-200 bg-card p-5">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Buscar</label>
            <input
              z-input
              type="text"
              [value]="search()"
              placeholder="Buscar por curso, sección o docente..."
              (input)="search.set(($any($event.target).value ?? '').toString())"
            />
          </div>
          <div class="flex items-center gap-3 lg:justify-end">
            <button z-button zType="outline" class="rounded-4xl" [disabled]="!search().trim()" (click)="search.set('')">
              Limpiar
            </button>
          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <z-skeleton [class]="'h-[250px] w-full rounded-4xl border border-base-200'"></z-skeleton>
          }
        </div>
      } @else if (filteredCourses().length === 0) {
        <div class="rounded-[var(--radius-xl)] border border-dashed border-base-300 bg-background/60 p-8">
          <z-empty
            zIcon="chalkboard-teacher"
            zTitle="Sin aulas disponibles"
            zDescription="No se encontraron aulas virtuales para el criterio actual."
          ></z-empty>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (course of filteredCourses(); track course.id) {
            <sga-classroom-course-card [classroom]="course" />
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassroomList implements OnInit {
  private readonly virtualClassroomApi = inject(VirtualClassroomApi);
  private readonly authStore = inject(AuthStore);
  readonly search = signal('');
  readonly headerConfig = signal<HeaderConfig>({
    title: 'Aulas Virtuales',
    subtitle: 'Acceso a cursos, secciones y entornos académicos en línea',
    showActions: true,
    showFilters: false,
  });
  readonly headerActions = signal<ActionConfig[]>([
    { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
  ]);

  public courses = signal<VirtualClassroomItem[]>([]);
  public loading = signal(true);
  readonly filteredCourses = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.courses();
    return this.courses().filter((course) => {
      const teacher = [
        course.sectionCourse?.teacher?.person?.firstName,
        course.sectionCourse?.teacher?.person?.lastName,
      ].filter(Boolean).join(' ').toLowerCase();
      const courseName = course.sectionCourse?.course?.name?.toLowerCase() ?? '';
      const sectionName = course.sectionCourse?.section?.name?.toLowerCase() ?? '';
      return courseName.includes(term) || sectionName.includes(term) || teacher.includes(term);
    });
  });
  readonly teacherCount = computed(() => this.filteredCourses().filter((course) => !!course.sectionCourse?.teacher?.id).length);
  readonly enrolledCount = computed(() => this.filteredCourses().reduce((sum, course) => sum + (course.sectionCourse?.enrolledStudents || 0), 0));
  readonly activeCount = computed(() => this.filteredCourses().filter((course) => (course.status || '').toLowerCase() !== 'inactive').length);

  onHeaderAction(event: { action: { key: string } }): void {
    if (event.action.key === 'refresh') {
      this.loadCourses();
    }
  }

  ngOnInit(): void {
    this.syncHeaderByRole();
    this.loadCourses();
  }

  private syncHeaderByRole(): void {
    const roleType = this.authStore.currentUser()?.profile?.type ?? 'user';
    const subtitle =
      roleType === 'teacher'
        ? 'Tus aulas asignadas como docente'
        : roleType === 'student'
          ? 'Tus aulas virtuales según matrícula activa'
          : roleType === 'guardian'
            ? 'Aulas virtuales vinculadas a tus estudiantes'
            : 'Acceso a cursos, secciones y entornos académicos en línea';

    this.headerConfig.update((config) => ({
      ...config,
      subtitle,
    }));
  }

  private loadCourses(): void {
    this.loading.set(true);
    this.virtualClassroomApi.getAll({ page: 1, size: 100 }).subscribe({
      next: (res) => {
        this.courses.set(res?.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.courses.set([]);
        this.loading.set(false);
      }
    });
  }
}
