import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionCourseApi } from '@features/organization/section-courses/services/section-course-api';
import type { SectionCourse } from '@features/organization/section-courses/types/section-course-types';


@Component({
  selector: 'sga-classroom-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ZardCardComponent],
  template: `
    <div class="p-6 md:p-8 max-w-[1920px] mx-auto w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight mb-2">Mis Aulas Virtuales</h1>
        <p class="text-base-content/60">Selecciona el curso o sección para ingresar al entorno virtual.</p>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (item of [1,2,3,4,5,6]; track item) {
            <z-card class="animate-pulse">
              <div class="flex flex-col space-y-1.5 p-6">
                <div class="h-6 bg-base-200 rounded w-2/3 mb-2"></div>
                <div class="h-4 bg-base-200 rounded w-1/3"></div>
              </div>
              <div class="p-6 pt-0">
                <div class="h-20 bg-base-200 rounded mb-4"></div>
              </div>
              <div class="flex items-center p-6 pt-0">
                <div class="h-10 bg-base-200 rounded w-full"></div>
              </div>
            </z-card>
          }
        </div>
      } @else if (courses().length === 0) {
        <div class="flex flex-col items-center justify-center p-12 text-center border border-dashed border-base-300 rounded-xl bg-base-100/50">
          <div class="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4">
            <i class="fa-solid fa-chalkboard-user text-2xl text-base-content/40"></i>
          </div>
          <h3 class="text-xl font-semibold mb-2">No hay aulas disponibles</h3>
          <p class="text-base-content/60 max-w-sm">No te encuentras asignado ni matriculado a ninguna sección o curso en este momento.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (course of courses(); track course.id) {
            <z-card class="group hover:border-primary/50 transition-colors flex flex-col h-full bg-base-100/50 backdrop-blur-sm relative overflow-hidden">
              <div class="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="flex flex-col space-y-1.5 p-6 relative z-10 pb-4">
                <h2 class="text-2xl font-semibold leading-none tracking-tight line-clamp-2 leading-tight text-xl mb-1">
                  {{ course.course?.name || 'Curso (' + course.id.slice(0,6) + ')' }}
                </h2>
                <div class="text-sm text-base-content/60 flex items-center gap-2 font-medium">
                  <span class="px-2 py-0.5 bg-primary/10 text-primary uppercase tracking-wider text-[10px] rounded-sm font-bold">
                    {{ course.section?.name || 'Sección' }}
                  </span>
                  @if ($any(course).academicYear?.year) {
                    <span class="text-xs">{{ $any(course).academicYear?.year }}</span>
                  }
                </div>
              </div>

              <div class="p-6 pt-0 relative z-10 flex-1">
                <div class="flex flex-col gap-3 text-sm text-base-content/70">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-users w-4 text-center text-base-content/40"></i>
                    <span>{{ $any(course).enrolledStudents || 0 }} / {{ $any(course).maxStudents || 30 }} Estudiantes</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-chalkboard w-4 text-center text-base-content/40"></i>
                    <span class="capitalize">{{ $any(course).modality || 'Presencial' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center p-6 pt-4 relative z-10 border-t border-base-200/50">
                <a [routerLink]="['/virtual-classroom', course.id]" class="w-full text-center inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2 text-sm gap-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md">
                  Ingresar al Aula <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>
                </a>
              </div>
            </z-card>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassroomList implements OnInit {
  private readonly sectionCourseApi = inject(SectionCourseApi);

  public courses = signal<SectionCourse[]>([]);
  public loading = signal(true);

  ngOnInit(): void {
    // In a real application, this would filter by the current user's enrolled/teaching courses.
    // For now, we load all section-courses from the API for the demo.
    this.sectionCourseApi.getAll().subscribe({
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
