import { signalStore, withState, withMethods } from '@ngrx/signals';
import { Course } from '../../types/course-types';

interface StoreState {
  data: Course[];
  loading: boolean;
  error: string | null;
}

const initialState: StoreState = {
  data: [],
  loading: false,
  error: null,
};

export const CourseStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods(() => ({
    // CRUD methods here
  })),
);
