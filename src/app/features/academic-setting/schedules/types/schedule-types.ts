export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type Schedule = {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  description?: string;
  startAt: string | Date;
  endAt: string | Date;
  classroom: string;
  sectionCourse?: string | { id: string };
};

export type ScheduleCreate = {
  title: string;
  dayOfWeek: DayOfWeek;
  description?: string;
  startAt: string;
  endAt: string;
  classroom: string;
  sectionCourse: string;
};

export type ScheduleUpdate = Partial<ScheduleCreate>;
