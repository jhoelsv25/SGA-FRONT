import type { Schedule } from '../types/schedule-types';

export const DAY_ORDER: Schedule['dayOfWeek'][] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'];

export const DAY_LABELS: Record<Schedule['dayOfWeek'], string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
};

export const HOUR_START = 7;
export const HOUR_END = 24;
export const SLOTS_PER_HOUR = 2; // 30-min slots
export const SLOT_HEIGHT_PX = 40;
