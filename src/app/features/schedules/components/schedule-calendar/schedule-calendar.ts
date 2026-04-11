import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { Schedule } from '../../types/schedule-types';
import {
  DAY_ORDER,
  DAY_LABELS,
  HOUR_END,
  HOUR_START,
  SLOT_HEIGHT_PX,
  SLOTS_PER_HOUR,
} from '../../config/schedule.constants';

@Component({
  selector: 'sga-schedule-calendar',

  imports: [CommonModule, ZardPopoverDirective, ZardPopoverComponent],
  templateUrl: './schedule-calendar.html',
  styleUrls: ['./schedule-calendar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleCalendarComponent {
  schedules = input.required<Schedule[]>();
  loading = input(false);
  edit = output<Schedule>();
  delete = output<Schedule>();
  create = output<void>();

  readonly dayColumns = DAY_ORDER;
  readonly dayLabels = DAY_LABELS;
  readonly timeSlots = computed(() => {
    const slots: string[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
      for (let s = 0; s < SLOTS_PER_HOUR; s++) {
        const mins = s * 30;
        slots.push(`${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  });

  readonly totalSlots = computed(() => this.timeSlots().length);
  readonly gridHeightPx = computed(() => this.totalSlots() * SLOT_HEIGHT_PX);
  readonly hourLabels = computed(() => {
    const hours: number[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) hours.push(h);
    return hours;
  });

  readonly blocksByDay = computed(() => {
    const list = this.schedules();
    const byDay: Record<string, Array<Schedule & { top: number; height: number }>> = {};
    for (const day of DAY_ORDER) {
      byDay[day] = [];
    }
    for (const s of list) {
      const day = s.dayOfWeek;
      const { top, height } = this.getBlockPosition(s);
      if (height > 0) {
        byDay[day] = byDay[day] ?? [];
        byDay[day].push({ ...s, top, height });
      }
    }
    return byDay;
  });

  readonly dayHeightPx = this.gridHeightPx();

  private getBlockPosition(schedule: Schedule): { top: number; height: number } {
    const startMins = this.parseTimeToMinutes(schedule.startAt);
    const endMins = this.parseTimeToMinutes(schedule.endAt);
    const baseMins = HOUR_START * 60;
    const totalMins = (HOUR_END - HOUR_START) * 60;
    const top = Math.max(0, ((startMins - baseMins) / totalMins) * 100);
    const height = Math.min(100 - top, ((endMins - startMins) / totalMins) * 100);
    return { top, height: Math.max(4.6, height) };
  }

  private parseTimeToMinutes(v: string | Date): number {
    let str: string;
    if (typeof v === 'string') {
      str = v.includes('T') ? v.slice(11, 16) : v.slice(0, 5);
    } else {
      const d = new Date(v);
      str = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    const [h, m] = str.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  getBlockColor(schedule: Schedule): string {
    if (schedule.blockType === 'break') {
      return 'from-amber-500 to-orange-500';
    }
    const hash = (schedule.title?.length ?? 0) + (schedule.id?.charCodeAt(0) ?? 0);
    const colors = [
      'from-rose-600 to-rose-500',
      'from-sky-600 to-cyan-500',
      'from-emerald-600 to-green-500',
      'from-violet-600 to-fuchsia-500',
      'from-orange-600 to-amber-500',
    ];
    return colors[hash % colors.length] ?? 'from-rose-600 to-rose-500';
  }

  formatTime(v: string | Date): string {
    if (typeof v === 'string') {
      if (v.includes('T')) return v.slice(11, 16);
      return v.slice(0, 5);
    }
    const d = new Date(v);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  isHourLabel(slot: string): boolean {
    return slot.endsWith(':00');
  }

  getTeacherLabel(schedule: Schedule): string | null {
    const sectionCourse =
      typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse : null;
    const teacher = sectionCourse?.teacher;
    if (!teacher) return null;
    const fullName = [teacher.person?.firstName, teacher.person?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fullName || teacher.teacherCode || teacher.specialization || null;
  }

  getCourseLabel(schedule: Schedule): string | null {
    if (schedule.blockType === 'break') return schedule.title ?? 'Receso';
    const sectionCourse =
      typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse : null;
    return sectionCourse?.course?.name ?? schedule.title ?? null;
  }

  getSectionLabel(schedule: Schedule): string | null {
    const sectionCourse =
      typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse : null;
    return sectionCourse?.section?.name ? `Sección ${sectionCourse.section.name}` : null;
  }

  getGradeLabel(schedule: Schedule): string | null {
    const sectionCourse =
      typeof schedule.sectionCourse === 'object' ? schedule.sectionCourse : null;
    return sectionCourse?.section?.grade?.name ?? null;
  }

  getBlockTag(schedule: Schedule): string {
    return schedule.blockType === 'break' ? 'Receso' : 'Clase';
  }

  openDetail(schedule: Schedule, event?: Event) {
    event?.stopPropagation();
    this.edit.emit(schedule);
  }
}
