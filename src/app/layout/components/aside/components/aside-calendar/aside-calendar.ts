import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutStore } from '@core/stores/layout.store';
import { ScheduleStore } from '@features/schedules/services/store/schedule.store';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';

@Component({
  selector: 'sga-aside-calendar',

  imports: [CommonModule, ZardIconComponent, ZardButtonComponent, ZardEmptyComponent],
  template: `
    <div class="flex flex-col h-full bg-card/10 backdrop-blur-xl">
      <!-- CALENDAR WIDGET (Minimal) -->
      <div class="p-4 border-b border-border/5">
        <div
          class="bg-card/50 rounded-3xl p-6 border border-border/10 shadow-xl relative overflow-hidden group/mini"
        >
          <div
            class="absolute -top-12 -right-12 size-32 bg-primary/5 rounded-full blur-2xl group-hover/mini:scale-150 transition-transform duration-1000"
          ></div>
          <div class="relative z-10 flex items-center justify-between">
            <div class="space-y-1">
              <h2 class="text-3xl font-black text-foreground inter tracking-tight uppercase">
                {{ now | date: 'dd' }}
              </h2>
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {{ now | date: 'MMMM' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {{ now | date: 'EEEE' }}
              </p>
              <div class="flex items-center gap-1.5 mt-1 justify-end">
                <z-icon zType="calendar" class="size-3 text-primary" />
                <span class="text-[8px] font-black uppercase tracking-widest text-primary/60"
                  >Académico</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SCHEDULE LIST -->
      <div class="p-4 flex items-center justify-between">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Tu Agenda Hoy
        </h3>
        <span
          class="size-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black shadow-inner truncate px-1"
        >
          {{ todaySchedules().length }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4" id="sch-scroll">
        @for (sch of todaySchedules(); track sch.id) {
          <button
            type="button"
            class="group relative w-full pl-6 border-l-2 border-primary/20 hover:border-primary transition-all duration-300 text-left"
            (click)="openSchedule(sch)"
          >
            <div
              class="absolute -left-2 top-0 size-4 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center overflow-hidden"
            >
              <div class="size-1.5 rounded-full bg-primary animate-pulse"></div>
            </div>

            <div
              class="bg-card/40 p-5 rounded-2xl border border-border/5 hover:bg-card/60 hover:border-primary/10 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <z-icon zType="clock" class="size-3 text-primary/60" />
                  <span class="text-[10px] font-bold uppercase tracking-tight text-foreground/70"
                    >{{ sch.startAt }} - {{ sch.endAt }}</span
                  >
                </div>
                <!-- ACTIVE INDICATOR -->
                <div
                  class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[7px] font-black uppercase tracking-widest border border-green-500/10"
                >
                  EN VIVO
                </div>
              </div>

              <h4
                class="text-xs font-black text-foreground inter tracking-tight group-hover:text-primary transition-colors uppercase leading-snug"
              >
                {{ sch.title }}
              </h4>

              <div class="flex items-center gap-4 mt-3 opacity-60">
                <div class="flex items-center gap-1.5 min-w-0">
                  <z-icon zType="map-pin" class="size-3 text-muted-foreground" />
                  <span
                    class="text-[9px] font-bold uppercase truncate tracking-tighter text-muted-foreground"
                    >{{ sch.classroom }}</span
                  >
                </div>
                <div class="flex items-center gap-1.5 min-w-0">
                  <z-icon zType="users" class="size-3 text-muted-foreground" />
                  <span
                    class="text-[9px] font-bold uppercase truncate tracking-tighter text-muted-foreground"
                    >42 EST.</span
                  >
                </div>
              </div>
            </div>
          </button>
        } @empty {
          <div class="h-full flex flex-col items-center justify-center py-20 opacity-40">
            <z-empty
              zIcon="calendar"
              zTitle="Día libre"
              zDescription="No hay clases programadas para hoy."
            />
          </div>
        }
      </div>

      <!-- FOOTER -->
      <div class="p-6 bg-card/5 backdrop-blur-3xl border-t border-border/5">
        <button
          z-button
          zType="outline"
          zSize="lg"
          class="w-full rounded-2xl gap-3 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm active:scale-95 transition-all h-14"
          (click)="goToSchedules()"
        >
          <z-icon zType="layout-grid" class="size-4" />
          Ver Horario Completo
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      #sch-scroll::-webkit-scrollbar {
        display: none;
      }
      #sch-scroll {
        scrollbar-width: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideCalendar implements OnInit {
  public store = inject(ScheduleStore);
  private readonly router = inject(Router);
  private readonly layout = inject(LayoutStore);
  public now = new Date();
  private readonly dayMap = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const;
  readonly todaySchedules = computed(() => {
    const todayKey = this.dayMap[this.now.getDay()];
    return this.store
      .data()
      .filter((schedule) => schedule.dayOfWeek === todayKey)
      .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
  });

  ngOnInit() {
    this.store.loadAll();
  }

  goToSchedules(): void {
    this.router.navigateByUrl('/organization/schedules');
    this.layout.closeAside();
  }

  openSchedule(schedule: any): void {
    const sectionCourseId =
      typeof schedule?.sectionCourse === 'string'
        ? schedule.sectionCourse
        : schedule?.sectionCourse?.id;

    if (sectionCourseId) {
      this.router.navigateByUrl(`/virtual-classroom/${sectionCourseId}/timeline`);
    } else {
      this.router.navigateByUrl('/organization/schedules');
    }

    this.layout.closeAside();
  }
}
