import { signalStore, withState, withMethods } from '@ngrx/signals';
import { Competency } from '../../types/competency-types';

interface StoreState {
  data: Competency[];
  loading: boolean;
  error: string | null;
}

const initialState: StoreState = {
  data: [],
  loading: false,
  error: null,
};

export const CompetencyStore = signalStore(
  { providedIn: 'root' },
  withState<StoreState>(initialState),
  withMethods(() => ({
    // CRUD methods here
  })),
);
