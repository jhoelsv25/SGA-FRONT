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
    <div class="px-6 py-12 md:px-12 max-w-[1920px] mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <h1 class="text-4xl font-black tracking-tighter text-base-content">Mis Aulas Virtuales</h1>
            </div>
            <p class="text-base-content/40 font-bold uppercase tracking-[0.2em] text-[10px]">Portal de aprendizaje académico en línea</p>
        </div>
        
        <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-base-100 border border-base-200 text-xs font-black uppercase tracking-widest text-base-content/40">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Total: {{ courses().length }} Aulas
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          @for (item of [1,2,3,4,5,6,7,8]; track item) {
            <div class="h-[300px] bg-base-100/50 rounded-[2.5rem] animate-pulse"></div>
          }
        </div>
      } @else if (courses().length === 0) {
        <div class="flex flex-col items-center justify-center py-32 text-center card-premium bg-base-100/30 border-dashed border-base-300">
          <div class="w-24 h-24 bg-base-200/50 rounded-[2.5rem] flex items-center justify-center mb-8 text-base-content/10">
            <i class="fa-solid fa-school-circle-exclamation text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-base-content/60 tracking-tight">No hay aulas asignadas</h3>
          <p class="text-sm text-base-content/40 font-medium max-w-sm mt-2">Parece que aún no tienes cursos vinculados a tu cuenta para el periodo actual.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          @for (course of courses(); track course.id) {
            <div class="group card-premium bg-white dark:bg-zinc-900 border-base-200/50 dark:border-zinc-800 transition-all duration-500 flex flex-col h-full hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden">
              <!-- Visual Header -->
              <div class="h-32 bg-gradient-to-br from-primary/10 via-indigo-500/5 to-transparent relative group-hover:from-primary/20 transition-colors">
                <div class="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 text-[10px] font-black uppercase tracking-widest text-primary">
                    {{ course.section?.name || 'Clase' }}
                </div>
                <div class="absolute -bottom-6 left-8 w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 text-xl font-black transform group-hover:rotate-12 transition-transform">
                    {{ course.course?.name?.[0] || 'C' }}
                </div>
              </div>

              <div class="px-8 pt-10 pb-8 flex-1 flex flex-col">
                <div class="flex-1 space-y-4">
                    <h2 class="text-xl font-black text-base-content leading-tight tracking-tight line-clamp-2">
                        {{ course.course?.name || 'Sin nombre de curso' }}
                    </h2>
                    
                    <div class="flex flex-wrap gap-4 pt-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-users text-xs text-base-content/20"></i>
                            <span class="text-[11px] font-black uppercase tracking-widest text-base-content/40">{{ $any(course).enrolledStudents || 0 }} Inscritos</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-calendar-day text-xs text-base-content/20"></i>
                            <span class="text-[11px] font-black uppercase tracking-widest text-base-content/40">{{ $any(course).academicYear?.year || '2024' }}</span>
                        </div>
                    </div>
                </div>

                <div class="mt-10 pt-6 border-t border-base-100 flex items-center justify-between group-hover:border-primary/10 transition-colors">
                    <a [routerLink]="['/virtual-classroom', course.id]" 
                       class="w-full h-12 inline-flex items-center justify-center font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white shadow-lg hover:shadow-primary/20 group/btn">
                        Ingresar Ahora <i class="fa-solid fa-arrow-right ml-3 text-[10px] transform group-hover/btn:translate-x-1 transition-transform"></i>
                    </a>
                </div>
              </div>
            </div>
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
