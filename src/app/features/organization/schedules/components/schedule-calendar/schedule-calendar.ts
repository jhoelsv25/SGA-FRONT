import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Schedule } from '../../types/schedule-types';
import { DAY_ORDER, DAY_LABELS, HOUR_END, HOUR_START, SLOTS_PER_HOUR } from '../../config/schedule.constants';

@Component({
  selector: 'sga-schedule-calendar',
  standalone: true,
  imports: [CommonModule],
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

  readonly dayHeightPx = (HOUR_END - HOUR_START) * 60;

  private getBlockPosition(schedule: Schedule): { top: number; height: number } {
    const startMins = this.parseTimeToMinutes(schedule.startAt);
    const endMins = this.parseTimeToMinutes(schedule.endAt);
    const baseMins = HOUR_START * 60;
    const totalMins = (HOUR_END - HOUR_START) * 60;
    const top = Math.max(0, ((startMins - baseMins) / totalMins) * 100);
    const height = Math.min(100 - top, ((endMins - startMins) / totalMins) * 100);
    return { top, height: Math.max(2, height) };
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
    const hash = (schedule.title?.length ?? 0) + (schedule.id?.charCodeAt(0) ?? 0);
    const colors = [
      'from-primary/90 to-primary/70',
      'from-info/90 to-info/70',
      'from-success/90 to-success/70',
      'from-warning/90 to-warning/70',
      'from-secondary/90 to-secondary/70',
    ];
    return colors[hash % colors.length] ?? 'from-primary/90 to-primary/70';
  }

  formatTime(v: string | Date): string {
    if (typeof v === 'string') {
      if (v.includes('T')) return v.slice(11, 16);
      return v.slice(0, 5);
    }
    const d = new Date(v);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}
