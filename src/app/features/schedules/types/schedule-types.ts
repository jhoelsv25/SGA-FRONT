export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type ScheduleBlockType = 'class' | 'break';

export type Schedule = {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  description?: string;
  blockType?: ScheduleBlockType;
  startAt: string | Date;
  endAt: string | Date;
  classroom: string;
  sectionCourse?:
    | string
    | null
    | {
        id: string;
        section?: { id: string; name?: string; grade?: { id?: string; name?: string } };
        course?: { id: string; name?: string };
        teacher?: {
          id: string;
          teacherCode?: string;
          specialization?: string;
          person?: { firstName?: string; lastName?: string };
        };
      };
};

export type ScheduleCreate = {
  title: string;
  dayOfWeek: DayOfWeek;
  description?: string;
  blockType?: ScheduleBlockType;
  startAt: string;
  endAt: string;
  classroom: string;
  sectionCourse?: string;
};

export type ScheduleUpdate = Partial<ScheduleCreate>;
