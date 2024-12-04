import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { UserActions } from '@/types/store/actions';
import { User } from '@supabase/supabase-js';

export const createUserSlice: StateCreator<
  AppState,
  [],
  [],
  UserActions
> = (set) => ({
  user: {
    user: null,
  },
  setUser: (user: User | null) =>
    set((state) => ({
      user: {
        ...state.user,
        user,
      },
    })),
}); 